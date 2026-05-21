"use client";

/**
 * Signature component: real-time animated balance counter.
 *
 * Interpolates between on-chain balance snapshots using per-second linear
 * interpolation based on the stream's rate-per-block and the Nakamoto Stacks
 * block time (~5s).
 *
 * Inspired by Sablier's streaming visualization.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PRECISION } from "@/lib/utils";
import { BLOCK_TIME_SECONDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RealtimeBalanceProps {
  /** Current on-chain claimable balance in the token's raw smallest units */
  baseBalance: bigint;
  /** Rate per block from contract (with PRECISION multiplier) */
  ratePerBlock: bigint;
  /** Total deposit — display is capped at this value */
  depositAmount?: bigint;
  /** Is the stream actively accruing? */
  isActive: boolean;
  /** Decimals for the token being streamed (8 for sBTC, 6 for USDA, etc.) */
  decimals: number;
  /** Optional symbol shown next to the "Streaming live" tag */
  symbol?: string;
  /** Size variant */
  size?: "sm" | "lg";
  className?: string;
}

export function RealtimeBalance({
  baseBalance,
  ratePerBlock,
  depositAmount,
  isActive,
  decimals,
  symbol,
  size = "lg",
  className,
}: RealtimeBalanceProps) {
  const [displayValue, setDisplayValue] = useState(Number(baseBalance));
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const baseRef = useRef(Number(baseBalance));

  // Rate per second: (ratePerBlock / PRECISION) / BLOCK_TIME_SECONDS
  const ratePerSecond =
    Number(ratePerBlock) / Number(PRECISION) / BLOCK_TIME_SECONDS;

  // When base changes (new on-chain data), reset the interpolation origin
  useEffect(() => {
    baseRef.current = Number(baseBalance);
    startTimeRef.current = Date.now();
  }, [baseBalance]);

  // Animation loop
  useEffect(() => {
    if (!isActive || ratePerSecond <= 0) {
      setDisplayValue(Number(baseBalance));
      return;
    }

    const cap = depositAmount !== undefined ? Number(depositAmount) : Infinity;

    function tick() {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const interpolated = Math.min(baseRef.current + ratePerSecond * elapsed, cap);
      setDisplayValue(interpolated);
      animationRef.current = requestAnimationFrame(tick);
    }

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, ratePerSecond, baseBalance]);

  const humanValue = displayValue / Math.pow(10, decimals);
  // Pad fractional precision past the token's native decimals so the rapid-
  // animation tail still has digits to flicker for tokens with fewer decimals.
  const displayDigits = Math.max(decimals + 4, 12);
  const formatted = humanValue.toFixed(displayDigits);
  const [intPart, decPart] = formatted.split(".");
  const stableDigits = Math.max(decimals - 2, 4);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "font-mono tabular-nums tracking-tight",
          size === "lg" ? "text-2xl sm:text-4xl md:text-5xl font-bold" : "text-xl font-semibold"
        )}
      >
        <span className="text-zinc-100">{Number(intPart).toLocaleString()}</span>
        <span className="text-zinc-100">.</span>
        {/* First `stableDigits` are easy to read; the tail flickers as it ticks */}
        <span className="text-zinc-300">{decPart?.slice(0, stableDigits)}</span>
        <motion.span
          className="text-brand-400"
          animate={isActive ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.3 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {decPart?.slice(stableDigits, displayDigits)}
        </motion.span>
        {symbol && (
          <span className="text-sm text-zinc-500 ml-2 font-medium">{symbol}</span>
        )}
      </div>

      {/* Accruing indicator */}
      {isActive && (
        <div className="mt-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs text-emerald-400 font-medium">Streaming live</span>
        </div>
      )}
    </div>
  );
}
