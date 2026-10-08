"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge, streamStatusToBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RealtimeBalance } from "./realtime-balance";
import {
  formatTokenAmount,
  truncateAddress,
  getStreamStatusLabel,
  formatStreamWindow,
} from "@/lib/utils";
import { STREAM_STATUS, unresolvableTokenLabel } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import { useTokenMetadata } from "@/hooks/use-token-metadata";
import { useStreamProgress } from "@/hooks/use-stream-progress";
import type { StreamData } from "@/lib/stacks";
import { Pause, Play, XCircle, ArrowUpCircle, Download, TimerOff } from "lucide-react";

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
  onClaimPartial?: () => void;
  onExpire?: () => void;
  actionLoading?: boolean;
  /** Extra row under the actions, e.g. linking the stream to an organisation. */
  footer?: ReactNode;
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
  onClaimPartial,
  onExpire,
  actionLoading,
  footer,
}: StreamCardProps) {
  const blockHeight = useAppStore((s) => s.currentBlockHeight);
  // Resolve the stream's own token. getTokenConfigByContractId previously
  // returned DEFAULT_TOKEN for any uncurated contract, so a USDA stream was
  // labelled "sBTC" and its amounts divided by 1e8 instead of 1e6.
  const { token: tokenConfig, isLoading: isTokenLoading } = useTokenMetadata(stream.token);
  const decimals = tokenConfig?.decimals;
  const symbol = tokenConfig?.symbol ?? unresolvableTokenLabel(stream.token);
  const isActive = stream.status === STREAM_STATUS.ACTIVE;
  const isPaused = stream.status === STREAM_STATUS.PAUSED;
  const isTerminal =
    stream.status === STREAM_STATUS.CANCELLED ||
    stream.status === STREAM_STATUS.DEPLETED;
  // A stream stays in STATUS-ACTIVE after its end-block until someone claims or
  // cancels — but the contract's pause-stream / resume-stream reject this state
  // with ERR-STREAM-ENDED (u207). Hide both controls once the window has closed.
  const isWindowClosed = blockHeight > 0 && blockHeight >= stream.endBlock;
  // True accrual requires both ACTIVE status AND an open window — drives
  // both the live counter and the live progress bar.
  const isAccruing = isActive && !isWindowClosed;
  const progress = useStreamProgress(
    stream.startBlock,
    stream.endBlock,
    blockHeight,
    stream.totalPausedDuration,
    isAccruing
  );

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
            <p
              className="text-xs text-zinc-600"
              title={`Block ${stream.startBlock.toLocaleString()} → ${stream.endBlock.toLocaleString()}`}
            >
              {formatStreamWindow(stream.startBlock, stream.endBlock, blockHeight) ??
                `Block ${stream.startBlock.toLocaleString()} → ${stream.endBlock.toLocaleString()}`}
            </p>
            {stream.memo && (
              <p className="text-xs text-zinc-500 mt-0.5 italic truncate max-w-30 sm:max-w-50" title={stream.memo}>
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
          {decimals === undefined ? (
            // Show the token identity but not a number. Rendering the balance
            // with a guessed scale is how a 1.2 USDA claimable showed as 0.012.
            <p className="text-sm text-zinc-500">
              {isTokenLoading ? "Loading token…" : `Unavailable (${symbol})`}
            </p>
          ) : (
            <RealtimeBalance
              baseBalance={claimable}
              ratePerBlock={stream.ratePerBlock}
              depositAmount={stream.depositAmount}
              withdrawnAmount={stream.withdrawnAmount}
              isActive={isAccruing}
              decimals={decimals}
              symbol={symbol}
              size="sm"
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Deposited</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {decimals === undefined ? "—" : formatTokenAmount(stream.depositAmount, decimals)}{" "}
              <span className="text-zinc-500 text-xs">{symbol}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Streamed</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {decimals === undefined ? "—" : formatTokenAmount(streamed || stream.withdrawnAmount, decimals)}{" "}
              <span className="text-zinc-500 text-xs">{symbol}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Withdrawn</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {decimals === undefined ? "—" : formatTokenAmount(stream.withdrawnAmount, decimals)}{" "}
              <span className="text-zinc-500 text-xs">{symbol}</span>
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
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        {perspective === "sender" && !isTerminal && (
          <>
            {isActive && !isWindowClosed && onPause && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onPause}
                loading={actionLoading}
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}
            {isPaused && !isWindowClosed && onResume && (
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
            {isPaused && blockHeight > stream.endBlock && onExpire && (
              <Button variant="danger" size="sm" onClick={onExpire} loading={actionLoading}>
                <TimerOff className="h-3.5 w-3.5" /> Expire Stream
              </Button>
            )}
            {onCancel && (
              <Button variant="danger" size="sm" onClick={onCancel} className="ml-auto">
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
          </>
        )}

        {perspective === "recipient" && !isTerminal && (
          <div className="flex gap-2 w-full">
            {onClaim && (
              <Button
                variant="primary"
                size="sm"
                onClick={onClaim}
                loading={actionLoading}
                disabled={claimable === 0n}
                className="flex-1"
              >
                <Download className="h-3.5 w-3.5" />
                Claim All
              </Button>
            )}
            {onClaimPartial && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClaimPartial}
                disabled={claimable === 0n || actionLoading}
              >
                Partial
              </Button>
            )}
          </div>
        )}
      </div>
      {footer && <div className="mt-4 border-t border-border/60 pt-4">{footer}</div>}
    </Card>
  );
}
