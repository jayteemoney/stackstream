/**
 * Network side of SIP-010 token metadata resolution.
 *
 * Splits the work from `token-metadata.ts` so that file stays pure and
 * testable. This module owns the cache and the three chain reads:
 *
 *   decimals  — SIP-010 `get-decimals`
 *   assetName — `/v2/contracts/interface`, with an explicit ambiguity refusal
 *   symbol    — SIP-010 `get-symbol`, display only
 *
 * `token-metadata-client` is used by the Next.js API routes and the browser
 * alike, so it must never throw and never return a guessed value. Every
 * failure path yields null, and callers refuse the action.
 */

import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  type ClarityValue,
} from "@stacks/transactions";
import { HIRO_API_BASE } from "./constants";
import {
  isValidAssetName,
  isValidContractId,
  isValidDecimals,
  pickUnambiguousAssetName,
  getCuratedToken,
  type ResolvedToken,
} from "./token-metadata";

function splitContract(contractId: string): [string, string] {
  const [addr, name] = contractId.split(".");
  return [addr, name];
}

async function callReadOnly(
  contractId: string,
  functionName: string,
  args: ClarityValue[] = []
) {
  const [contractAddress, contractName] = splitContract(contractId);
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs: args,
    senderAddress: contractAddress,
    network: process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? "mainnet" : "testnet",
  });
  return cvToJSON(result);
}

// ============================================================================
// Cache
// ============================================================================

/**
 * Decimals never change for a deployed token (SIP-010 fixes them at deploy
 * time), so a process-lifetime cache is safe and removes a round-trip from
 * every stream render.
 *
 * Cached per module instance, which means per serverless instance in production
 * and per page load in the browser. Deliberately not persisted: token metadata
 * must never go stale across a redeploy or a token migration.
 */
const cache = new Map<string, ResolvedToken | null>();

/** Test seam: drop the memoized metadata. */
export function clearTokenMetadataCache(): void {
  cache.clear();
}

// ============================================================================
// Individual reads
// ============================================================================

/**
 * Read SIP-010 `get-decimals`.
 *
 * `cvToJSON` wraps a `(response uint ...)` as
 * `{ success, value: { type: "uint", value: "6" } }`, so the number lives at
 * `value.value` as a decimal string. Reading `value` directly yields NaN.
 */
export async function getTokenDecimals(contractId: string): Promise<number | null> {
  if (!isValidContractId(contractId)) return null;
  try {
    const result = await callReadOnly(contractId, "get-decimals");
    if (!result.success) return null;
    const decimals = Number(result.value?.value);
    return isValidDecimals(decimals) ? decimals : null;
  } catch {
    return null;
  }
}

/**
 * Read SIP-010 `get-symbol`. Display only — never used in post-conditions.
 */
async function getTokenSymbol(contractId: string): Promise<string | null> {
  try {
    const result = await callReadOnly(contractId, "get-symbol");
    if (!result.success) return null;
    const raw = result.value?.value;
    if (typeof raw !== "string" || raw.length === 0 || raw.length > 32) return null;
    return /^[\x20-\x7e]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Read the `define-fungible-token` name from the contract interface.
 *
 * This is the field post-conditions need, and it is NOT `get-name`: USDA's
 * `get-name` is "USDA" while its asset name is "usda". There is no SIP-010
 * read-only function that returns the asset name, so the interface endpoint is
 * the documented way to get it.
 *
 * Returns null when the contract defines zero or several fungible tokens —
 * see `pickUnambiguousAssetName` for why several is a refusal, not a guess.
 */
export async function getTokenAssetName(contractId: string): Promise<string | null> {
  if (!isValidContractId(contractId)) return null;
  const [deployer, contractName] = splitContract(contractId);
  try {
    const res = await fetch(
      `${HIRO_API_BASE}/v2/contracts/interface/${deployer}/${contractName}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const iface = (await res.json()) as { fungible_tokens?: { name?: unknown }[] };
    const assetName = pickUnambiguousAssetName(iface.fungible_tokens);
    return isValidAssetName(assetName) ? assetName : null;
  } catch {
    return null;
  }
}

// ============================================================================
// Full resolution
// ============================================================================

/**
 * Resolve the metadata needed to interact with a token, or null.
 *
 * Resolution order:
 *   1. The curated list, if the contract id matches exactly. Free, and immune
 *      to an interface-endpoint outage. Correct even for multi-asset contracts
 *      like sBTC, where the curated entry records the verified asset name.
 *   2. Chain reads for anything else — which is how a stream in a token the
 *      UI has never heard of still gets a correct post-condition and correct
 *      decimals.
 *
 * Returns null when the chain cannot prove an asset name (notably the
 * multi-asset contracts). Callers MUST treat null as "refuse", never as
 * "default to sBTC": substituting a default is what produces rejected
 * transactions and misreported balances.
 */
export async function resolveTokenMetadata(
  contractId: string
): Promise<ResolvedToken | null> {
  if (!isValidContractId(contractId)) return null;

  const cached = cache.get(contractId);
  if (cached !== undefined) return cached;

  const curated = getCuratedToken(contractId);
  let resolved: ResolvedToken | null = null;

  if (curated) {
    resolved = {
      contractId: curated.contractId,
      assetName: curated.assetName,
      decimals: curated.decimals,
      symbol: curated.symbol,
      curated: true,
    };
  } else {
    // assetName and decimals are independent reads; run them together. The
    // symbol is display-only, so its absence does not block resolution.
    const [assetName, decimals, symbol] = await Promise.all([
      getTokenAssetName(contractId),
      getTokenDecimals(contractId),
      getTokenSymbol(contractId),
    ]);
    if (assetName !== null && decimals !== null) {
      resolved = {
        contractId,
        assetName,
        decimals,
        // A display symbol is nice to have; the asset name is an honest
        // substitute and is guaranteed unique to this contract.
        symbol: symbol ?? contractId.split(".")[1] ?? contractId,
        curated: false,
      };
    }
  }

  // Cache both hits and misses so a failing token does not re-hit the chain on
  // every render. The negative entries are what stop a broken contract from
  // becoming a request amplifier.
  cache.set(contractId, resolved);
  return resolved;
}

/**
 * Resolve several tokens at once, for pages that render many streams.
 * Duplicates are collapsed by `resolveTokenMetadata`'s cache, so this is cheap
 * to call with a list containing repeats.
 *
 * Returns a nullable list rather than filtering, so callers keep the index
 * alignment with their input. A filtered result would silently shift every
 * later token's identity if one contract in the middle failed to resolve.
 */
export function resolveAllTokens(
  contractIds: readonly string[]
): Promise<Array<ResolvedToken | null>> {
  return Promise.all(contractIds.map((id) => resolveTokenMetadata(id)));
}
