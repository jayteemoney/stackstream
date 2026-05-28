"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

      // Single sonner loading toast that walks the user through each
      // stage. Callers still fire their own domain-specific success/
      // error toast on the result.
      const toastId = toast.loading("Confirm the transaction in your wallet…");

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
    // Unified flag for button loading state — true through both the
    // signing window and the on-chain confirmation poll, so the spinner
    // does not stop the moment the wallet popup closes.
    isWorking: status === "pending" || status === "confirming",
  };
}
