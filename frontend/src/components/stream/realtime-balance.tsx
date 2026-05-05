"use client";

/**
 * Signature component: real-time animated balance counter.
 *
 * Interpolates between on-chain balance snapshots using per-second
 * linear interpolation based on the stream's rate-per-block and
 * the average Stacks block time (~10 min / 600s).
 *
 * Inspired by Sablier's streaming visualization.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SBTC_DECIMALS, PRECISION } from "@/lib/utils";
import { BLOCK_TIME_SECONDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RealtimeBalanceProps {
  /** Current on-chain claimable balance (raw, 8 decimals) */
  baseBalance: bigint;
  /** Rate per block from contract (with PRECISION multiplier) */
  ratePerBlock: bigint;
  /** Total deposit — display is capped at this value */
  depositAmount?: bigint;
  /** Is the stream actively accruing? */
  isActive: boolean;
  /** Size variant */
  size?: "sm" | "lg";
  className?: string;
}

export function RealtimeBalance({
  baseBalance,
  ratePerBlock,
  depositAmount,
  isActive,
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

  const humanValue = displayValue / Math.pow(10, SBTC_DECIMALS);
  const formatted = humanValue.toFixed(12);
  const [intPart, decPart] = formatted.split(".");

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
        {/* First 6 decimals are visible, remaining animate rapidly */}
        <span className="text-zinc-300">{decPart?.slice(0, 6)}</span>
        <motion.span
          className="text-brand-400"
          animate={isActive ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.3 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {decPart?.slice(6, 12)}
        </motion.span>
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
