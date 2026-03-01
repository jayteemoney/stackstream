"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { userSession } from "@/providers/stacks-provider";
import { waitForTxConfirmation, clarityErrorMessage } from "@/lib/stacks";

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

      try {
        const { openContractCall } = await import("@stacks/connect");

        // Wait for user to sign in Leather
        const id = await new Promise<string>((resolve, reject) => {
          openContractCall({
            ...options,
            userSession,
            onFinish: (data: any) => {
              resolve(data.txId);
            },
            onCancel: () => {
              reject(new Error("cancelled"));
            },
          } as any);
        });

        setTxId(id);
        setStatus("confirming");

        // Poll for on-chain confirmation
        const result = await waitForTxConfirmation(id, {
          interval: 5_000,
          timeout: 600_000,
        });

        if (result.confirmed) {
          setStatus("success");
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
          return {
            confirmed: false,
            txId: id,
            status: result.status,
            errorCode: result.errorCode,
            errorRepr: result.errorRepr,
          };
        }
      } catch (err: any) {
        if (err?.message === "cancelled") {
          setStatus("idle");
          return null;
        }
        setError(err?.message ?? "Transaction failed");
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
  };
}
