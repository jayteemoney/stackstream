/**
 * Token discovery over Hiro's Token Metadata API.
 *
 * WHY THIS EXISTS
 *
 * `stream-manager.clar` is permissionless, but the create-stream selector was a
 * hardcoded list of four curated tokens. A team that wanted to stream its own
 * SIP-010 token had no way to select it without a code change, which blocks
 * onboarding even though the protocol already supports it.
 *
 * Hiro's Token Metadata API indexes every SIP-010 token that has ever been
 * deployed (`/metadata/v1/ft`, ~5.6k entries). That makes it usable as a
 * DISCOVERY surface. It is emphatically NOT usable as a trust surface, for two
 * reasons that shaped this whole module:
 *
 *   1. It is a list of everything anyone ever deployed, not a list of
 *      streamable assets. A large fraction of rows have no symbol, no name and
 *      no supply. Sampling the default listing order showed 0% usable rows in
 *      the first few hundred — a raw dropdown would open on blank entries.
 *   2. Symbols are trivially forgeable. `symbol=sBTC` returns 32 contracts
 *      including `buttcoin-stxcity` and `sBTC-mock-vpv-10`. Showing a
 *      user a flat list of 5.6k rows where "sBTC" appears 32 times, with no
 *      way to tell the canonical one apart, is how value gets sent to an
 *      impersonator.
 *
 * Therefore: this module is for FINDING tokens and LABELLING their risk. It is
 * never the source of truth for a transaction. `assetName` and `decimals` used
 * in a post-condition must come from the chain resolver in
 * `token-metadata-client.ts`, which reads them from the contract itself.
 * `verifySelection` below enforces that ordering at the one place a selection
 * becomes an executable token.
 *
 * Splitting it this way means the registry can be wrong, stale, or completely
 * down without any path to a misdirected payment — the worst it can do is
 * suggest a token, or refuse to suggest one.
 */

import { isValidContractId as isWellFormedContractId, type ResolvedToken } from "./token-metadata";
import { HIRO_API_BASE } from "./constants";

/** Fully-qualified `deployer.contract-name`, e.g. "SP2C2…ZM.usda-token". */
export type ContractId = string;

/** Risk classification for a discovered token, surfaced in the UI. */
export type TokenTrust =
  /** Hand-verified in `token-metadata.ts`. Safe to proceed without extra steps. */
  | "curated"
  /** Claims the symbol of a curated token but is not it. Suspicious by construction. */
  | "impersonator"
  /** Indexed and usable, but not on the curated list. */
  | "unverified"
  /** Indexed, but too incomplete to stream usefully. */
  | "unusable";

/**
 * A token as offered by the registry, before chain verification.
 *
 * Every field is a hint. `assetName` and `decimals` MUST be re-proven on-chain
 * before they reach a transaction — see `token-metadata-client.ts`.
 */
export interface DiscoveredToken {
  contractId: ContractId;
  /** Asset name as the registry indexed it. Advisory until chain-verified. */
  assetName: string;
  /** Advisory until chain-verified against SIP-010 `get-decimals`. */
  decimals: number;
  symbol: string;
  name: string;
  description?: string;
  icon?: string;
  totalSupply?: string;
  /** Trust level for display. Derived, never trusted from the API. */
  trust: TokenTrust;
  /** Populated when `trust` is "impersonator": the curated token it mimics. */
  impersonates?: ContractId;
  /** Why this token is unusable, when `trust` is "unusable". */
  unusableReason?: string;
  /**
   * Non-blocking cautions, shown next to the token.
   *
   * These deliberately do NOT prevent selection. A team deploying a token today
   * must not hit a wall because its registry row is incomplete, and an indexer
   * lagging a fresh mint is a fact about the indexer, not about the token.
   */
  warnings?: readonly string[];
}

// ============================================================================
// Types
// ============================================================================

/**
 * Display order, best first.
 *
 * Ordering is a safety property, not a cosmetic one: an entry that cannot
 * receive a stream must never appear above a usable one, and an impersonator
 * must be visibly below the token it is imitating.
 */
const TRUST_RANK: Record<TokenTrust, number> = {
  curated: 0,
  unverified: 1,
  impersonator: 2,
  unusable: 3,
};

/**
 * Trust level that is never offered for selection.
 *
 * "unusable" is not a trust judgement, it is the absence of an identity. There
 * is nothing to warn about when there is no asset name: the row cannot name the
 * contract it claims to be, so no amount of confirmation makes it safe to put
 * in a post-condition. Every other shortcoming is a warning.
 *
 * Note what is deliberately NOT here: a missing symbol, and a reported supply
 * of zero. Neither can misroute funds. A wrong asset name or decimals is the
 * thing that moves money, and that is settled by the chain resolver in
 * `verifySelection`, never by a listing.
 */
const UNUSABLE: Pick<DiscoveredToken, "trust" | "unusableReason"> = {
  trust: "unusable",
  unusableReason: "No asset name — this listing cannot identify the token it describes",
};

/** Raw row shape from `/metadata/v1/ft`. Every field may be absent or empty. */
export interface RegistryRow {
  contract_principal?: string;
  asset_identifier?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  total_supply?: string;
  description?: string;
  image_canonical_uri?: string;
  image_uri?: string;
}

interface RegistryListResponse {
  limit?: number;
  offset?: number;
  total?: number;
  results?: RegistryRow[];
}

// ============================================================================
// Configuration
// ============================================================================

// Defaults to the Hiro API for the network the app runs on, so a testnet build
// searches testnet tokens rather than offering mainnet contracts it cannot use.
const API_BASE =
  process.env.NEXT_PUBLIC_HIRO_API_BASE?.replace(/\/$/, "") ?? HIRO_API_BASE;

/** Registry page size. The API caps this at 60. */
export const REGISTRY_PAGE_SIZE = 60;

/** Below this many characters in a search query, don't bother the API. */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Upper bound on how many results we will render.
 *
 * 5.6k exists; showing it all helps nobody and makes the list unreadable. The
 * curated tokens are always available regardless of this cap.
 */
export const MAX_RESULTS = 25;

// ============================================================================
// Pure helpers — no network, fully unit-tested
// ============================================================================

/**
 * A row from `/metadata/v1/search`.
 *
 * Kept separate from `RegistryRow` because the two endpoints genuinely disagree:
 * `/ft` returns `contract_principal` + `asset_identifier`, while `/search`
 * returns `contract_id` + `token_number` and NO asset identifier at all. The
 * missing asset name is why there is no `lookupContract` here — see the note
 * on `classifyResolved`.
 */
export interface RegistrySearchRow {
  contract_id?: string;
  token_number?: number;
  token_type?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  total_supply?: string;
  description?: string;
  image_canonical_uri?: string;
  image_uri?: string;
}

/**
 * Validate a contract id shape before it is used in a URL path or rendered.
 *
 * This is a sanity filter, not authentication — a contract id is not a
 * capability. Its job is to reject typos and hostile strings early.
 */
export function isValidContractId(value: unknown): value is ContractId {
  return isWellFormedContractId(value);
}

/**
 * Split a registry `asset_identifier` into its principal and asset name.
 *
 * The registry returns `SP….contract-name::asset-name`. The asset name is the
 * `define-fungible-token` name — the exact string a Clarity post-condition
 * needs. USDA's is `usda`, NOT the `USDA` that `get-name` returns; conflating
 * the two makes the wallet reject the transfer with no useful message.
 *
 * Returns null when the identifier is malformed or the asset part is missing,
 * which is common in this registry and must not be papered over.
 */
export function parseAssetIdentifier(
  identifier: string,
): { contractId: ContractId; assetName: string } | null {
  const sep = identifier.indexOf("::");
  if (sep <= 0) return null;
  const contractId = identifier.slice(0, sep);
  const assetName = identifier.slice(sep + 2);
  if (!isValidContractId(contractId)) return null;
  if (assetName.length === 0) return null;
  return { contractId, assetName };
}

/**
 * Normalize a registry row into a `DiscoveredToken`, or null if it cannot be
 * used to identify a contract at all.
 *
 * Returns null — rather than a partially-filled token — when the contract id
 * or asset name is missing. A token we cannot name exactly is not selectable.
 */
export function normalizeRegistryRow(row: RegistryRow): Omit<
  DiscoveredToken,
  "trust" | "impersonates" | "unusableReason" | "warnings"
> | null {
  const principal = row.contract_principal?.trim();
  if (!principal || !isValidContractId(principal)) return null;

  // Prefer asset_identifier (carries the asset name); fall back to the principal,
  // in which case the asset name is unknown and must not be invented.
  const parsed = row.asset_identifier ? parseAssetIdentifier(row.asset_identifier) : null;
  const assetName = parsed?.contractId === principal ? parsed.assetName : "";
  if (!assetName) return null;

  const decimals = row.decimals;
  if (!Number.isInteger(decimals) || (decimals as number) < 0 || (decimals as number) > 38) {
    return null;
  }

  return {
    contractId: principal,
    assetName,
    decimals: decimals as number,
    symbol: row.symbol?.trim() ?? "",
    name: row.name?.trim() ?? "",
    description: row.description?.trim() || undefined,
    icon: row.image_canonical_uri || row.image_uri || undefined,
    totalSupply: row.total_supply?.trim() || undefined,
  };
}

/** True when supply is present and strictly positive. */
export function hasPositiveSupply(token: Pick<DiscoveredToken, "totalSupply">): boolean {
  if (!token.totalSupply) return false;
  try {
    return BigInt(token.totalSupply) > 0n;
  } catch {
    return false;
  }
}

/**
 * Distinguish "definitely has no supply" from "supply unknown".
 *
 * These are very different states and conflating them blocks real onboarding.
 * A token reached via the deep-link or manual path carries no supply figure at
 * all — Hiro's `/search` endpoint does not return one — and treating unknown as
 * zero would make every unindexed token unselectable, which is precisely the
 * case that path exists to serve.
 */
export function isConfirmedEmpty(token: Pick<DiscoveredToken, "totalSupply">): boolean {
  if (!token.totalSupply) return false;
  try {
    return BigInt(token.totalSupply) === 0n;
  } catch {
    return false;
  }
}

/**
 * Classify a token for display.
 *
 * `curatedIds` and `curatedSymbols` come from the hand-verified list. A token
 * that reuses a curated symbol but is not that token is the impersonation case
 * we care most about — that is exactly how `buttcoin-stxcity` presents itself.
 *
 * POLICY: warn, never block. An incomplete listing is a fact about the
 * indexer's record of the token, not proof that the token is unsafe to stream.
 *
 *   - No asset name is the sole exception, because it is not a warning, it is an
 *     identity. See `UNUSABLE`.
 *   - A missing symbol is a warning. The asset name and decimals still come from
 *     the chain, so a token that publishes no ticker is fully streamable; the
 *     chain resolver can supply the symbol from `get-symbol`.
 *   - A reported supply of zero is a warning. Supply is a hint, it lags, and a
 *     transfer that cannot execute fails loudly on-chain and costs a fee. It
 *     cannot send funds to the wrong place. Blocking here would also fail the
 *     exact case this feature exists to serve: a team whose token was deployed
 *     minutes ago and has not been indexed with a supply yet.
 *
 * The one thing that does move money — asset name and decimals — is settled on
 * chain in `verifySelection`, after this function runs. Classification decides
 * what the user is *told*; verification decides what they can *spend*.
 */
export function classifyToken(
  token: Pick<DiscoveredToken, "contractId" | "symbol" | "totalSupply" | "assetName">,
  curatedIds: readonly ContractId[],
  curatedSymbols: ReadonlyMap<string, ContractId>,
): Pick<DiscoveredToken, "trust" | "impersonates" | "unusableReason" | "warnings"> {
  if (curatedIds.includes(token.contractId)) return { trust: "curated" };

  if (!token.assetName) return { ...UNUSABLE };

  const warnings: string[] = [];
  if (!token.symbol) {
    warnings.push("This listing publishes no ticker. The symbol is read from the contract.");
  }
  if (isConfirmedEmpty(token)) {
    warnings.push(
      "This listing reports no supply. It may just be unindexed — the transfer will fail if the contract cannot move it.",
    );
  }

  const canonical = token.symbol ? curatedSymbols.get(token.symbol.toLowerCase()) : undefined;
  if (canonical && canonical !== token.contractId) {
    return {
      trust: "impersonator",
      impersonates: canonical,
      ...(warnings.length ? { warnings } : {}),
    };
  }

  return warnings.length ? { trust: "unverified", warnings } : { trust: "unverified" };
}

/**
 * Apply trust classification to a batch, preserving registry order.
 *
 * Curated tokens always sort first regardless of registry order, then verified
 * assets, then impersonators and unusable entries last — an entry that cannot
 * receive a stream should never sit above a real one.
 */
export function classifyAll(
  rows: readonly Omit<DiscoveredToken, "trust" | "impersonates" | "unusableReason" | "warnings">[],
  curatedIds: readonly ContractId[],
  curatedSymbols: ReadonlyMap<string, ContractId>,
): DiscoveredToken[] {
  // Ordering is applied by dedupeByContract below, so it is enforced in exactly
  // one place and cannot be forgotten by a caller.
  return rows.map((row) => ({ ...row, ...classifyToken(row, curatedIds, curatedSymbols) }));
}

/**
 * Deduplicate by contract id, keeping the highest-trust entry for each.
 *
 * The registry can return the same contract more than once (one row per
 * indexed asset), and a duplicate in a payment selector invites a wrong pick.
 */
export function dedupeByContract(tokens: readonly DiscoveredToken[]): DiscoveredToken[] {
  const best = new Map<ContractId, DiscoveredToken>();
  for (const token of tokens) {
    const existing = best.get(token.contractId);
    if (!existing || TRUST_RANK[token.trust] < TRUST_RANK[existing.trust]) {
      best.set(token.contractId, token);
    }
  }
  // Sort here rather than leaving it to callers. Ordering is a safety property,
  // not a cosmetic one: an entry that cannot receive a stream must never sit
  // above a real one, and a caller that forgets to sort would silently put it
  // there. Equal ranks keep insertion order, so curated tokens stay in the
  // curated list's order.
  return [...best.values()].sort((a, b) => TRUST_RANK[a.trust] - TRUST_RANK[b.trust]);
}

// ============================================================================
// Deep links
// ============================================================================

/**
 * Read a `?token=` deep link.
 *
 * A link is how users actually obtain a contract id — teams put
 * `/dashboard/create?token=SP….usda-token` in their docs or Slack, and the
 * recipient never types a 41-character string. So this path has to be as safe
 * as manual entry, not a shortcut around it.
 *
 * Accepts a full principal, or an `SP….contract::asset` pair. Returns null for
 * anything malformed; the caller then falls back to the curated default and
 * lets the user choose deliberately.
 */
export function parseTokenDeepLink(raw: string | null | undefined): ContractId | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  // Tolerate `SP….contract::asset` — take the principal, which is what we
  // verify; the asset name is re-proven on-chain rather than trusted from here.
  const withoutAsset = value.split("::")[0] ?? value;
  return isValidContractId(withoutAsset) ? withoutAsset : null;
}

/**
 * Build a candidate for the deep-link / manual path from CHAIN-proven metadata.
 *
 * This is how a token the registry cannot fully describe still gets impersonation
 * checks. The registry's `/search` endpoint does not return an asset identifier,
 * so `assetName` and `decimals` come from the resolver here — which is the
 * authoritative source anyway — and only the cosmetic fields would have come
 * from the registry.
 *
 * Using the chain-derived symbol for classification is what makes the deep-link
 * path as safe as search: `buttcoin-stxcity` reports symbol `sBTC` on-chain too,
 * so it is caught either way.
 */
export function candidateFromResolved(
  resolved: ResolvedToken,
  decorations: TokenDecorations = {},
): RegistryCandidate {
  return {
    contractId: resolved.contractId,
    assetName: resolved.assetName,
    decimals: resolved.decimals,
    symbol: resolved.symbol,
    name: decorations.name ?? resolved.symbol,
    description: decorations.description,
    icon: decorations.icon,
  };
}

// ============================================================================
// Verification gate
// ============================================================================

/**
 * The outcome of turning a registry suggestion into a streamable token.
 *
 * `status` is deliberately a three-state union rather than a boolean so the UI
 * can distinguish "this token is fine but unverified" from "this token is not
 * streamable" — the latter must never leave the user on a submit button that
 * cannot succeed.
 */
export type VerifyStatus =
  /** Curated, or uncurated but fully verified on-chain. */
  | "verified"
  /** The listing disagrees with the chain. Not selectable until the user re-picks. */
  | "unverified"
  /** Cannot be verified, so it must not be streamed. */
  | "unverifiable";

export interface VerifiedSelection {
  status: VerifyStatus;
  /** Chain-proven metadata. Null unless `status` is "verified", so nothing else can be streamed. */
  resolved: ResolvedToken | null;
  /** Human-readable reason, shown when status is not "verified". */
  reason?: string;
  /** Populated when a curated symbol is claimed by a different contract. */
  impersonates?: ContractId;
}

/**
 * The single point where a discovered token becomes streamable.
 *
 * This exists so that no caller can skip it. The rule is one-directional and
 * absolute:
 *
 *   - `assetName` and `decimals` MUST come from the chain resolver. The
 *     registry is never allowed to supply either, no matter how confident it
 *     looks. It has agreed with the chain in every spot check, but "has always
 *     agreed" is not a property a payment can depend on, and an indexer is one
 *     deploy behind the chain forever.
 *   - If the registry and the chain disagree on either field, the result is
 *     downgraded to "unverified" rather than trusting either side.
 *   - A null from the resolver is "unverifiable", never a fallback to a default
 *     token. Falling back to sBTC is what used to put the wrong asset name in
 *     post-conditions.
 *
 * Verified-but-new tokens resolve to `status: "verified"` with no friction,
 * which is what keeps the selector from blocking legitimate team onboarding.
 */
export async function verifySelection(
  discovered: DiscoveredToken,
  resolve: (contractId: ContractId) => Promise<ResolvedToken | null>,
): Promise<VerifiedSelection> {
  const impersonates = discovered.impersonates;

  // `warnings` are deliberately not consulted here. They describe the listing,
  // not the asset, and the asset is what this function is about to prove. Only
  // a missing identity short-circuits, and only because there is nothing to
  // resolve.
  if (discovered.trust === "unusable") {
    return {
      status: "unverifiable",
      resolved: null,
      reason: discovered.unusableReason ?? "This token cannot receive a stream",
      impersonates,
    };
  }

  const resolved = await resolve(discovered.contractId);
  if (!resolved) {
    return {
      status: "unverifiable",
      resolved: null,
      reason:
        "Could not verify this token's asset name and decimals on-chain. It cannot be streamed safely.",
      impersonates,
    };
  }

  const decimalsAgree = resolved.decimals === discovered.decimals;
  const assetAgrees = resolved.assetName === discovered.assetName;

  if (!decimalsAgree || !assetAgrees) {
    // Refuse rather than silently swap in the chain values: the user picked a
    // listing that described a different asset, and a mismatched asset name
    // can mean a renamed token, a proxy, or something hostile. They can still
    // stream it by entering the contract id, which verifies from the chain.
    return {
      status: "unverified",
      resolved: null,
      reason: !assetAgrees
        ? `Token listing reports asset "${discovered.assetName}" but the contract reports "${resolved.assetName}". Confirm before streaming.`
        : `Token listing reports ${discovered.decimals} decimals but the contract reports ${resolved.decimals}. Confirm before streaming.`,
      impersonates,
    };
  }

  // An impersonator still resolves on-chain (the contract genuinely is that
  // token), so verification alone cannot catch it. It is reported as verified
  // but carries its impersonation forward so the UI can flag it explicitly.
  return { status: "verified", resolved, impersonates };
}

// ============================================================================
// Network client
// ============================================================================

/** A normalized registry row, before trust classification. */
export type RegistryCandidate = Omit<
  DiscoveredToken,
  "trust" | "impersonates" | "unusableReason" | "warnings"
>;

/**
 * Fetch candidate tokens from the registry.
 *
 * Discovery only, and deliberately returns UNCLASSIFIED rows. Trust depends on
 * the curated list, which is app state rather than registry state — so it is
 * applied by the caller via `classifyAll`, and a network function that baked in
 * its own empty curated list would hand back "unverified" for everything and
 * quietly defeat impersonation detection.
 *
 * Failures resolve to an empty list rather than throwing, so the selector can
 * degrade to the curated set instead of breaking the page.
 */
export async function searchRegistry(query: string): Promise<RegistryCandidate[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_SEARCH_LENGTH) return [];

  // `name` is a prefix/substring match server-side. Cap the length so a long
  // paste can't produce an unbounded query string.
  const params = new URLSearchParams({
    name: trimmed.slice(0, 64),
    limit: String(REGISTRY_PAGE_SIZE),
    order_by: "symbol",
    order: "asc",
  });

  let data: RegistryListResponse;
  try {
    const res = await fetch(`${API_BASE}/metadata/v1/ft?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    data = (await res.json()) as RegistryListResponse;
  } catch {
    // Upstream timeout, offline, malformed JSON — all equivalent here.
    return [];
  }

  if (!Array.isArray(data.results)) return [];

  return data.results
    .map(normalizeRegistryRow)
    .filter((r): r is RegistryCandidate => r !== null);
}

/** Cosmetic-only metadata for a specific contract. */
export interface TokenDecorations {
  name?: string;
  description?: string;
  icon?: string;
}

/**
 * Fetch display metadata for one specific contract, for the deep-link and
 * manual-entry paths.
 *
 * This deliberately returns NOTHING that a transaction depends on. The
 * `/metadata/v1/search` endpoint does not return an asset identifier at all —
 * it returns `contract_id` and `token_number` instead of `contract_principal`
 * and `asset_identifier` — so the asset name for a post-condition cannot come
 * from here even in principle. Returning only cosmetics keeps that structural
 * limitation from ever becoming a source of a wrong post-condition: the caller
 * has no field here it could be tempted to trust.
 *
 * Accepting an address as a query parameter and echoing back whatever came out
 * is how lookup-by-address flows get turned into an open redirect, so the
 * response is matched back to the requested contract and discarded on mismatch.
 *
 * Every failure returns an empty object rather than throwing, because a token
 * that is not indexed yet must still be usable via the chain resolver.
 */
export async function lookupDecorations(contractId: ContractId): Promise<TokenDecorations> {
  if (!isValidContractId(contractId)) return {};

  try {
    const params = new URLSearchParams({ contract: contractId });
    const res = await fetch(`${API_BASE}/metadata/v1/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return {};
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return {};

    const match = (data as RegistrySearchRow[]).find(
      (row) => row.contract_id === contractId,
    );
    if (!match) return {};

    return {
      name: match.name?.trim() || undefined,
      description: match.description?.trim() || undefined,
      icon: match.image_canonical_uri || match.image_uri || undefined,
    };
  } catch {
    return {};
  }
}
