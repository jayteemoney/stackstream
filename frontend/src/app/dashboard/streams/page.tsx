"use client";

import { StreamCard } from "@/components/stream/stream-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSenderStreams } from "@/hooks/use-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWalletStore } from "@/stores/wallet-store";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import {
  buildPauseStreamTx,
  buildResumeStreamTx,
  buildCancelStreamTx,
  buildExpireStreamTx,
} from "@/lib/stacks";
import type { StreamData } from "@/lib/stacks";
import { TopUpDialog } from "@/components/stream/top-up-dialog";
import { STREAM_STATUS } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";
import { PlusCircle, Zap, Filter } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Depleted", value: "depleted" },
] as const;

type FilterValue = (typeof filterOptions)[number]["value"];

export default function ManageStreamsPage() {
  const { isConnected } = useWalletStore();
  const { streams, isLoading, refetch } = useSenderStreams();
  useBlockHeight();
  const { execute, isPending, isConfirming } = useStacksTx();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [topUpTarget, setTopUpTarget] = useState<{ id: number; stream: StreamData } | null>(null);

  const filteredStreams =
    filter === "all"
      ? streams
      : streams.filter((s) => {
          if (filter === "active") return s.status === STREAM_STATUS.ACTIVE;
          if (filter === "paused") return s.status === STREAM_STATUS.PAUSED;
          if (filter === "cancelled") return s.status === STREAM_STATUS.CANCELLED;
          if (filter === "depleted") return s.status === STREAM_STATUS.DEPLETED;
          return true;
        });

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Zap className="h-12 w-12" />}
        title="Connect your wallet"
        description="Connect a Stacks wallet to manage your payment streams."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 border border-border p-1 overflow-x-auto max-w-full">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                filter === opt.value
                  ? "bg-surface-4 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Link href="/dashboard/create">
          <Button size="sm">
            <PlusCircle className="h-4 w-4" /> New Stream
          </Button>
        </Link>
      </div>

      {/* Streams grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredStreams.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-12 w-12" />}
          title={filter === "all" ? "No streams yet" : `No ${filter} streams`}
          description={
            filter === "all"
              ? "Create your first payment stream to get started."
              : "No streams match this filter."
          }
          action={
            filter === "all" ? (
              <Link href="/dashboard/create">
                <Button>
                  <PlusCircle className="h-4 w-4" /> Create Stream
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStreams.map((stream) => (
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
                  toast.error(result.status === "timeout" ? "Transaction timed out" : `Failed to pause: ${result.errorCode ? result.errorCode : result.status}`);
                }
              }}
              onResume={async () => {
                const result = await execute(buildResumeStreamTx(stream.id));
                if (result?.confirmed) {
                  toast.success("Stream resumed");
                  refetch();
                } else if (result && !result.confirmed) {
                  toast.error(result.status === "timeout" ? "Transaction timed out" : `Failed to resume: ${result.errorCode ? result.errorCode : result.status}`);
                }
              }}
              onTopUp={() => setTopUpTarget({ id: stream.id, stream })}
              onCancel={async () => {
                const result = await execute(
                  buildCancelStreamTx({
                    streamId: stream.id,
                    tokenContract: stream.token,
                  })
                );
                if (result?.confirmed) {
                  toast.success("Stream cancelled");
                  refetch();
                } else if (result && !result.confirmed) {
                  toast.error(result.status === "timeout" ? "Transaction timed out" : `Failed to cancel: ${result.errorCode ? result.errorCode : result.status}`);
                }
              }}
              onExpire={async () => {
                const result = await execute(
                  buildExpireStreamTx({
                    streamId: stream.id,
                    tokenContract: stream.token,
                  })
                );
                if (result?.confirmed) {
                  toast.success("Stream expired and funds settled");
                  refetch();
                } else if (result && !result.confirmed) {
                  toast.error(result.status === "timeout" ? "Transaction timed out" : `Failed to expire: ${result.errorCode ? result.errorCode : result.status}`);
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
