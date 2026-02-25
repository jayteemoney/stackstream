"use client";

import { Card } from "@/components/ui/card";
import { Badge, streamStatusToBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RealtimeBalance } from "./realtime-balance";
import {
  formatTokenAmount,
  truncateAddress,
  getStreamStatusLabel,
  getStreamProgress,
} from "@/lib/utils";
import { STREAM_STATUS } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import type { StreamData } from "@/lib/stacks";
import { Pause, Play, XCircle, ArrowUpCircle, Download } from "lucide-react";

interface StreamCardProps {
  id: number;
  stream: StreamData;
  /** "sender" shows admin controls, "recipient" shows claim */
  perspective: "sender" | "recipient";
  claimable?: bigint;
  streamed?: bigint;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onTopUp?: () => void;
  onClaim?: () => void;
  actionLoading?: boolean;
}

export function StreamCard({
  id,
  stream,
  perspective,
  claimable = 0n,
  streamed = 0n,
  onPause,
  onResume,
  onCancel,
  onTopUp,
  onClaim,
  actionLoading,
}: StreamCardProps) {
  const blockHeight = useAppStore((s) => s.currentBlockHeight);
  const progress = getStreamProgress(
    stream.startBlock,
    stream.endBlock,
    blockHeight,
    stream.totalPausedDuration
  );
  const isActive = stream.status === STREAM_STATUS.ACTIVE;
  const isPaused = stream.status === STREAM_STATUS.PAUSED;
  const isTerminal =
    stream.status === STREAM_STATUS.CANCELLED ||
    stream.status === STREAM_STATUS.DEPLETED;

  return (
    <Card
      className="hover:border-brand-500/20 transition-all duration-300 group"
      glow={isActive ? "orange" : "none"}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
            <span className="text-sm font-bold text-brand-400">#{id}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {perspective === "sender" ? "To" : "From"}{" "}
              <span className="font-mono text-xs text-zinc-400">
                {truncateAddress(
                  perspective === "sender" ? stream.recipient : stream.sender,
                  6
                )}
              </span>
            </p>
            <p className="text-xs text-zinc-600">
              Block {stream.startBlock.toLocaleString()} &rarr;{" "}
              {stream.endBlock.toLocaleString()}
            </p>
            {stream.memo && (
              <p className="text-xs text-zinc-500 mt-0.5 italic truncate max-w-[200px]" title={stream.memo}>
                &ldquo;{stream.memo}&rdquo;
              </p>
            )}
          </div>
        </div>
        <Badge variant={streamStatusToBadge(stream.status)}>
          {getStreamStatusLabel(stream.status)}
        </Badge>
      </div>

      {/* Balance display */}
      {perspective === "recipient" && !isTerminal ? (
        <div className="mb-4 rounded-xl bg-surface-0 p-4 border border-border">
          <p className="text-xs text-zinc-500 mb-1">Claimable Balance</p>
          <RealtimeBalance
            baseBalance={claimable}
            ratePerBlock={stream.ratePerBlock}
            isActive={isActive}
            size="sm"
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Deposited</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {formatTokenAmount(stream.depositAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Streamed</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {formatTokenAmount(streamed || stream.withdrawnAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Withdrawn</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {formatTokenAmount(stream.withdrawnAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <Progress
        value={progress}
        variant={isActive ? "brand" : isPaused ? "amber" : "green"}
        showLabel
        size="sm"
        className="mb-4"
      />

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {perspective === "sender" && !isTerminal && (
          <>
            {isActive && onPause && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onPause}
                loading={actionLoading}
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}
            {isPaused && onResume && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onResume}
                loading={actionLoading}
              >
                <Play className="h-3.5 w-3.5" /> Resume
              </Button>
            )}
            {onTopUp && (
              <Button variant="ghost" size="sm" onClick={onTopUp}>
                <ArrowUpCircle className="h-3.5 w-3.5" /> Top Up
              </Button>
            )}
            {onCancel && (
              <Button variant="danger" size="sm" onClick={onCancel} className="ml-auto">
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
          </>
        )}

        {perspective === "recipient" && !isTerminal && onClaim && (
          <Button
            variant="primary"
            size="sm"
            onClick={onClaim}
            loading={actionLoading}
            disabled={claimable === 0n}
            className="w-full"
          >
            <Download className="h-3.5 w-3.5" />
            Claim {claimable > 0n ? formatTokenAmount(claimable) : ""} msBTC
          </Button>
        )}
      </div>
    </Card>
  );
}
