"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildTopUpStreamTx, type StreamData } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { SUPPORTED_TOKENS, DEFAULT_TOKEN } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowUpCircle } from "lucide-react";

interface TopUpDialogProps {
  open: boolean;
  streamId: number;
  stream: StreamData;
  onClose: () => void;
  onSuccess: () => void;
}

export function TopUpDialog({
  open,
  streamId,
  stream,
  onClose,
  onSuccess,
}: TopUpDialogProps) {
  const { address } = useWalletStore();
  const { execute, isPending } = useStacksTx();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const tokenConfig = SUPPORTED_TOKENS.find((t) => t.contractId === stream.token) ?? DEFAULT_TOKEN;
  const tokenMultiplier = Math.pow(10, tokenConfig.decimals);
  const amountRaw = Math.round(parseFloat(amount || "0") * tokenMultiplier);

  function validate(): boolean {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a positive amount");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !address) return;

    const txOptions = buildTopUpStreamTx({
      streamId,
      tokenContract: stream.token,
      ftName: tokenConfig.ftName,
      amount: BigInt(amountRaw),
      senderAddress: address,
    });
    const result = await execute(txOptions);
    if (result?.confirmed) {
      toast.success("Stream topped up!");
      setAmount("");
      onSuccess();
    } else if (result && !result.confirmed) {
      toast.error(result.status === "timeout" ? "Transaction timed out" : `Top-up failed: ${result.errorCode ?? result.status}`);
    }
  }

  function handleClose() {
    setAmount("");
    setError("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
          <ArrowUpCircle className="h-4 w-4 text-brand-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Top Up Stream #{streamId}
          </h2>
          <p className="text-xs text-zinc-500">
            Current deposit: {formatTokenAmount(stream.depositAmount)} {tokenConfig.symbol}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`Amount (${tokenConfig.symbol})`}
          type="number"
          step={`${1 / tokenMultiplier}`}
          min="0"
          placeholder="0.5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
          hint={amountRaw > 0 ? `${amountRaw.toLocaleString()} raw units` : undefined}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isPending}>
            Top Up
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
