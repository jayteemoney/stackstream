"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWalletStore } from "@/stores/wallet-store";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildCreateStreamTx } from "@/lib/stacks";
import {
  SUPPORTED_TOKENS,
  DEFAULT_TOKEN,
  DURATION_UNITS,
  EXPLORER_BASE,
  type DurationUnit,
  type TokenConfig,
} from "@/lib/constants";
import { formatTokenAmount, blocksToTimeString } from "@/lib/utils";
import { toast } from "sonner";
import { Zap, ArrowRight, Info, Loader2, CheckCircle2 } from "lucide-react";

export default function CreateStreamPage() {
  const { address, isConnected } = useWalletStore();
  const { blockHeight } = useBlockHeight();
  const { execute, isPending, isConfirming, txId, status, error, reset } = useStacksTx();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [durationValue, setDurationValue] = useState("30");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [memo, setMemo] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(DEFAULT_TOKEN);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Zap className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to create payment streams."
      />
    );
  }

  const unitConfig = DURATION_UNITS.find((u) => u.value === durationUnit)!;
  const durationBlocks = Math.max(1, Math.round(parseFloat(durationValue || "0") * unitConfig.blocksPerUnit));
  // Use the selected token's decimals for raw unit conversion
  const tokenMultiplier = Math.pow(10, selectedToken.decimals);
  const amountRaw = Math.round(parseFloat(amount || "0") * tokenMultiplier);
  const ratePerBlock = durationBlocks > 0 ? amountRaw / durationBlocks : 0;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!recipient || !recipient.startsWith("S")) errs.recipient = "Enter a valid Stacks address";
    if (recipient === address) errs.recipient = "Cannot stream to yourself";
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a positive amount";
    if (!durationValue || parseFloat(durationValue) <= 0) errs.duration = "Enter a positive duration";
    if (durationBlocks < 1) errs.duration = "Duration must be at least 1 block (~10 minutes)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !address) return;

    // Fetch the latest block height right before submitting to avoid stale data.
    // Add a buffer of +3 blocks so the start-block is still in the future
    // when the tx is mined (blocks are ~10 min on mainnet).
    let latestBlock = blockHeight;
    try {
      const { getCurrentBlockHeight } = await import("@/lib/stacks");
      const fresh = await getCurrentBlockHeight();
      if (fresh > 0) latestBlock = fresh;
    } catch {
      // Fall back to cached blockHeight
    }

    const txOptions = buildCreateStreamTx({
      recipient,
      tokenContract: selectedToken.contractId,
      depositAmount: BigInt(amountRaw),
      startBlock: latestBlock + 3,
      durationBlocks,
      memo: memo || undefined,
      senderAddress: address,
    });

    const result = await execute(txOptions);

    if (result?.confirmed) {
      toast.success("Stream created and confirmed on-chain!");
      setRecipient("");
      setAmount("");
      setDurationValue("30");
      setDurationUnit("days");
      setMemo("");
    } else if (result && !result.confirmed) {
      toast.error(result.status === "timeout" ? "Transaction timed out" : `Stream creation failed: ${result.errorCode ?? result.status}`);
    }
  }

  const isSubmitting = isPending || isConfirming;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardTitle>Create Payment Stream</CardTitle>
        <CardDescription>
          Set up a continuous token stream to a contributor. Funds will flow
          block-by-block and can be claimed at any time.
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Input
            label="Recipient Address"
            placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            error={errors.recipient}
            disabled={isSubmitting}
          />

          {/* Token selector */}
          {SUPPORTED_TOKENS.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">Token</label>
              <select
                value={selectedToken.contractId}
                onChange={(e) => {
                  const token = SUPPORTED_TOKENS.find((t) => t.contractId === e.target.value);
                  if (token) {
                    setSelectedToken(token);
                    setAmount(""); // reset amount when token changes (different decimals)
                  }
                }}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-zinc-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 disabled:opacity-50"
              >
                {SUPPORTED_TOKENS.map((t) => (
                  <option key={t.contractId} value={t.contractId}>
                    {t.symbol} — {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-600">{selectedToken.description}</p>
            </div>
          )}

          <Input
            label={`Total Amount (${selectedToken.symbol})`}
            type="number"
            step={`${1 / tokenMultiplier}`}
            min="0"
            placeholder="1.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            hint={amountRaw > 0 ? `${amountRaw.toLocaleString()} raw units (${selectedToken.decimals} decimals)` : undefined}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label htmlFor="duration-value" className="block text-sm font-medium text-zinc-300">Duration</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="duration-value"
                name="duration-value"
                type="number"
                step={durationUnit === "minutes" ? "10" : "1"}
                min={durationUnit === "minutes" ? "10" : "1"}
                placeholder={durationUnit === "minutes" ? "20" : durationUnit === "hours" ? "4" : "30"}
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 border-border disabled:opacity-50"
              />
              <select
                id="duration-unit"
                name="duration-unit"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                disabled={isSubmitting}
                className="rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-zinc-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 disabled:opacity-50"
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            {errors.duration && <p className="text-xs text-red-400">{errors.duration}</p>}
            {!errors.duration && durationBlocks > 0 && (
              <p className="text-xs text-zinc-600">{durationBlocks.toLocaleString()} blocks (~{blocksToTimeString(durationBlocks)})</p>
            )}
          </div>

          <Input
            label="Memo (optional)"
            placeholder="Monthly contributor payment"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            hint="Max 256 characters. Stored on-chain."
            disabled={isSubmitting}
          />

          {/* Preview */}
          {amountRaw > 0 && durationBlocks > 0 && !isConfirming && status !== "success" && (
            <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Info className="h-3 w-3" /> Stream Preview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">Rate per block</p>
                  <p className="text-zinc-200 font-mono">{formatTokenAmount(ratePerBlock)} {selectedToken.symbol}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Start block</p>
                  <p className="text-zinc-200 font-mono">~#{(blockHeight + 3).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">End block</p>
                  <p className="text-zinc-200 font-mono">~#{(blockHeight + 3 + durationBlocks).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Token</p>
                  <p className="text-zinc-200">{selectedToken.name} ({selectedToken.symbol})</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirming state */}
          {isConfirming && txId && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <p className="text-sm font-medium text-amber-300">Waiting for on-chain confirmation...</p>
              </div>
              <p className="text-xs text-zinc-400">
                Transaction signed and broadcast. Waiting for the next Stacks block to confirm.
                This may take a few minutes.
              </p>
              <a
                href={`${EXPLORER_BASE}/txid/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-400 underline"
              >
                View on Explorer: {txId.slice(0, 12)}...
              </a>
            </div>
          )}

          {/* Success state */}
          {status === "success" && txId && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">Stream confirmed on-chain!</p>
              </div>
              <p className="text-xs text-zinc-400">
                Your stream is now active. View it on the{" "}
                <a href="/dashboard/streams" className="text-brand-400 underline">Manage Streams</a> page.
              </p>
              <a
                href={`${EXPLORER_BASE}/txid/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-400 underline"
              >
                View on Explorer: {txId.slice(0, 12)}...
              </a>
            </div>
          )}

          {/* Error state */}
          {status === "error" && error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type={status === "success" ? "button" : "submit"}
            size="lg"
            className="w-full"
            loading={isPending}
            disabled={isConfirming}
            onClick={status === "success" ? () => reset() : undefined}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
              </>
            ) : status === "success" ? (
              "Create Another Stream"
            ) : (
              <>
                Create Stream <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
