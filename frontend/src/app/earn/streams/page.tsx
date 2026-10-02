"use client";

import { StreamCard } from "@/components/stream/stream-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipientStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildClaimAllTx, requireTokenMetadata, UnresolvableTokenError } from "@/lib/stacks";
import { useTokensMetadata } from "@/hooks/use-token-metadata";
import type { StreamData } from "@/lib/stacks";
import { ClaimDialog } from "@/components/stream/claim-dialog";
import { formatTxError } from "@/lib/utils";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { useState } from "react";

export default function EarnStreamsPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading, refetch } = useRecipientStreams();
  useBlockHeight();
  const { execute, isPending, isConfirming } = useStacksTx();
  const [claimTarget, setClaimTarget] = useState<{ id: number; stream: StreamData; claimable: bigint } | null>(null);
  // One resolution per distinct token, not per stream. Streams whose token
  // cannot be verified are simply absent here, and their claim refuses below.
  const tokensById = useTokensMetadata(streams.map((s) => s.token));

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Coins className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to view your income streams."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <EmptyState
        icon={<Coins className="h-12 w-12" />}
        title="No income streams"
        description="When someone creates a payment stream for your address, it will appear here."
      />
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {streams.map((stream) => (
        <StreamCard
          key={stream.id}
          id={stream.id}
          stream={stream}
          perspective="recipient"
          claimable={stream.claimable}
          streamed={stream.streamed}
          actionLoading={isPending || isConfirming}
          onClaim={async () => {
            // Claiming moves tokens out of the manager, so the post-condition
            // has to name the exact asset. If it can't be proven, refuse rather
            // than guess: a wrong asset name makes the wallet reject the tx with
            // an unexplained "post-condition was not met".
            try {
              const token = tokensById[stream.token] ?? (await requireTokenMetadata(stream.token));
              const result = await execute(
                buildClaimAllTx({
                  streamId: stream.id,
                  tokenContract: stream.token,
                  token,
                  remainingBalance:
                    stream.depositAmount - stream.withdrawnAmount,
                })
              );
              if (result?.confirmed) {
                toast.success("Tokens claimed!");
                refetch();
              } else if (result && !result.confirmed) {
                toast.error(formatTxError("Failed to claim", result));
              }
            } catch (err) {
              toast.error(
                err instanceof UnresolvableTokenError
                  ? err.message
                  : formatTxError("Failed to claim", undefined, err)
              );
            }
          }}
          onClaimPartial={() =>
            setClaimTarget({
              id: stream.id,
              stream,
              claimable: stream.claimable ?? 0n,
            })
          }
        />
      ))}
    </div>

    {claimTarget && (
      <ClaimDialog
        open
        streamId={claimTarget.id}
        stream={claimTarget.stream}
        claimable={claimTarget.claimable}
        onClose={() => setClaimTarget(null)}
        onSuccess={() => {
          setClaimTarget(null);
          refetch();
        }}
      />
    )}
    </>
  );
}
