"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildTopUpStreamTx, type StreamData } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
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

  const amountRaw = Math.round(parseFloat(amount || "0") * 1e8);

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

    try {
      const txOptions = buildTopUpStreamTx({
        streamId,
        tokenContract: stream.token,
        amount: BigInt(amountRaw),
        senderAddress: address,
      });
      await execute(txOptions);
      toast.success("Top-up transaction submitted!");
      setAmount("");
      onSuccess();
    } catch {
      toast.error("Failed to top up stream");
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
            Current deposit: {formatTokenAmount(stream.depositAmount)} msBTC
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (msBTC)"
          type="number"
          step="0.00000001"
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
