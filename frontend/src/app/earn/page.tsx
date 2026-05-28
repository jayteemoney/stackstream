"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RealtimeBalance } from "@/components/stream/realtime-balance";
import { Button } from "@/components/ui/button";
import { useRecipientStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildClaimAllTx } from "@/lib/stacks";
import { getTokenConfigByContractId } from "@/lib/constants";
import { formatTokenAmount, formatTxError, pickPrimaryToken } from "@/lib/utils";
import { STREAM_STATUS } from "@/lib/constants";
import { toast } from "sonner";
import { Coins, Download, Zap, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

export default function EarnPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading, refetch } = useRecipientStreams();
  const { blockHeight } = useBlockHeight();
  const { execute, isWorking } = useStacksTx();

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Coins className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to view your earnings and claim streamed tokens."
      />
    );
  }

  const activeStreams = streams.filter((s) => s.status === STREAM_STATUS.ACTIVE);
  const { token: primaryToken, primaryStreams, otherCount: otherStreamCount } = pickPrimaryToken(streams);

  // Only streams still accruing (status==ACTIVE AND window open) should
  // contribute to the live rate and the cap on the hero counter. Without
  // the window check, the hero balance keeps ticking past a stream's
  // end-block until someone claims-all or cancels.
  const accruingPrimary = primaryStreams.filter(
    (s) =>
      s.status === STREAM_STATUS.ACTIVE &&
      blockHeight > 0 &&
      blockHeight < s.endBlock
  );
  const totalClaimable = primaryStreams.reduce((a, s) => a + (s.claimable ?? 0n), 0n);
  const totalEarned = primaryStreams.reduce((a, s) => a + (s.streamed ?? 0n), 0n);
  const totalClaimed = primaryStreams.reduce((a, s) => a + s.withdrawnAmount, 0n);
  const totalRatePerBlock = accruingPrimary.reduce(
    (a, s) => a + s.ratePerBlock,
    0n
  );
  const totalDepositAmount = primaryStreams.reduce((a, s) => a + s.depositAmount, 0n);
  const totalWithdrawnAmount = totalClaimed;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : streams.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-12 w-12" />}
          title="No income streams"
          description="You don't have any payment streams yet. When someone creates a stream for your address, it will appear here."
        />
      ) : (
        <>
          {/* Hero balance card */}
          <Card glow="orange" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-500/5 to-transparent rounded-bl-full" />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
                Total Claimable Balance ({primaryToken.symbol})
              </p>
              <RealtimeBalance
                baseBalance={totalClaimable}
                ratePerBlock={totalRatePerBlock}
                depositAmount={totalDepositAmount}
                withdrawnAmount={totalWithdrawnAmount}
                isActive={accruingPrimary.length > 0}
                decimals={primaryToken.decimals}
                symbol={primaryToken.symbol}
                size="lg"
              />
              {otherStreamCount > 0 && (
                <p className="text-xs text-zinc-500 mt-3">
                  + {otherStreamCount} stream{otherStreamCount === 1 ? "" : "s"} in other tokens — see the list below.
                </p>
              )}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  size="lg"
                  disabled={totalClaimable === 0n}
                  loading={isWorking}
                  onClick={async () => {
                    let anySuccess = false;
                    for (const stream of streams) {
                      if ((stream.claimable ?? 0n) > 0n) {
                        const result = await execute(
                          buildClaimAllTx({
                            streamId: stream.id,
                            tokenContract: stream.token,
                            ftName: getTokenConfigByContractId(stream.token).ftName,
                            expectedAmount: stream.claimable ?? 0n,
                          })
                        );
                        if (result?.confirmed) {
                          toast.success(`Claimed stream #${stream.id}`);
                          anySuccess = true;
                        } else if (result && !result.confirmed) {
                          toast.error(formatTxError(`Stream #${stream.id} failed`, result));
                        } else {
                          // User cancelled wallet prompt — stop the loop
                          break;
                        }
                      }
                    }
                    if (anySuccess) refetch();
                  }}
                >
                  <Download className="h-4 w-4" />
                  Claim All
                </Button>
                <Link href="/earn/streams">
                  <Button variant="outline" size="lg">
                    View Streams
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label={`Total Earned (${primaryToken.symbol})`}
              value={`${formatTokenAmount(totalEarned, primaryToken.decimals)} ${primaryToken.symbol}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label={`Total Claimed (${primaryToken.symbol})`}
              value={`${formatTokenAmount(totalClaimed, primaryToken.decimals)} ${primaryToken.symbol}`}
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Active Streams"
              value={String(activeStreams.length)}
              sub={`${streams.length} total`}
              icon={<Zap className="h-4 w-4" />}
            />
          </div>
        </>
      )}
    </div>
  );
}
