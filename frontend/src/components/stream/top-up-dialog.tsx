"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useTokenMetadata } from "@/hooks/use-token-metadata";
import { buildTopUpStreamTx, type StreamData } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { formatTokenAmount, formatTxError } from "@/lib/utils";
import { toRawAmount, fromRawAmount, hasExcessPrecision, unresolvableTokenLabel } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowUpCircle, AlertTriangle } from "lucide-react";

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
  const { execute, isWorking } = useStacksTx();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Resolve the *stream's* token from the chain. The previous code looked the
  // contract up in SUPPORTED_TOKENS and fell back to DEFAULT_TOKEN, so topping
  // up a USDA stream built a post-condition naming "sbtc-token": the deposit
  // moved, but the wallet rejected the tx, and topping up any unlisted token
  // could not work at all.
  const { token, isLoading: isTokenLoading } = useTokenMetadata(stream.token);
  const { balance, isLoading: isBalanceLoading } = useTokenBalance(token);

  const amountRaw = toRawAmount(amount || "0", token?.decimals ?? 0);
  const label = token?.symbol ?? unresolvableTokenLabel(stream.token);

  function validate(): boolean {
    if (!token) {
      setError(
        `Token metadata for ${stream.token} could not be read from the chain, ` +
          `so StackStream cannot build a safe post-condition for this top-up.`
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
    if (hasExcessPrecision(amount, token.decimals)) {
      setError(`${token.symbol} has ${token.decimals} decimal places. Remove the extra digits.`);
      return false;
    }
    if (amountRaw > balance) {
      setError(
        `Insufficient ${token.symbol} balance. You have ${formatTokenAmount(balance, token.decimals)} ${token.symbol}.`
      );
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !address || !token || amountRaw === null) return;

    const txOptions = buildTopUpStreamTx({
      streamId,
      tokenContract: stream.token,
      token,
      amount: amountRaw,
      senderAddress: address,
    });
    const result = await execute(txOptions);
    if (result?.confirmed) {
      toast.success("Stream topped up!");
      setAmount("");
      onSuccess();
    } else if (result && !result.confirmed) {
      toast.error(formatTxError("Top-up failed", result));
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
            {token ? (
              <>
                Current deposit:{" "}
                {formatTokenAmount(stream.depositAmount, token.decimals)} {token.symbol}
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
            not follow SIP-010, or its asset name could not be determined. Top-up
            is unavailable because the required post-condition cannot be built
            safely.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Input
            label={`Amount (${label})`}
            type="number"
            step="any"
            min="0"
            placeholder="0.5"
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
          {address && token && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                Available:{" "}
                {isBalanceLoading
                  ? "…"
                  : `${formatTokenAmount(balance, token.decimals)} ${token.symbol}`}
              </span>
              {balance > 0n && (
                <button
                  type="button"
                  onClick={() => setAmount(fromRawAmount(balance, token.decimals))}
                  className="text-brand-400 hover:text-brand-300 underline"
                >
                  Use max
                </button>
              )}
            </div>
          )}
        </div>

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
            Top Up
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
