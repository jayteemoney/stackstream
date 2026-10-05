"use client";

/**
 * Discovery hooks for the token selector.
 *
 * These wrap the registry search in `lib/token-registry.ts`. The registry is a
 * DISCOVERY surface only — nothing it returns is trusted for a transaction.
 * Selection always finishes through `verifySelection`, which reads decimals and
 * the asset name from the chain. That split is what makes it safe to search a
 * registry containing 5.6k contracts, 32 of which claim to be sBTC.
 */

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  classifyAll,
  dedupeByContract,
  searchRegistry,
  MIN_SEARCH_LENGTH,
  type ContractId,
  type DiscoveredToken,
} from "@/lib/token-registry";
import { getCuratedTokens } from "@/lib/token-metadata";
import { NETWORK } from "@/lib/constants";

/**
 * Ids and symbols of the hand-verified tokens, used to catch impersonators.
 *
 * Rebuilt only when the curated list actually changes — it is a module-level
 * constant in practice, so this computes once per mount.
 */
function useCuratedIndex(): {
  ids: readonly ContractId[];
  symbols: ReadonlyMap<string, ContractId>;
} {
  return useMemo(() => {
    const curated = getCuratedTokens();
    return {
      ids: curated.map((t) => t.contractId),
      // Lower-cased so a registry row saying "usbtc" still collides with "sBTC".
      symbols: new Map(curated.map((t) => [t.symbol.toLowerCase(), t.contractId])),
    };
  }, []);
}

/**
 * Debounce for the search box.
 *
 * The registry endpoint is a public API keyed on nothing in particular, so
 * every keystroke is a request a stranger pays for. 300ms collapses a typed
 * word into one call while still feeling immediate.
 */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Registry search results change only as contracts are deployed, so they are
 * cached per query string for the session. Without this, backing out of a
 * search and retyping it re-queries for no reason.
 */
const SEARCH_STALE_TIME = 10 * 60 * 1000;

/**
 * Delay a value until it stops changing.
 *
 * The registry endpoint is a public API keyed on nothing in particular, so
 * every keystroke is a request a stranger pays for. Collapsing a typed word
 * into one call keeps it feeling immediate while stopping the flood.
 *
 * The trailing value is returned, so the last keystroke always wins — an
 * in-flight request for a stale prefix can never overwrite the results for
 * what the user actually typed.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Clearing on every change is what makes this a trailing debounce rather
    // than a throttle.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export interface TokenSearchState {
  results: DiscoveredToken[];
  isSearching: boolean;
  isError: boolean;
  /** True once the query is long enough to be worth sending. */
  isSearchable: boolean;
}

/**
 * Search the registry for tokens matching `query`.
 *
 * The query is debounced before it becomes a request. `isSearchable` reflects
 * the RAW input, not the debounced value, so the UI can say "keep typing"
 * immediately instead of flickering while the debounce settles.
 *
 * Short queries are never sent — `?name=a` matches thousands of rows and
 * helps nobody.
 */
export function useTokenSearch(query: string): TokenSearchState {
  const trimmed = query.trim();
  const isSearchable = trimmed.length >= MIN_SEARCH_LENGTH;
  const debounced = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const curated = useCuratedIndex();

  const result = useQuery({
    queryKey: ["token-search", debounced],
    queryFn: () => searchRegistry(debounced),
    enabled: debounced.length >= MIN_SEARCH_LENGTH,
    staleTime: SEARCH_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Classify here rather than inside the client, so the curated list the
  // component would render comes from the same source the warnings do. A row
  // the registry hands back unclassified is never displayed as trusted.
  // Classify here rather than inside the client: trust depends on the curated
  // list, which is app state, and a row is never displayed unclassified.
  // dedupeByContract also applies the trust ordering, so an entry that cannot
  // receive a stream cannot surface above a usable one.
  const results = useMemo(
    () => dedupeByContract(classifyAll(result.data ?? [], curated.ids, curated.symbols)),
    [result.data, curated.ids, curated.symbols],
  );

  return {
    results,
    // True from the moment the input is long enough until results settle, so the
    // spinner covers the debounce as well as the request. Otherwise the UI
    // would briefly claim "no tokens matched" mid-type.
    isSearching: isSearchable && (debounced !== trimmed || result.isLoading),
    isError: result.isError,
    isSearchable,
  };
}

/**
 * The hand-verified tokens, in display order.
 *
 * Always available regardless of registry health — if the registry is down or
 * useless, the selector still offers the tokens we have verified ourselves.
 */
export function useCuratedTokens() {
  return getCuratedTokens(NETWORK);
}
