"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { useTokenMetadata } from "@/hooks/use-token-metadata";
import { buildClaimTx, type StreamData } from "@/lib/stacks";
import { formatTokenAmount, formatTxError } from "@/lib/utils";
import { toRawAmount, fromRawAmount, unresolvableTokenLabel } from "@/lib/constants";
import { toast } from "sonner";
import { Download, AlertTriangle } from "lucide-react";

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
  const { execute, isWorking } = useStacksTx();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Resolve the stream's token from the chain instead of assuming DEFAULT_TOKEN.
  // With a 6-decimal token, the old fallback scaled the user's claim input by
  // 1e8 and reported claimable balances 100x too small.
  const { token, isLoading: isTokenLoading } = useTokenMetadata(stream.token);
  const amountRaw = toRawAmount(amount || "0", token?.decimals ?? 0);
  const label = token?.symbol ?? unresolvableTokenLabel(stream.token);

  function validate(): boolean {
    if (!token) {
      setError(
        `Token metadata for ${stream.token} could not be read from the chain, ` +
          `so StackStream cannot build a safe post-condition for this claim.`
      );
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a positive amount");
      return false;
    }
    if (amountRaw === null) {
      setError("Enter a valid amount (digits and up to one decimal point)");
      return false;
    }
    if (amountRaw > claimable) {
      setError(`Max claimable is ${formatTokenAmount(claimable, token.decimals)} ${token.symbol}`);
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !token || amountRaw === null) return;

    const result = await execute(
      buildClaimTx({
        streamId,
        tokenContract: stream.token,
        token,
        amount: amountRaw,
      })
    );

    if (result?.confirmed) {
      toast.success(`Claimed ${formatTokenAmount(amountRaw, token.decimals)} ${token.symbol}`);
      setAmount("");
      onSuccess();
    } else if (result && !result.confirmed) {
      toast.error(formatTxError("Claim failed", result));
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
            {token ? (
              <>
                Available: {formatTokenAmount(claimable, token.decimals)} {token.symbol}
              </>
            ) : isTokenLoading ? (
              "Reading token metadata from the chain…"
            ) : (
              `Unrecognized token ${unresolvableTokenLabel(stream.token)}`
            )}
          </p>
        </div>
      </div>

      {!token && !isTokenLoading && (
        <div className="mb-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300">
            This stream&apos;s token is not a token StackStream can verify. It may
            not follow SIP-010, or its asset name could not be determined.
            Claiming is unavailable because the required post-condition cannot
            be built safely.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`Amount (${label})`}
          type="number"
          step="any"
          min="0"
          placeholder={token ? formatTokenAmount(claimable, token.decimals) : "0"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
          hint={
            amountRaw !== null && amountRaw > 0n
              ? `${amountRaw.toLocaleString()} raw units`
              : undefined
          }
          disabled={!token}
        />

        {token && (
          <button
            type="button"
            className="text-xs text-brand-400 underline"
            onClick={() => setAmount(fromRawAmount(claimable, token.decimals))}
          >
            Use max ({formatTokenAmount(claimable, token.decimals)} {token.symbol})
          </button>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isWorking} disabled={!token}>
            Claim
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
