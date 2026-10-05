"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StreamCard } from "@/components/stream/stream-card";
import { useSenderStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { formatTokenAmount, formatTxError, pickPrimaryToken } from "@/lib/utils";
import {
  buildPauseStreamTx,
  buildResumeStreamTx,
  buildCancelStreamTx,
  requireTokenMetadata,
  UnresolvableTokenError,
} from "@/lib/stacks";
import { useTokenMetadata } from "@/hooks/use-token-metadata";
import type { StreamData } from "@/lib/stacks";
import { STREAM_STATUS, unresolvableTokenLabel } from "@/lib/constants";
import { TopUpDialog } from "@/components/stream/top-up-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { PlusCircle, Zap, Users, Coins, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function DashboardPage() {
  const { isConnected } = useWalletStore();
  const [topUpTarget, setTopUpTarget] = useState<{ id: number; stream: StreamData } | null>(null);
  const { streams, isLoading, refetch } = useSenderStreams();
  useBlockHeight();
  const { execute, isPending, isConfirming } = useStacksTx();

  const activeStreams = streams.filter((s) => s.status === STREAM_STATUS.ACTIVE);
  const { primaryTokenId, primaryStreams, otherCount } = pickPrimaryToken(streams);
  // Totals are only meaningful within one token, and only once that token's
  // decimals are known. Until then these cards show "—" instead of a total
  // scaled with the wrong power of ten.
  const { token: primaryToken } = useTokenMetadata(primaryTokenId ?? "");
  const primaryDecimals = primaryToken?.decimals;
  const primarySymbol =
    primaryToken?.symbol ?? (primaryTokenId ? unresolvableTokenLabel(primaryTokenId) : "");
  const totalDeposited = primaryStreams.reduce((acc, s) => acc + s.depositAmount, 0n);
  const totalWithdrawn = primaryStreams.reduce((acc, s) => acc + s.withdrawnAmount, 0n);

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Zap className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to open streams and manage real-time payments, settled on Bitcoin."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
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
              label={`Total Deposited (${primarySymbol})`}
              value={
                primaryDecimals === undefined
                  ? "—"
                  : `${formatTokenAmount(totalDeposited, primaryDecimals)} ${primarySymbol}`
              }
              sub={otherCount > 0 ? `+ ${otherCount} stream${otherCount === 1 ? "" : "s"} in other tokens` : undefined}
              icon={<Coins className="h-4 w-4" />}
            />
            <StatCard
              label={`Total Claimed (${primarySymbol})`}
              value={
                primaryDecimals === undefined
                  ? "—"
                  : `${formatTokenAmount(totalWithdrawn, primaryDecimals)} ${primarySymbol}`
              }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-12 w-12" />}
          title="No streams yet"
          description="Open your first stream and start paying in real time. Pay a teammate, a contractor, a grantee, or a vendor, settled on Bitcoin."
          action={
            <Link href="/dashboard/create">
              <Button>
                <PlusCircle className="h-4 w-4" /> Create Stream
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streams.slice(0, 6).map((stream) => (
            <StreamCard
              key={stream.id}
              id={stream.id}
              stream={stream}
              perspective="sender"
              actionLoading={isPending || isConfirming}
              onPause={async () => {
                const result = await execute(buildPauseStreamTx(stream.id));
                if (result?.confirmed) {
                  toast.success("Stream paused");
                  refetch();
                } else if (result && !result.confirmed) {
                  toast.error(formatTxError("Failed to pause", result));
                }
              }}
              onResume={async () => {
                const result = await execute(buildResumeStreamTx(stream.id));
                if (result?.confirmed) {
                  toast.success("Stream resumed");
                  refetch();
                } else if (result && !result.confirmed) {
                  toast.error(formatTxError("Failed to resume", result));
                }
              }}
              onTopUp={() => setTopUpTarget({ id: stream.id, stream })}
              onCancel={async () => {
                // Cancel refunds the sender and pays out the recipient, so the
                // post-condition must name the exact asset. Refuse if unknown
                // rather than send a tx the wallet will reject opaquely.
                try {
                  const token = await requireTokenMetadata(stream.token);
                  const result = await execute(
                    buildCancelStreamTx({
                      streamId: stream.id,
                      tokenContract: stream.token,
                      token,
                      unclaimedBalance: stream.depositAmount - stream.withdrawnAmount,
                    })
                  );
                  if (result?.confirmed) {
                    toast.success("Stream cancelled");
                    refetch();
                  } else if (result && !result.confirmed) {
                    toast.error(formatTxError("Failed to cancel", result));
                  }
                } catch (err) {
                  toast.error(
                    err instanceof UnresolvableTokenError
                      ? err.message
                      : formatTxError("Failed to cancel", null, err)
                  );
                }
              }}
            />
          ))}
        </div>
      )}

      {topUpTarget && (
        <TopUpDialog
          open
          streamId={topUpTarget.id}
          stream={topUpTarget.stream}
          onClose={() => setTopUpTarget(null)}
          onSuccess={() => {
            setTopUpTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
