"use client";

import { useQuery } from "@tanstack/react-query";
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

/** Fetch a single stream by ID */
export function useStream(streamId: number | null) {
  return useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => (streamId !== null ? getStream(streamId) : null),
    enabled: streamId !== null,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });
}

/** Fetch all streams where the connected wallet is the sender */
export function useSenderStreams() {
  const address = useWalletStore((s) => s.address);

  const idsQuery = useQuery({
    queryKey: ["sender-stream-ids", address],
    queryFn: () => (address ? getSenderStreams(address) : []),
    enabled: !!address,
  });

  const streamsQuery = useQuery({
    queryKey: ["sender-streams", address, idsQuery.data],
    queryFn: async () => {
      const ids = idsQuery.data ?? [];
      const results = await Promise.all(
        ids.map(async (id) => {
          const data = await getStream(id);
          return data ? { id, ...data } : null;
        })
      );
      return results.filter(Boolean) as (StreamData & { id: number })[];
    },
    enabled: !!address && !!idsQuery.data && idsQuery.data.length > 0,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  return {
    streams: streamsQuery.data ?? [],
    streamIds: idsQuery.data ?? [],
    isLoading: idsQuery.isLoading || streamsQuery.isLoading,
    refetch: () => {
      idsQuery.refetch();
      streamsQuery.refetch();
    },
  };
}

/** Fetch all streams where the connected wallet is the recipient */
export function useRecipientStreams() {
  const address = useWalletStore((s) => s.address);

  const idsQuery = useQuery({
    queryKey: ["recipient-stream-ids", address],
    queryFn: () => (address ? getRecipientStreams(address) : []),
    enabled: !!address,
  });

  const streamsQuery = useQuery({
    queryKey: ["recipient-streams", address, idsQuery.data],
    queryFn: async () => {
      const ids = idsQuery.data ?? [];
      const results = await Promise.all(
        ids.map(async (id) => {
          const data = await getStream(id);
          if (!data) return null;
          const claimable = await getClaimableBalance(id);
          const streamed = await getStreamedAmount(id);
          return { id, ...data, claimable: claimable ?? 0n, streamed: streamed ?? 0n };
        })
      );
      return results.filter(Boolean) as (StreamData & {
        id: number;
        claimable: bigint;
        streamed: bigint;
      })[];
    },
    enabled: !!address && !!idsQuery.data && idsQuery.data.length > 0,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  return {
    streams: streamsQuery.data ?? [],
    streamIds: idsQuery.data ?? [],
    isLoading: idsQuery.isLoading || streamsQuery.isLoading,
    refetch: () => {
      idsQuery.refetch();
      streamsQuery.refetch();
    },
  };
}

/** Fetch the current stream nonce (total streams created) */
export function useStreamNonce() {
  return useQuery({
    queryKey: ["stream-nonce"],
    queryFn: getStreamNonce,
    refetchInterval: 60_000,
  });
}
