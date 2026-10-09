"use client";

import Link from "next/link";
import { useNetworkStats } from "@/hooks/use-network-stats";

/**
 * The live usage line under the hero. Read from the contract through
 * /api/stats; it renders nothing until the numbers arrive, so a visitor never
 * sees a placeholder or a guessed figure.
 */
export function LiveStats() {
  const { stats: data } = useNetworkStats();
  if (!data) return null;

  const orgs = data.workspacesRegistered;
  return (
    <Link
      href="/organisations"
      className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface-1/70 px-4 py-2 text-xs text-zinc-400 transition-colors hover:border-brand-500/30 hover:text-zinc-200"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span>
        <span className="font-mono tabular-nums text-zinc-200">{data.streamsCreated}</span> streams on
        mainnet
      </span>
      <span className="text-zinc-700">·</span>
      <span>
        <span className="font-mono tabular-nums text-zinc-200">{orgs}</span>{" "}
        {orgs === 1 ? "organisation" : "organisations"}
      </span>
      <span className="hidden text-zinc-600 sm:inline">· read live from the contract</span>
    </Link>
  );
}
