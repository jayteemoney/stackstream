"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PostConditionMode } from "@stacks/transactions";
import { waitForTxConfirmation, clarityErrorMessage } from "@/lib/stacks";
import {
  isUserCancel,
  isNoResponse,
  isStaleChunk,
  walletErrorDetail,
} from "@/lib/wallet-errors";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export interface TxResult {
  confirmed: boolean;
  txId: string;
  status: string;
  /** Clarity error code (e.g. "u105") when the tx was aborted */
  errorCode?: string;
  /** Raw tx_result repr string from the API */
  errorRepr?: string;
}

/**
 * Hook for executing Stacks contract calls via wallet.
 *
 * After the user signs, polls Hiro API for on-chain confirmation
 * and invalidates React Query caches so UI updates automatically.
 *
 * Ref: https://docs.stacks.co/stacks.js/connect#contract-calls
 */
export function useStacksTx() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const execute = useCallback(
    async (options: Record<string, any>): Promise<TxResult | null> => {
      setStatus("pending");
      setError(null);
      setTxId(null);

      // Single sonner loading toast that walks the user through each
      // stage. Callers still fire their own domain-specific success/
      // error toast on the result.
      const toastId = toast.loading("Confirm the transaction in your wallet…");

      try {
        // v8 request() talks to the wallet over the modern LeatherProvider
        // JSON-RPC bridge. The legacy openContractCall/StacksProvider path is
        // deprecated by Leather and silently hangs (no popup, dangling
        // promise) on current wallet versions.
        const { request } = await import("@stacks/connect");

        const callParams = {
          contract:
            `${options.contractAddress}.${options.contractName}` as `${string}.${string}`,
          functionName: options.functionName,
          functionArgs: options.functionArgs,
          network: options.network,
          postConditions: options.postConditions ?? [],
          postConditionMode:
            options.postConditionMode === PostConditionMode.Allow
              ? ("allow" as const)
              : ("deny" as const),
        };

        const response = await request("stx_callContract", callParams).catch(
          async (err: unknown) => {
            if (isUserCancel(err)) throw new Error("cancelled");
            if (isNoResponse(err)) {
              // Extension background worker was asleep and dropped the
              // request while waking — one automatic retry succeeds.
              return request("stx_callContract", callParams).catch(
                (retryErr: unknown) => {
                  if (isUserCancel(retryErr)) throw new Error("cancelled");
                  throw retryErr;
                }
              );
            }
            throw err;
          }
        );

        const rawId = response?.txid;
        if (!rawId) throw new Error("Wallet returned no transaction id");
        // Hiro's /extended/v1/tx/{id} expects the 0x-prefixed form
        const id = rawId.startsWith("0x") ? rawId : `0x${rawId}`;

        setTxId(id);
        setStatus("confirming");
        toast.loading("Submitted — waiting for on-chain confirmation (~5–15s)", {
          id: toastId,
        });

        // Poll for on-chain confirmation
        const result = await waitForTxConfirmation(id, {
          interval: 5_000,
          timeout: 600_000,
        });

        if (result.confirmed) {
          setStatus("success");
          toast.dismiss(toastId);
          // Force refetch all active stream-related queries.
          // Using refetchQueries (not invalidateQueries) to guarantee an
          // immediate network request regardless of staleTime.
          // Ref: https://github.com/TanStack/query/discussions/2468
          await queryClient.refetchQueries({ queryKey: ["sender-streams"], type: "active" });
          await queryClient.refetchQueries({ queryKey: ["recipient-streams"], type: "active" });
          queryClient.refetchQueries({ queryKey: ["stream"], type: "active" });
          queryClient.refetchQueries({ queryKey: ["stream-nonce"], type: "active" });
          queryClient.refetchQueries({ queryKey: ["token-balance"], type: "active" });
          return { confirmed: true, txId: id, status: result.status };
        } else {
          let msg: string;
          if (result.status === "timeout") {
            msg = "Transaction timed out waiting for confirmation";
          } else if (result.status === "abort_by_post_condition") {
            msg = "Transaction failed: a post-condition was not met (token transfer rejected)";
          } else if (result.errorCode) {
            const humanMsg = clarityErrorMessage(result.errorCode);
            msg = humanMsg
              ? `Transaction failed: ${humanMsg}`
              : `Transaction failed on-chain (error ${result.errorCode})`;
          } else {
            msg = `Transaction failed on-chain: ${result.status}`;
          }
          setError(msg);
          setStatus("error");
          toast.dismiss(toastId);
          return {
            confirmed: false,
            txId: id,
            status: result.status,
            errorCode: result.errorCode,
            errorRepr: result.errorRepr,
          };
        }
      } catch (err: any) {
        toast.dismiss(toastId);
        if (err?.message === "cancelled") {
          setStatus("idle");
          return null;
        }
        if (isStaleChunk(err)) {
          // A deploy replaced the bundle files under this open tab — reload
          // onto the current build instead of surfacing module internals.
          toast.info("StackStream was updated — refreshing…");
          setTimeout(() => window.location.reload(), 800);
          return null;
        }
        setError(walletErrorDetail(err));
        setStatus("error");
        return null;
      }
    },
    [queryClient]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxId(null);
    setError(null);
  }, []);

  return {
    execute,
    status,
    txId,
    error,
    reset,
    isPending: status === "pending",
    isConfirming: status === "confirming",
    // Unified flag for button loading state — true through both the
    // signing window and the on-chain confirmation poll, so the spinner
    // does not stop the moment the wallet popup closes.
    isWorking: status === "pending" || status === "confirming",
  };
}
