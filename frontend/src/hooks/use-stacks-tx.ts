"use client";

import { useCallback, useState } from "react";
import { userSession } from "@/providers/stacks-provider";

type TxStatus = "idle" | "pending" | "success" | "error";

/**
 * Hook for executing Stacks contract calls via wallet.
 *
 * Wraps @stacks/connect openContractCall with state tracking.
 * Ref: https://docs.stacks.co/stacks.js/connect#contract-calls
 */
export function useStacksTx() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (options: Record<string, any>) => {
    setStatus("pending");
    setError(null);
    setTxId(null);

    try {
      const { openContractCall } = await import("@stacks/connect");

      await openContractCall({
        ...options,
        userSession,
        onFinish: (data: any) => {
          setTxId(data.txId);
          setStatus("success");
        },
        onCancel: () => {
          setStatus("idle");
        },
      } as any);
    } catch (err: any) {
      setError(err?.message ?? "Transaction failed");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxId(null);
    setError(null);
  }, []);

  return { execute, status, txId, error, reset, isPending: status === "pending" };
}
