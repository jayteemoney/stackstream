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
import { HIRO_API_BASE, NETWORK } from "./constants";
import {
  isValidAssetName,
  isContractIdOnNetwork,
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
    network: NETWORK,
  });
  return cvToJSON(result);
}

// ============================================================================
// Cache
// ============================================================================

/**
 * Memoize an async chain read whose successful result never changes.
 *
 * SIP-010 fixes decimals, symbol and the asset name at deploy time, so a hit
 * is cached for the life of the module (per serverless instance, or per page
 * load in the browser). It is deliberately not persisted, so a redeploy or a
 * token migration always starts clean.
 *
 * A miss is different: it is usually a rate limit, a timeout or a node hiccup,
 * not a fact about the token. Caching it forever would make one 429 mark a
 * valid token "unverifiable" until the instance restarts. Misses are therefore
 * cached for `NEGATIVE_TTL_MS` only, which still stops a broken contract from
 * turning every render into a request.
 *
 * Concurrent calls for the same key share one in-flight promise, so a page
 * rendering twenty streams in one token makes one round-trip, not twenty.
 */
const NEGATIVE_TTL_MS = 60_000;

interface Memo<T> {
  hits: Map<string, T>;
  misses: Map<string, number>;
  inflight: Map<string, Promise<T | null>>;
}

const memos: Memo<unknown>[] = [];

function createMemo<T>(): Memo<T> {
  const memo: Memo<T> = { hits: new Map(), misses: new Map(), inflight: new Map() };
  memos.push(memo as Memo<unknown>);
  return memo;
}

function memoized<T>(
  memo: Memo<T>,
  key: string,
  load: () => Promise<T | null>
): Promise<T | null> {
  const hit = memo.hits.get(key);
  if (hit !== undefined) return Promise.resolve(hit);

  const missUntil = memo.misses.get(key);
  if (missUntil !== undefined && missUntil > Date.now()) return Promise.resolve(null);

  const pending = memo.inflight.get(key);
  if (pending) return pending;

  const request = load()
    .catch(() => null)
    .then((value) => {
      memo.inflight.delete(key);
      if (value === null) {
        memo.misses.set(key, Date.now() + NEGATIVE_TTL_MS);
      } else {
        memo.hits.set(key, value);
        memo.misses.delete(key);
      }
      return value;
    });
  memo.inflight.set(key, request);
  return request;
}

const decimalsMemo = createMemo<number>();
const symbolMemo = createMemo<string>();
const resolvedMemo = createMemo<ResolvedToken>();

/** Test seam: drop every memoized read, hits and misses alike. */
export function clearTokenMetadataCache(): void {
  for (const memo of memos) {
    memo.hits.clear();
    memo.misses.clear();
    memo.inflight.clear();
  }
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
export function getTokenDecimals(contractId: string): Promise<number | null> {
  if (!isContractIdOnNetwork(contractId, NETWORK)) return Promise.resolve(null);
  return memoized(decimalsMemo, contractId, async () => {
    const result = await callReadOnly(contractId, "get-decimals");
    if (!result.success) return null;
    const decimals = Number(result.value?.value);
    return isValidDecimals(decimals) ? decimals : null;
  });
}

/**
 * Read SIP-010 `get-symbol`. Display only, never used in post-conditions.
 */
export function getTokenSymbol(contractId: string): Promise<string | null> {
  if (!isContractIdOnNetwork(contractId, NETWORK)) return Promise.resolve(null);
  return memoized(symbolMemo, contractId, async () => {
    const result = await callReadOnly(contractId, "get-symbol");
    if (!result.success) return null;
    const raw = typeof result.value?.value === "string" ? result.value.value.trim() : "";
    if (raw.length === 0 || raw.length > 32) return null;
    return /^[\x20-\x7e]+$/.test(raw) ? raw : null;
  });
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
  if (!isContractIdOnNetwork(contractId, NETWORK)) return null;
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
  const curated = getCuratedToken(contractId);
  if (curated) {
    return {
      contractId: curated.contractId,
      assetName: curated.assetName,
      decimals: curated.decimals,
      symbol: curated.symbol,
      curated: true,
    };
  }

  if (!isContractIdOnNetwork(contractId, NETWORK)) return null;

  return memoized(resolvedMemo, contractId, async () => {
    // assetName and decimals are independent reads; run them together. The
    // symbol is display-only, so its absence does not block resolution.
    const [assetName, decimals, symbol] = await Promise.all([
      getTokenAssetName(contractId),
      getTokenDecimals(contractId),
      getTokenSymbol(contractId),
    ]);
    if (assetName === null || decimals === null) return null;
    return {
      contractId,
      assetName,
      decimals,
      // A display symbol is nice to have; the asset name is an honest
      // substitute and is guaranteed unique to this contract.
      symbol: symbol ?? contractId.split(".")[1] ?? contractId,
      curated: false,
    };
  });
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
