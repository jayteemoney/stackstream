"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildRegisterDaoTx } from "@/lib/stacks";
import { toast } from "sonner";
import { Zap, ArrowRight } from "lucide-react";

export default function RegisterDaoPage() {
  const { isConnected } = useWalletStore();
  const { execute, isPending, txId } = useStacksTx();

  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Zap className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to register your DAO."
      />
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Enter a DAO name";
    if (name.length > 64) errs.name = "Name must be 64 characters or fewer";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const txOptions = buildRegisterDaoTx(name.trim());
      await execute(txOptions);
      toast.success("DAO registration submitted!");
    } catch {
      toast.error("Failed to register DAO");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardTitle>Register DAO</CardTitle>
        <CardDescription>
          Register your wallet as a DAO on StackStream. This enables stream
          tracking and analytics for your organization.
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Input
            label="DAO Name"
            placeholder="My DAO"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            hint="A unique name for your DAO (max 64 characters)"
          />

          <Button type="submit" size="lg" className="w-full" loading={isPending}>
            Register DAO <ArrowRight className="h-4 w-4" />
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
