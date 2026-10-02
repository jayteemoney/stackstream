"use client";

/**
 * React hook for resolving SIP-010 token metadata.
 *
 * The resolver (`lib/token-metadata-client.ts`) is cached by contract id, so
 * calling this per rendered stream costs one shared fetch per distinct token,
 * not one per component.
 *
 * The important design point is the shape of the return value. There is no
 * `DEFAULT_TOKEN` escape hatch: `token` is null until the chain has been
 * consulted, and stays null if the token cannot be resolved. Components must
 * render that state (a placeholder, or a refusal for write actions) rather than
 * substituting a default, because a substituted default is precisely what
 * produced wrong asset names in post-conditions.
 */

import { useQuery } from "@tanstack/react-query";
import { resolveTokenMetadata } from "@/lib/token-metadata-client";
import type { ResolvedToken } from "@/lib/token-metadata";

/**
 * Token decimals never change for a deployed token, so metadata is cached far
 * more aggressively than balances. `Infinity` means "never refetch within this
 * session"; the module-level cache in the resolver is the real backstop.
 */
const TOKEN_METADATA_STALE_TIME = 60 * 60 * 1000;

export interface TokenMetadataState {
  token: ResolvedToken | null;
  isLoading: boolean;
  isError: boolean;
}

export function useTokenMetadata(contractId: string): TokenMetadataState {
  const query = useQuery({
    queryKey: ["token-metadata", contractId],
    queryFn: () => resolveTokenMetadata(contractId),
    enabled: !!contractId,
    staleTime: TOKEN_METADATA_STALE_TIME,
    // Metadata is immutable, so never refetch on window focus. The resolver's
    // module cache already collapses concurrent calls for the same contract.
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    token: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Resolve metadata for a list of contract ids (one per token, not per stream).
 * Returns a lookup keyed by contract id. Tokens that fail to resolve are simply
 * absent from the map — callers see `undefined` and handle it.
 */
export function useTokensMetadata(
  contractIds: readonly string[]
): Record<string, ResolvedToken> {
  const unique = Array.from(new Set(contractIds.filter(Boolean)));
  const results = useQuery({
    queryKey: ["token-metadata", unique],
    queryFn: async () => {
      const entries = await Promise.all(
        unique.map(async (id) => [id, await resolveTokenMetadata(id)] as const)
      );
      return Object.fromEntries(
        entries.filter((e): e is readonly [string, ResolvedToken] => e[1] !== null)
      );
    },
    enabled: unique.length > 0,
    staleTime: TOKEN_METADATA_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (results.data ?? {}) as Record<string, ResolvedToken>;
}
