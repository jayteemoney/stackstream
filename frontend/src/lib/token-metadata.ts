/**
 * SIP-010 token metadata resolution.
 *
 * WHY THIS EXISTS
 *
 * The protocol is permissionless: `stream-manager.clar` takes the token as a
 * `(token <sip-010-trait>)` argument and stores `(contract-of token)`. Any
 * SIP-010 token can be streamed. But every consumer of a stream also needs
 * three facts about that token, and none of them can be guessed:
 *
 *   1. assetName — the `define-fungible-token` name, used verbatim in Clarity
 *      post-conditions. NOT the same as `get-name`. USDA's `get-name` returns
 *      "USDA" while its asset name is "usda". Canonical sBTC's asset name is
 *      "sbtc-token", not "sbtc".
 *   2. decimals — for scaling raw uint amounts. USDA and stSTX are 6, sBTC
 *      and ALEX are 8, so hardcoding 8 misreports a 6-decimal deposit by 100x.
 *   3. symbol — display only.
 *
 * Guessing any of these is actively dangerous. A wrong `assetName` makes the
 * wallet reject the transaction via its post-condition check; the user sees
 * "a post-condition was not met" with no indication of the real cause. A wrong
 * `decimals` makes a 100-token top-up send 100x the intended amount.
 *
 * So this module resolves metadata from the chain and, when it cannot prove a
 * value, returns null. Callers must handle null by refusing the action rather
 * than substituting a default. See `resolveTokenMetadata` and
 * `getTokenConfigByContractId` below.
 *
 * Pure and network-free by design: the actual fetching lives in
 * `token-metadata-client.ts`, which keeps this file testable without a network
 * or a wallet.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * A token's proven metadata. Every field is required, and every field must
 * come from the chain (or from a hand-verified entry in the curated list) —
 * never from a default.
 */
export interface ResolvedToken {
  /** Fully-qualified `deployer.contract-name`, e.g. "SP2C2...ZM.usda-token" */
  contractId: string;
  /** The `define-fungible-token` name. Goes into post-conditions verbatim. */
  assetName: string;
  /** SIP-010 `get-decimals`. Raw amounts are scaled by 10^decimals. */
  decimals: number;
  /** Display symbol. Derived from `get-symbol`, or the asset name as a fallback. */
  symbol: string;
  /** True when this came from the hand-verified curated list, not a chain read. */
  curated: boolean;
}

export interface TokenConfig extends ResolvedToken {
  name: string;
  icon?: string;
  description?: string;
}

// ============================================================================
// Curated mainnet list
// ============================================================================

/**
 * Hand-verified metadata for the mainnet tokens the UI surfaces in its
 * selector.
 *
 * This list exists for two reasons, neither of which is "the protocol only
 * supports these tokens":
 *
 *   1. Curated entries cost zero network round-trips, so the common path is
 *      instant and cannot fail.
 *   2. The selector needs display metadata (name, description, icon) that
 *      cannot be read off-chain.
 *
 * A stream in any token OUTSIDE this list still resolves correctly — the
 * resolver reads the chain instead. Identity here is the full contract id,
 * never the symbol: there are two mainnet USDA contracts and several ALEX
 * ones, so a symbol-keyed allowlist would resolve the wrong contract.
 *
 * The assetName values were verified against
 * `/v2/contracts/interface/{deployer}/{contract}` on mainnet. Note sBTC and
 * ALEX each define a second `-locked` asset; the canonical transferable asset
 * is the un-suffixed one, which is why this list records an explicit assetName
 * rather than letting the resolver pick one from an ambiguous set.
 */
const CURATED: readonly TokenConfig[] = [
  {
    contractId: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
    assetName: "sbtc-token",
    decimals: 8,
    symbol: "sBTC",
    name: "Stacks BTC",
    curated: true,
    icon: "/bitcoin.svg",
    description: "Native Bitcoin on Stacks — the flagship streaming token",
  },
  {
    contractId: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token",
    assetName: "usda",
    decimals: 6,
    symbol: "USDA",
    name: "USDA",
    curated: true,
    icon: "/usda.svg",
    description: "Arkadiko USD stablecoin — ideal for stable payroll streams",
  },
  {
    contractId: "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex",
    assetName: "alex",
    decimals: 8,
    symbol: "ALEX",
    name: "ALEX",
    curated: true,
    icon: "/alex.svg",
    description: "ALEX DeFi protocol token",
  },
  {
    contractId: "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin",
    assetName: "wrapped-bitcoin",
    decimals: 8,
    symbol: "xBTC",
    name: "Wrapped Bitcoin",
    curated: true,
    icon: "/bitcoin.svg",
    description: "Tokenized Bitcoin on Stacks",
  },
];

// ============================================================================
// Curated list lookup
// ============================================================================

/**
 * Extra curated entries, registered by `constants.ts`.
 *
 * The mock testnet token's contract id depends on the deployer address, so it
 * cannot be hardcoded here without importing `constants.ts` — which imports
 * this module. A tiny registry breaks the cycle without a dependency inversion.
 */
const EXTRA: TokenConfig[] = [];

/**
 * Register a network-specific curated entry (used for the testnet mock token).
 *
 * Re-registering the same contract id is ignored rather than overwritten, so
 * this is idempotent and cannot be used to swap the asset name of an already
 * curated token.
 */
export function registerCuratedToken(token: TokenConfig): void {
  if (!getCuratedToken(token.contractId)) {
    EXTRA.push(token);
  }
}

/** Look up a curated entry by full contract id. Never matches on symbol. */
export function getCuratedToken(contractId: string): TokenConfig | null {
  return (
    CURATED.find((t) => t.contractId === contractId) ??
    EXTRA.find((t) => t.contractId === contractId) ??
    null
  );
}

/**
 * Curated tokens, in selector display order. This is a UI seed list, NOT a
 * protocol allowlist — see the module docstring.
 *
 * Pass `network` to get only the tokens deployed there, so a testnet build
 * never offers a mainnet contract its wallet cannot transact with.
 */
export function getCuratedTokens(network?: StacksNetworkName): readonly TokenConfig[] {
  const all = [...CURATED, ...EXTRA];
  return network ? all.filter((t) => contractIdNetwork(t.contractId) === network) : all;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * SIP-010 permits 0..38 decimals (uint128 range). Values outside that are
 * either a misparse or a malicious contract, and either way we refuse rather
 * than scale amounts with them.
 */
export function isValidDecimals(decimals: unknown): decimals is number {
  return Number.isInteger(decimals) && (decimals as number) >= 0 && (decimals as number) <= 38;
}

/**
 * A Clarity asset name is a printable ASCII string of at most 128 chars.
 * Rejecting anything else keeps a hostile contract from injecting control
 * characters into post-conditions or the UI.
 */
const ASSET_NAME_RE = /^[\x20-\x7e]{1,128}$/;

export function isValidAssetName(name: unknown): name is string {
  return typeof name === "string" && ASSET_NAME_RE.test(name);
}

export type StacksNetworkName = "mainnet" | "testnet";

/**
 * Shape check for `deployer.contract-name`, run before an id is used in a URL
 * or rendered. Accepts both networks' version bytes: `SP`/`SM` are mainnet,
 * `ST`/`SN` are testnet. Which network an id belongs to is a separate question,
 * answered by `contractIdNetwork`, so this stays a pure shape filter.
 */
const CONTRACT_ID_RE = /^S[PMTN][A-Z0-9]{38,40}\.[a-zA-Z0-9\-_!?+<>=/*]{1,128}$/;

export function isValidContractId(contractId: unknown): contractId is string {
  return typeof contractId === "string" && CONTRACT_ID_RE.test(contractId);
}

/** The network a well-formed contract id belongs to, from its version byte. */
export function contractIdNetwork(contractId: string): StacksNetworkName | null {
  if (!isValidContractId(contractId)) return null;
  return contractId[1] === "P" || contractId[1] === "M" ? "mainnet" : "testnet";
}

/**
 * True when the id is well formed AND deployed on `network`. A mainnet app
 * reading a testnet contract gets a confusing "not found" from the node, so
 * callers check this first and say which network the id is actually on.
 */
export function isContractIdOnNetwork(
  contractId: unknown,
  network: StacksNetworkName
): contractId is string {
  return isValidContractId(contractId) && contractIdNetwork(contractId) === network;
}

/**
 * Parse a `define-fungible-token` list from `/v2/contracts/interface` into the
 * single asset name we can prove.
 *
 * A contract may define several fungible tokens — canonical sBTC defines both
 * `sbtc-token` and `sbtc-token-locked`, ALEX defines `alex` and `alex-locked`.
 * Picking `fungible_tokens[0]` would be a coin flip, and a wrong pick means a
 * post-condition names an asset the transaction never touches, so the wallet
 * rejects it. Therefore:
 *
 *   - exactly one fungible token  -> unambiguous, accept it
 *   - more than one               -> ambiguous, return null and refuse
 *
 * Curated tokens bypass this entirely because their asset name was verified by
 * hand. For an uncurated multi-asset token the caller must supply the asset
 * name from a trusted source (see `resolveTokenMetadata` in the client).
 */
export function pickUnambiguousAssetName(
  fungibleTokens: readonly { name?: unknown }[] | null | undefined
): string | null {
  if (!Array.isArray(fungibleTokens) || fungibleTokens.length === 0) return null;
  const names = fungibleTokens
    .map((f) => f?.name)
    .filter((n): n is string => isValidAssetName(n));
  if (names.length !== fungibleTokens.length) return null; // a malformed entry
  if (names.length !== 1) return null; // ambiguous
  return names[0];
}

// ============================================================================
// Display helpers
// ============================================================================

/**
 * A display label for a token we could not fully resolve. Deliberately shows
 * the asset identity rather than a plausible-looking symbol, so a user is
 * never shown "sBTC" over a balance that is actually some other token.
 */
export function unresolvableTokenLabel(contractId: string): string {
  const contractName = contractId.split(".")[1];
  return contractName ?? contractId;
}

/**
 * Convert a human-entered amount into raw token units.
 *
 * Done with integer string arithmetic rather than floating point: `parseFloat`
 * loses precision well before 1e15, and a silently rounded top-up amount is a
 * fund-safety bug, not a cosmetic one.
 *
 * Returns null when the input is not a clean positive decimal, so callers can
 * reject it rather than send something the user did not ask for.
 */
export function toRawAmount(amount: string, decimals: number): bigint | null {
  if (!isValidDecimals(decimals)) return null;
  const trimmed = amount.trim();
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === "" || trimmed === ".") return null;

  const [wholePart, fractionPart = ""] = trimmed.split(".");
  // Truncate rather than round: never send more than the user typed.
  const padded = (fractionPart + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${wholePart || "0"}${padded}`;
  const raw = BigInt(combined);
  return raw > 0n ? raw : null;
}

/**
 * True when `amount` has more fractional digits than the token can represent.
 *
 * `toRawAmount` truncates those digits rather than round up, so it never sends
 * more than the user typed. Truncating silently would still send less than they
 * typed, so forms check this first and ask the user to fix the amount.
 */
export function hasExcessPrecision(amount: string, decimals: number): boolean {
  const fraction = amount.trim().split(".")[1] ?? "";
  return fraction.replace(/0+$/, "").length > decimals;
}

/** Convert raw token units into a decimal string, without floating point. */
export function fromRawAmount(raw: bigint, decimals: number): string {
  if (!isValidDecimals(decimals)) return "0";
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  if (fraction === 0n) return whole.toString();
  const fracStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr}`;
}
