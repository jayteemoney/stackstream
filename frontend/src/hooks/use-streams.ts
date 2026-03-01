"use client";

/**
 * Stream data hooks using TanStack Query v5.
 *
 * Key design decisions:
 * - Single flattened query per role (sender/recipient) — avoids the dependent
 *   query waterfall that breaks invalidation cascading.
 *   Ref: https://tanstack.com/query/v5/docs/react/guides/dependent-queries
 * - staleTime=0 so invalidateQueries always triggers a background refetch.
 *   Ref: https://tanstack.com/query/v5/docs/react/guides/query-invalidation
 * - refetchInterval for live-updating claimable balances.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStream,
  getSenderStreams,
  getRecipientStreams,
  getClaimableBalance,
  getStreamedAmount,
  getStreamNonce,
  type StreamData,
} from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { BALANCE_POLL_INTERVAL } from "@/lib/constants";
import { useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export type SenderStream = StreamData & { id: number };
export type RecipientStream = StreamData & {
  id: number;
  claimable: bigint;
  streamed: bigint;
};

// ============================================================================
// Sender streams — single flattened query
// ============================================================================

async function fetchSenderStreams(
  address: string
): Promise<SenderStream[]> {
  const ids = await getSenderStreams(address);
  if (ids.length === 0) return [];

  const results = await Promise.all(
    ids.map(async (id) => {
      const data = await getStream(id);
      return data ? { id, ...data } : null;
    })
  );
  return results.filter(Boolean) as SenderStream[];
}

/** Fetch all streams where the connected wallet is the sender. */
export function useSenderStreams() {
  const address = useWalletStore((s) => s.address);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sender-streams", address],
    queryFn: () => fetchSenderStreams(address!),
    enabled: !!address,
    staleTime: 0,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  const refetch = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ["sender-streams", address], type: "active" });
  }, [queryClient, address]);

  return {
    streams: query.data ?? [],
    isLoading: query.isLoading,
    refetch,
  };
}

// ============================================================================
// Recipient streams — single flattened query
// ============================================================================

async function fetchRecipientStreams(
  address: string
): Promise<RecipientStream[]> {
  const ids = await getRecipientStreams(address);
  if (ids.length === 0) return [];

  const results = await Promise.all(
    ids.map(async (id) => {
      const data = await getStream(id);
      if (!data) return null;
      const claimable = await getClaimableBalance(id);
      const streamed = await getStreamedAmount(id);
      return {
        id,
        ...data,
        claimable: claimable ?? 0n,
        streamed: streamed ?? 0n,
      };
    })
  );
  return results.filter(Boolean) as RecipientStream[];
}

/** Fetch all streams where the connected wallet is the recipient. */
export function useRecipientStreams() {
  const address = useWalletStore((s) => s.address);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["recipient-streams", address],
    queryFn: () => fetchRecipientStreams(address!),
    enabled: !!address,
    staleTime: 0,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  const refetch = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ["recipient-streams", address], type: "active" });
  }, [queryClient, address]);

  return {
    streams: query.data ?? [],
    isLoading: query.isLoading,
    refetch,
  };
}

// ============================================================================
// Single stream
// ============================================================================

/** Fetch a single stream by ID. */
export function useStream(streamId: number | null) {
  return useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => (streamId !== null ? getStream(streamId) : null),
    enabled: streamId !== null,
    staleTime: 0,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });
}

// ============================================================================
// Stream nonce
// ============================================================================

/** Fetch the current stream nonce (total streams created). */
export function useStreamNonce() {
  return useQuery({
    queryKey: ["stream-nonce"],
    queryFn: getStreamNonce,
    staleTime: 0,
    refetchInterval: 60_000,
  });
}
