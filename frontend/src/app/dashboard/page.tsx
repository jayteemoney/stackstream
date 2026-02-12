"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StreamCard } from "@/components/stream/stream-card";
import { useSenderStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { formatTokenAmount } from "@/lib/utils";
import { buildPauseStreamTx, buildResumeStreamTx } from "@/lib/stacks";
import { STREAM_STATUS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { PlusCircle, Zap, Users, Coins, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading, refetch } = useSenderStreams();
  useBlockHeight();
  const { execute, isPending } = useStacksTx();

  const activeStreams = streams.filter((s) => s.status === STREAM_STATUS.ACTIVE);
  const totalDeposited = streams.reduce((acc, s) => acc + s.depositAmount, 0n);
  const totalWithdrawn = streams.reduce((acc, s) => acc + s.withdrawnAmount, 0n);

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Zap className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to view your DAO dashboard and manage payment streams."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Active Streams"
              value={String(activeStreams.length)}
              sub={`${streams.length} total`}
              icon={<Zap className="h-4 w-4" />}
            />
            <StatCard
              label="Total Deposited"
              value={`${formatTokenAmount(totalDeposited)} msBTC`}
              icon={<Coins className="h-4 w-4" />}
            />
            <StatCard
              label="Total Claimed"
              value={`${formatTokenAmount(totalWithdrawn)} msBTC`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="Recipients"
              value={String(new Set(streams.map((s) => s.recipient)).size)}
              icon={<Users className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-200">Recent Streams</h2>
        <Link href="/dashboard/create">
          <Button size="sm">
            <PlusCircle className="h-4 w-4" /> New Stream
          </Button>
        </Link>
      </div>

      {/* Stream list */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-12 w-12" />}
          title="No streams yet"
          description="Create your first payment stream to start paying contributors in real-time."
          action={
            <Link href="/dashboard/create">
              <Button>
                <PlusCircle className="h-4 w-4" /> Create Stream
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {streams.slice(0, 6).map((stream) => (
            <StreamCard
              key={stream.id}
              id={stream.id}
              stream={stream}
              perspective="sender"
              actionLoading={isPending}
              onPause={async () => {
                try {
                  await execute(buildPauseStreamTx(stream.id));
                  toast.success("Stream paused");
                  refetch();
                } catch {
                  toast.error("Failed to pause stream");
                }
              }}
              onResume={async () => {
                try {
                  await execute(buildResumeStreamTx(stream.id));
                  toast.success("Stream resumed");
                  refetch();
                } catch {
                  toast.error("Failed to resume stream");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
