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
  const { execute, isPending } = useStacksTx();
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 border border-border p-1">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStreams.map((stream) => (
            <StreamCard
              key={stream.id}
              id={stream.id}
              stream={stream}
              perspective="sender"
              actionLoading={isPending}
              onPause={async () => {
                try {
                  await execute(buildPauseStreamTx(stream.id));
                  toast.success("Pause transaction submitted");
                  refetch();
                } catch {
                  toast.error("Failed to pause");
                }
              }}
              onResume={async () => {
                try {
                  await execute(buildResumeStreamTx(stream.id));
                  toast.success("Resume transaction submitted");
                  refetch();
                } catch {
                  toast.error("Failed to resume");
                }
              }}
              onTopUp={() => setTopUpTarget({ id: stream.id, stream })}
              onCancel={async () => {
                try {
                  await execute(
                    buildCancelStreamTx({
                      streamId: stream.id,
                      tokenContract: stream.token,
                    })
                  );
                  toast.success("Cancel transaction submitted");
                  refetch();
                } catch {
                  toast.error("Failed to cancel");
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
