"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWalletStore } from "@/stores/wallet-store";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { buildCreateStreamTx, getSenderStreams } from "@/lib/stacks";
import {
  PREFILL_KEYS,
  buildStreamSetupLink,
  hasPrefill,
  parseStreamPrefill,
  type StreamPrefill,
} from "@/lib/stream-setup-link";
import { useWorkspace } from "@/hooks/use-workspace";
import { LinkStreamButton } from "@/components/stream/link-stream-button";
import {
  DEFAULT_TOKEN,
  DURATION_UNITS,
  NETWORK,
  EXPLORER_BASE,
  BLOCKS_PER_HOUR,
  toRawAmount,
  hasExcessPrecision,
  fromRawAmount,
  type DurationUnit,
} from "@/lib/constants";
import { formatTokenAmount, blocksToTimeString, blockToClockTime } from "@/lib/utils";
import {
  TokenSelector,
  type TokenSelection,
} from "@/components/stream/token-selector";
import { toast } from "sonner";
import { Zap, ArrowRight, Info, Loader2, CheckCircle2, Copy } from "lucide-react";

export default function CreateStreamPage() {
  const { address, isConnected } = useWalletStore();
  const { blockHeight } = useBlockHeight();
  const { execute, isPending, isConfirming, txId, status, error, reset } = useStacksTx();

  // A prepared setup link fills the form once, on first render. The wallet
  // owner still reviews every field and signs; see lib/stream-setup-link.ts.
  const [prefill] = useState<StreamPrefill>(() =>
    typeof window === "undefined" ? {} : parseStreamPrefill(window.location.search, NETWORK)
  );
  const fromLink = hasPrefill(prefill);
  const [recipient, setRecipient] = useState(prefill.recipient ?? "");
  const [amount, setAmount] = useState(prefill.amount ?? "");
  const [durationValue, setDurationValue] = useState(prefill.durationValue ?? "30");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(prefill.durationUnit ?? "days");
  const [memo, setMemo] = useState(prefill.memo ?? "");
  const [createdStreamId, setCreatedStreamId] = useState<number | null>(null);
  const { workspace } = useWorkspace();

  // Strip the setup values from the address bar once the form is showing, so
  // a refresh does not refill it over edits. Waiting for a wallet means a
  // refresh before connecting still keeps the link. `token` is left for the
  // token selector, which applies and strips it itself.
  useEffect(() => {
    if (!isConnected) return;
    const params = new URLSearchParams(window.location.search);
    if (!PREFILL_KEYS.some((key) => params.has(key))) return;
    PREFILL_KEYS.forEach((key) => params.delete(key));
    const rest = params.toString();
    window.history.replaceState(
      null,
      "",
      rest ? `${window.location.pathname}?${rest}` : window.location.pathname
    );
  }, [isConnected]);
  // The selection carries chain-verified metadata (assetName + decimals read
  // from the contract), which is what the transaction builder needs. Starting
  // on the curated default means the form is usable immediately; a `?token=`
  // deep link or a search result replaces it once verified on-chain.
  const [selectedToken, setSelectedToken] = useState<TokenSelection>(() => ({
    resolved: {
      contractId: DEFAULT_TOKEN.contractId,
      assetName: DEFAULT_TOKEN.assetName,
      decimals: DEFAULT_TOKEN.decimals,
      symbol: DEFAULT_TOKEN.symbol,
      curated: true,
    },
    decimals: DEFAULT_TOKEN.decimals,
    symbol: DEFAULT_TOKEN.symbol,
    name: DEFAULT_TOKEN.name,
    icon: DEFAULT_TOKEN.icon,
    description: DEFAULT_TOKEN.description,
    trust: "curated",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { balance, isLoading: isBalanceLoading } = useTokenBalance(selectedToken.resolved);

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
  // Exact string→bigint conversion. parseFloat(amount) * 10**decimals loses
  // precision above 2^53 raw units and silently rounds, so the deposited
  // amount can differ from what the user typed. Returns null on a malformed
  // amount, which validate() reports rather than quietly sending 0.
  const amountRaw = toRawAmount(amount || "0", selectedToken.decimals);
  // ratePerBlock is display-only and intentionally stays in float, since the
  // on-chain stream rate is derived integer division in the contract, not the
  // raw total divided by blocks.
  const ratePerBlock = durationBlocks > 0 && amountRaw ? Number(amountRaw) / durationBlocks : 0;
  const displayPerBlock = BigInt(Math.max(1, Math.floor(ratePerBlock)));

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!recipient || !recipient.startsWith("S")) errs.recipient = "Enter a valid Stacks address";
    if (recipient === address) errs.recipient = "Cannot stream to yourself";
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a positive amount";
    else if (amountRaw === null) {
      errs.amount = "Enter a valid amount (digits and up to one decimal point)";
    }
    else if (hasExcessPrecision(amount, selectedToken.decimals)) {
      errs.amount = `${selectedToken.symbol} has ${selectedToken.decimals} decimal places. Remove the extra digits.`;
    }
    // Pre-flight balance check. The on-chain ft-transfer? inside create-stream
    // returns (err u1) if the wallet is short — catch it here so users don't
    // burn gas on a doomed tx.
    else if (amountRaw > balance) {
      errs.amount = `Insufficient ${selectedToken.symbol} balance. You have ${formatTokenAmount(balance, selectedToken.decimals)} ${selectedToken.symbol}.`;
    }
    if (!durationValue || parseFloat(durationValue) <= 0) errs.duration = "Enter a positive duration";
    if (durationBlocks < 1) errs.duration = "Duration must be at least 1 block (~5 seconds)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !address || amountRaw === null) return;

    // Fetch the latest block height right before submitting to avoid stale data.
    // Nakamoto Stacks blocks tick every ~5s, so a small buffer is not enough —
    // 120 blocks gives ~10–20 min of headroom for wallet review, mempool wait,
    // and mining inclusion. The contract asserts start-block >= stacks-block-height
    // at mine time, so too small a buffer surfaces as "Start block is in the past".
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
      tokenContract: selectedToken.resolved.contractId,
      token: selectedToken.resolved,
      depositAmount: amountRaw,
      startBlock: latestBlock + 120,
      durationBlocks,
      memo: memo || undefined,
      senderAddress: address,
    });

    const result = await execute(txOptions);

    if (result?.confirmed) {
      toast.success("Stream created and confirmed on-chain!");
      // The wallet result carries no stream id. Stream ids only increase, so
      // the sender's highest id is the stream this transaction just created.
      try {
        const ids = await getSenderStreams(address);
        setCreatedStreamId(ids.length > 0 ? Math.max(...ids) : null);
      } catch {
        setCreatedStreamId(null);
      }
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

  async function copySetupLink() {
    const link = buildStreamSetupLink(window.location.origin, {
      token: selectedToken.resolved.contractId,
      recipient,
      amount,
      durationValue,
      durationUnit,
      memo,
    });
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Setup link copied. Send it to the person who will sign.");
    } catch {
      toast.error("Could not copy. Your browser blocked clipboard access.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardTitle>Create Payment Stream</CardTitle>
        <CardDescription>
          Set up a continuous token stream to any Stacks address. Funds flow
          block-by-block and can be claimed at any time.
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {fromLink && status !== "success" && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 text-sm text-zinc-300">
              This form was filled in from a setup link. Check the recipient, the token and the
              amount before you sign.
            </div>
          )}

          <Input
            label="Recipient Address"
            placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            error={errors.recipient}
            disabled={isSubmitting}
          />

          {/* Token selector: verified tokens, registry search, and a contract
              id for tokens the registry hasn't indexed yet. Every path ends in
              an on-chain verification, so nothing unverified can be streamed. */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-300">Token</label>
            <TokenSelector
              value={selectedToken}
              onChange={(selection) => {
                setSelectedToken(selection);
                // Reset the amount: raw units differ per token's decimals, and
                // keeping the old number would silently reinterpret it.
                setAmount("");
              }}
              disabled={isSubmitting}
            />
            {selectedToken.description && (
              <p className="text-xs text-zinc-600">{selectedToken.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Input
              label={`Total Amount (${selectedToken.symbol})`}
              type="number"
              step="any"
              min="0"
              placeholder="1.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              hint={amountRaw !== null && amountRaw > 0n ? `${amountRaw.toLocaleString()} raw units (${selectedToken.decimals} decimals)` : undefined}
              disabled={isSubmitting}
            />
            {address && (
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Available:{" "}
                  {isBalanceLoading
                    ? "…"
                    : `${formatTokenAmount(balance, selectedToken.decimals)} ${selectedToken.symbol}`}
                </span>
                {balance > 0n && !isSubmitting && (
                  <button
                    type="button"
                    onClick={() => setAmount(fromRawAmount(balance, selectedToken.decimals))}
                    className="text-brand-400 hover:text-brand-300 underline"
                  >
                    Use max
                  </button>
                )}
              </div>
            )}
          </div>

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
            placeholder="Monthly payment"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            hint="Max 256 characters. Stored on-chain."
            disabled={isSubmitting}
          />

          {/* Preview */}
          {amountRaw !== null && amountRaw > 0n && durationBlocks > 0 && !isConfirming && status !== "success" && (
            <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Info className="h-3 w-3" /> Stream Preview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">Rate per hour</p>
                  <p
                    className="text-zinc-200 font-mono"
                    title={`${displayPerBlock.toLocaleString()} raw units per block`}
                  >
                    {formatTokenAmount(displayPerBlock * BigInt(BLOCKS_PER_HOUR), selectedToken.decimals)} {selectedToken.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Starts at</p>
                  <p
                    className="text-zinc-200"
                    title={`~Block #${(blockHeight + 120).toLocaleString()}`}
                  >
                    ~{blockToClockTime(blockHeight + 120, blockHeight)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Ends at</p>
                  <p
                    className="text-zinc-200"
                    title={`~Block #${(blockHeight + 120 + durationBlocks).toLocaleString()}`}
                  >
                    ~{blockToClockTime(blockHeight + 120 + durationBlocks, blockHeight)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Token</p>
                  <p className="text-zinc-200">{selectedToken.name} ({selectedToken.symbol})</p>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 pt-1 border-t border-border/40">
                Duration is approximate. Stacks blocks target ~5s under Nakamoto,
                so the actual stream length may vary by a few minutes.
              </p>
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
              {workspace?.isActive && createdStreamId !== null && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/20 pt-3">
                  <p className="text-xs text-zinc-400">
                    Link stream #{createdStreamId} to {workspace.name} so it counts on your
                    organisation&apos;s public record.
                  </p>
                  <LinkStreamButton
                    streamId={createdStreamId}
                    workspaceName={workspace.name}
                    onLinked={() => setCreatedStreamId(null)}
                  />
                </div>
              )}
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
          {status !== "success" && (
            <button
              type="button"
              onClick={copySetupLink}
              disabled={isSubmitting}
              className="mx-auto flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-brand-400 disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy setup link for someone else to sign
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}
