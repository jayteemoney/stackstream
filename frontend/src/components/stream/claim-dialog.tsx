"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildClaimTx, type StreamData } from "@/lib/stacks";
import { SUPPORTED_TOKENS, DEFAULT_TOKEN } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/utils";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface ClaimDialogProps {
  open: boolean;
  streamId: number;
  stream: StreamData;
  claimable: bigint;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClaimDialog({
  open,
  streamId,
  stream,
  claimable,
  onClose,
  onSuccess,
}: ClaimDialogProps) {
  const { execute, isPending } = useStacksTx();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const tokenConfig =
    SUPPORTED_TOKENS.find((t) => t.contractId === stream.token) ??
    DEFAULT_TOKEN;
  const tokenMultiplier = Math.pow(10, tokenConfig.decimals);
  const amountRaw = BigInt(Math.floor(parseFloat(amount || "0") * tokenMultiplier));

  function validate(): boolean {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a positive amount");
      return false;
    }
    if (amountRaw > claimable) {
      setError(
        `Max claimable is ${formatTokenAmount(claimable)} ${tokenConfig.symbol}`
      );
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const result = await execute(
      buildClaimTx({
        streamId,
        tokenContract: stream.token,
        amount: amountRaw,
      })
    );

    if (result?.confirmed) {
      toast.success(`Claimed ${formatTokenAmount(amountRaw)} ${tokenConfig.symbol}`);
      setAmount("");
      onSuccess();
    } else if (result && !result.confirmed) {
      toast.error(
        result.status === "timeout"
          ? "Transaction timed out"
          : `Claim failed: ${result.errorCode ?? result.status}`
      );
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
          <Download className="h-4 w-4 text-brand-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Claim from Stream #{streamId}
          </h2>
          <p className="text-xs text-zinc-500">
            Available: {formatTokenAmount(claimable)} {tokenConfig.symbol}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`Amount (${tokenConfig.symbol})`}
          type="number"
          step={`${1 / tokenMultiplier}`}
          min="0"
          placeholder={formatTokenAmount(claimable)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
          hint={amountRaw > 0n ? `${amountRaw.toLocaleString()} raw units` : undefined}
        />

        <button
          type="button"
          className="text-xs text-brand-400 underline"
          onClick={() =>
            setAmount(
              (Number(claimable) / tokenMultiplier).toFixed(tokenConfig.decimals)
            )
          }
        >
          Use max ({formatTokenAmount(claimable)} {tokenConfig.symbol})
        </button>

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
            Claim
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
