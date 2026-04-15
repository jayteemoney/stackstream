"use client";

import { useQuery } from "@tanstack/react-query";
import { getTokenBalance } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { DEFAULT_TOKEN, BALANCE_POLL_INTERVAL } from "@/lib/constants";

/**
 * Fetches the SIP-010 balance for the connected wallet.
 * @param tokenContractId - The fully-qualified contract ID of the token.
 *   Defaults to the network's default token (msBTC on testnet, sBTC on mainnet).
 * @param ftName - The fungible token asset name inside the contract.
 *   Defaults to the default token's ftName.
 */
export function useTokenBalance(
  tokenContractId: string = DEFAULT_TOKEN.contractId,
  ftName: string = DEFAULT_TOKEN.ftName
) {
  const address = useWalletStore((s) => s.address);

  const query = useQuery({
    queryKey: ["token-balance", address, tokenContractId],
    queryFn: () => getTokenBalance(address!, tokenContractId, ftName),
    enabled: !!address,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  return {
    balance: query.data ?? 0n,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
