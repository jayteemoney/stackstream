"use client";

import { useQuery } from "@tanstack/react-query";
import { getTokenBalance } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { MOCK_TOKEN_CONTRACT, BALANCE_POLL_INTERVAL } from "@/lib/constants";

export function useTokenBalance() {
  const address = useWalletStore((s) => s.address);

  const query = useQuery({
    queryKey: ["token-balance", address],
    queryFn: () => getTokenBalance(address!, MOCK_TOKEN_CONTRACT),
    enabled: !!address,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  return {
    balance: query.data ?? 0n,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
