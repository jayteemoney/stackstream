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
import { MOCK_TOKEN_CONTRACT, BLOCKS_PER_DAY, BLOCKS_PER_MONTH } from "@/lib/constants";
import { formatTokenAmount, blocksToTimeString } from "@/lib/utils";
import { toast } from "sonner";
import { Zap, ArrowRight, Info } from "lucide-react";

export default function CreateStreamPage() {
  const { address, isConnected } = useWalletStore();
  const { blockHeight } = useBlockHeight();
  const { execute, isPending, txId } = useStacksTx();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [memo, setMemo] = useState("");
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

  const durationBlocks = Math.round(parseFloat(durationDays || "0") * BLOCKS_PER_DAY);
  const amountRaw = Math.round(parseFloat(amount || "0") * 1e8);
  const ratePerBlock = durationBlocks > 0 ? amountRaw / durationBlocks : 0;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!recipient || !recipient.startsWith("S")) errs.recipient = "Enter a valid Stacks address";
    if (recipient === address) errs.recipient = "Cannot stream to yourself";
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a positive amount";
    if (!durationDays || parseFloat(durationDays) <= 0) errs.duration = "Enter a positive duration";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !address) return;

    try {
      const txOptions = buildCreateStreamTx({
        recipient,
        tokenContract: MOCK_TOKEN_CONTRACT,
        depositAmount: BigInt(amountRaw),
        startBlock: blockHeight + 1,
        durationBlocks,
        memo: memo || undefined,
        senderAddress: address,
      });
      await execute(txOptions);
      toast.success("Stream creation submitted!");
    } catch {
      toast.error("Failed to create stream");
    }
  }

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
          />

          <Input
            label="Total Amount (msBTC)"
            type="number"
            step="0.00000001"
            min="0"
            placeholder="1.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            hint={amountRaw > 0 ? `${amountRaw.toLocaleString()} raw units` : undefined}
          />

          <Input
            label="Duration (days)"
            type="number"
            step="1"
            min="1"
            placeholder="30"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            error={errors.duration}
            hint={durationBlocks > 0 ? `${durationBlocks.toLocaleString()} blocks (~${blocksToTimeString(durationBlocks)})` : undefined}
          />

          <Input
            label="Memo (optional)"
            placeholder="Monthly contributor payment"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            hint="Max 256 characters. Stored on-chain."
          />

          {/* Preview */}
          {amountRaw > 0 && durationBlocks > 0 && (
            <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Info className="h-3 w-3" /> Stream Preview
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">Rate per block</p>
                  <p className="text-zinc-200 font-mono">{formatTokenAmount(ratePerBlock)} msBTC</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Start block</p>
                  <p className="text-zinc-200 font-mono">#{(blockHeight + 1).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">End block</p>
                  <p className="text-zinc-200 font-mono">#{(blockHeight + 1 + durationBlocks).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Token</p>
                  <p className="text-zinc-200">Mock sBTC (msBTC)</p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={isPending}>
            Create Stream <ArrowRight className="h-4 w-4" />
          </Button>

          {txId && (
            <p className="text-xs text-emerald-400 text-center">
              Transaction submitted:{" "}
              <a
                href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {txId.slice(0, 12)}...
              </a>
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
