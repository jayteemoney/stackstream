"use client";

import { useQuery } from "@tanstack/react-query";
import { OPENCLAW_API_URL } from "@/lib/constants";

export interface NetworkStats {
  /** Every stream ever opened on mainnet, by anyone (stream-manager's stream counter). */
  streamsCreated: number;
  /** Every organisation registered on stream-factory. */
  workspacesRegistered: number;
  asOf: string;
}

async function fetchNetworkStats(): Promise<NetworkStats> {
  const res = await fetch(`${OPENCLAW_API_URL}/api/stats`);
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return (await res.json()) as NetworkStats;
}

/**
 * Network-wide usage, read from the contract through /api/stats. Both numbers
 * only go up: each new stream and each new registration adds one, whoever makes
 * it. Refreshed every minute, which is also the API's cache window.
 */
export function useNetworkStats() {
  const query = useQuery({
    queryKey: ["network-stats"],
    queryFn: fetchNetworkStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return { stats: query.data ?? null, isLoading: query.isLoading };
}
