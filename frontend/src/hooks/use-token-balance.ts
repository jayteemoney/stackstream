"use client";

/**
 * Fetches a wallet's balance for one SIP-010 token.
 *
 * Takes resolved metadata rather than a bare contract id + asset name, because
 * the balances endpoint is keyed by `contractId::assetName` and a wrong asset
 * name reads 0 rather than erroring — which then surfaces as a misleading
 * "Insufficient balance. You have 0.00".
 */

import { useQuery } from "@tanstack/react-query";
import { getTokenBalance } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { DEFAULT_TOKEN, BALANCE_POLL_INTERVAL } from "@/lib/constants";
import { useTokenMetadata } from "./use-token-metadata";
import type { ResolvedToken } from "@/lib/token-metadata";

/**
 * @param token - resolved metadata, or null to fall back to the network's
 *   default token (testnet msBTC balance display in the header, and the
 *   testnet faucet flow). Never pass a *different* stream's token implicitly.
 */
export function useTokenBalance(token?: ResolvedToken | null) {
  const address = useWalletStore((s) => s.address);
  const effective = token ?? {
    contractId: DEFAULT_TOKEN.contractId,
    assetName: DEFAULT_TOKEN.assetName,
    decimals: DEFAULT_TOKEN.decimals,
    symbol: DEFAULT_TOKEN.symbol,
    curated: true,
  } satisfies ResolvedToken;

  const query = useQuery({
    queryKey: ["token-balance", address, effective.contractId, effective.assetName],
    queryFn: () => getTokenBalance(address!, effective.contractId, effective),
    enabled: !!address,
    refetchInterval: BALANCE_POLL_INTERVAL,
  });

  return {
    balance: query.data ?? 0n,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * Resolve a contract id's metadata and read the wallet balance for it in one
 * hook, for the common case where a caller has only a contract id to hand.
 *
 * Returns `isResolving` so callers can avoid rendering a "0.00" balance while
 * metadata is still in flight, which is indistinguishable from a real zero.
 */
export function useTokenBalanceByContractId(contractId: string) {
  const { token, isLoading: isResolving } = useTokenMetadata(contractId);
  const balanceState = useTokenBalance(token);
  return { ...balanceState, token, isResolving };
}
