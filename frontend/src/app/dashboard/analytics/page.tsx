"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useSenderStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { formatTokenAmount, getStreamProgress } from "@/lib/utils";
import { STREAM_STATUS } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import { BarChart3, Zap, TrendingDown, Clock, Coins } from "lucide-react";

export default function AnalyticsPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading } = useSenderStreams();
  useBlockHeight();
  const blockHeight = useAppStore((s) => s.currentBlockHeight);

  if (!isConnected) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to view treasury analytics."
      />
    );
  }

  const active = streams.filter((s) => s.status === STREAM_STATUS.ACTIVE);
  const totalDeposited = streams.reduce((a, s) => a + s.depositAmount, 0n);
  const totalWithdrawn = streams.reduce((a, s) => a + s.withdrawnAmount, 0n);
  const totalRemaining = totalDeposited - totalWithdrawn;

  // Burn rate: sum of active stream rates per block
  const burnRatePerBlock = active.reduce(
    (a, s) => a + Number(s.ratePerBlock) / 1e12,
    0
  );
  const burnRatePerDay = burnRatePerBlock * 144;

  // Treasury utilization
  const utilization =
    totalDeposited > 0n
      ? (Number(totalWithdrawn) / Number(totalDeposited)) * 100
      : 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Value Locked"
              value={`${formatTokenAmount(totalRemaining)}`}
              sub="msBTC in streams"
              icon={<Coins className="h-4 w-4" />}
            />
            <StatCard
              label="Burn Rate"
              value={`${burnRatePerDay.toFixed(4)}`}
              sub="msBTC / day"
              icon={<TrendingDown className="h-4 w-4" />}
              trend="down"
            />
            <StatCard
              label="Active Streams"
              value={String(active.length)}
              sub={`of ${streams.length} total`}
              icon={<Zap className="h-4 w-4" />}
            />
            <StatCard
              label="Utilization"
              value={`${utilization.toFixed(1)}%`}
              sub="of deposits claimed"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Stream breakdown table */}
          <Card>
            <CardTitle className="mb-4">Stream Breakdown</CardTitle>
            {streams.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                No streams to analyze.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        ID
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Recipient
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Deposited
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Claimed
                      </th>
                      <th className="py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {streams.map((s) => {
                      const progress = getStreamProgress(
                        s.startBlock,
                        s.endBlock,
                        blockHeight,
                        s.totalPausedDuration
                      );
                      return (
                        <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                          <td className="py-3 pr-4 font-mono text-xs text-zinc-400">
                            #{s.id}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-zinc-300">
                            {s.recipient.slice(0, 8)}...
                          </td>
                          <td className="py-3 pr-4 text-zinc-200">
                            {formatTokenAmount(s.depositAmount)}
                          </td>
                          <td className="py-3 pr-4 text-zinc-200">
                            {formatTokenAmount(s.withdrawnAmount)}
                          </td>
                          <td className="py-3 w-40">
                            <Progress value={progress} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
