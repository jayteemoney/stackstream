"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getDao, isStreamTracked, type DaoData } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";

/** The connected wallet's registered organisation, or null if it has none. */
export function useWorkspace(): { workspace: DaoData | null; isLoading: boolean } {
  const address = useWalletStore((s) => s.address);
  const query = useQuery({
    queryKey: ["workspace", address],
    queryFn: () => getDao(address!),
    enabled: !!address,
    staleTime: 60_000,
  });
  return { workspace: query.data ?? null, isLoading: query.isLoading };
}

/**
 * Which of `streamIds` are linked to the connected wallet's organisation.
 * Only queried when the wallet has an active workspace, since nothing else can
 * be linked.
 */
export function useTrackedStreams(streamIds: readonly number[], enabled: boolean) {
  const address = useWalletStore((s) => s.address);
  const queryClient = useQueryClient();
  const key = ["tracked-streams", address, [...streamIds].sort((a, b) => a - b).join(",")];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const flags = await Promise.all(streamIds.map((id) => isStreamTracked(address!, id)));
      return new Set(streamIds.filter((_, i) => flags[i]));
    },
    enabled: enabled && !!address && streamIds.length > 0,
    staleTime: 60_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tracked-streams", address] });
    queryClient.invalidateQueries({ queryKey: ["workspace", address] });
  }, [queryClient, address]);

  return { tracked: query.data ?? null, isLoading: query.isLoading, refresh };
}
