"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, streamStatusToBadge } from "@/components/ui/badge";
import { useRecipientStreams } from "@/hooks/use-streams";
import { useWalletStore } from "@/stores/wallet-store";
import { formatTokenAmount, truncateAddress, getStreamStatusLabel } from "@/lib/utils";
import { Clock, ExternalLink } from "lucide-react";
import { EXPLORER_BASE } from "@/lib/constants";

export default function HistoryPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading } = useRecipientStreams();

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Clock className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to view your claim history."
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  // Show all streams that have had at least one withdrawal
  const streamsWithHistory = streams.filter((s) => s.withdrawnAmount > 0n);

  if (streamsWithHistory.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-12 w-12" />}
        title="No claim history"
        description="Your claimed tokens will appear here once you make your first claim."
      />
    );
  }

  return (
    <Card>
      <CardTitle className="mb-4">Claim History</CardTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-150">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Stream
              </th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                From
              </th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Total Deposited
              </th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Claimed
              </th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Block Range
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {streamsWithHistory.map((s) => (
              <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-brand-400">#{s.id}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-zinc-300">
                    {truncateAddress(s.sender, 5)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-zinc-200">
                  {formatTokenAmount(s.depositAmount)} msBTC
                </td>
                <td className="py-3 pr-4 text-emerald-400 font-medium">
                  {formatTokenAmount(s.withdrawnAmount)} msBTC
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={streamStatusToBadge(s.status)}>
                    {getStreamStatusLabel(s.status)}
                  </Badge>
                </td>
                <td className="py-3 text-xs text-zinc-500 font-mono">
                  {s.startBlock.toLocaleString()} &rarr; {s.endBlock.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
