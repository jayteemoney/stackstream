"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildFaucetTx } from "@/lib/stacks";
import { useWalletStore } from "@/stores/wallet-store";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { formatTokenAmount } from "@/lib/utils";
import { toast } from "sonner";
import { Droplets } from "lucide-react";

interface MintDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MintDialog({ open, onClose }: MintDialogProps) {
  const { address } = useWalletStore();
  const { execute, isPending } = useStacksTx();
  const { balance, refetch } = useTokenBalance();
  const [amount, setAmount] = useState("100");

  const amountRaw = Math.round(parseFloat(amount || "0") * 1e8);
  const maxRaw = 100_000_000_000; // 1000 msBTC max per call

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    if (!address || amountRaw <= 0) return;

    if (amountRaw > maxRaw) {
      toast.error("Max 1,000 msBTC per faucet call");
      return;
    }

    const txOptions = buildFaucetTx({
      amount: BigInt(amountRaw),
      senderAddress: address,
    });
    const result = await execute(txOptions);
    if (result?.confirmed) {
      toast.success("Test tokens minted!");
      refetch();
    } else if (result && !result.confirmed) {
      toast.error(result.status === "timeout" ? "Transaction timed out" : `Mint failed: ${result.errorCode ?? result.status}`);
    }
  }

  function handleClose() {
    setAmount("100");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
          <Droplets className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Mint Test Tokens
          </h2>
          <p className="text-xs text-zinc-500">
            Get msBTC from the testnet faucet
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-0 p-3 mb-4">
        <p className="text-xs text-zinc-500">Current balance</p>
        <p className="text-sm font-mono text-zinc-200">
          {formatTokenAmount(balance)} msBTC
        </p>
      </div>

      <form onSubmit={handleMint} className="space-y-4">
        <Input
          label="Amount (msBTC)"
          type="number"
          step="1"
          min="1"
          max="1000"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          hint="Max 1,000 msBTC per transaction"
        />

        <div className="flex gap-2">
          {[10, 100, 500, 1000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="flex-1 rounded-lg border border-border bg-surface-2 px-2 py-2 sm:py-1.5 text-xs text-zinc-400 hover:bg-surface-3 hover:text-zinc-200 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button type="submit" className="flex-1" loading={isPending}>
            <Droplets className="h-4 w-4" /> Mint Tokens
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
