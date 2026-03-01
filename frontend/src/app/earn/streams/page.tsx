"use client";

import { StreamCard } from "@/components/stream/stream-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipientStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildClaimAllTx } from "@/lib/stacks";
import { toast } from "sonner";
import { Coins } from "lucide-react";

export default function EarnStreamsPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading, refetch } = useRecipientStreams();
  useBlockHeight();
  const { execute, isPending, isConfirming } = useStacksTx();

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
        description="When a DAO creates a payment stream for you, it will appear here."
      />
    );
  }

  return (
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
            const result = await execute(
              buildClaimAllTx({
                streamId: stream.id,
                tokenContract: stream.token,
              })
            );
            if (result?.confirmed) {
              toast.success("Tokens claimed!");
              refetch();
            } else if (result && !result.confirmed) {
              toast.error(result.status === "timeout" ? "Transaction timed out" : `Failed to claim: ${result.errorCode ? result.errorCode : result.status}`);
            }
          }}
        />
      ))}
    </div>
  );
}
