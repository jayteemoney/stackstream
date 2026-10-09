"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetworkStats } from "@/hooks/use-network-stats";

/**
 * StackStream's live usage on mainnet, shown at the top of the dashboard
 * whether or not a wallet is connected. Both figures come from the contract.
 */
export function NetworkStats() {
  const { stats, isLoading } = useNetworkStats();

  if (isLoading) return <Skeleton className="h-36 rounded-2xl" />;
  if (!stats) return null;

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          StackStream on mainnet
        </p>
        <Link
          href="/organisations"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-brand-400"
        >
          See organisations <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="font-mono text-4xl font-semibold tabular-nums leading-none text-brand-400 sm:text-5xl">
            {stats.streamsCreated}
          </p>
          <p className="mt-2 text-sm text-zinc-400">Streams created</p>
        </div>
        <div>
          <p className="font-mono text-4xl font-semibold tabular-nums leading-none text-brand-400 sm:text-5xl">
            {stats.workspacesRegistered}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {stats.workspacesRegistered === 1 ? "Organisation registered" : "Organisations registered"}
          </p>
        </div>
      </div>
    </div>
  );
}
