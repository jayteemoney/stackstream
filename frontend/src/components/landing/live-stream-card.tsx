"use client";

import { useEffect, useRef, useState } from "react";

// A believable example: a 0.1 sBTC monthly salary streamed over 30 days,
// shown a little over halfway through. sBTC has 8 decimals, so we render 8.
const DEPOSIT = 0.1;
const DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days
const RATE_PER_SECOND = DEPOSIT / DURATION_SECONDS; // ~0.0000000386 sBTC/sec
const BASE_EARNED = 0.05734829; // ~57% streamed

const TOKENS = ["sBTC", "STX", "USDA", "ALEX"];

export function LiveStreamCard() {
  // Start from the same value on server and first client paint to avoid a
  // hydration mismatch, then let it accrue once mounted.
  const [earned, setEarned] = useState(BASE_EARNED);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      // Sample about eight times a second. Enough to see the last digits roll
      // without re-rendering on every frame.
      if (now - last >= 120) {
        last = now;
        const elapsed = (now - startRef.current) / 1000;
        setEarned(Math.min(BASE_EARNED + RATE_PER_SECOND * elapsed, DEPOSIT));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const progress = Math.min((earned / DEPOSIT) * 100, 100);
  const [whole, decimals] = earned.toFixed(8).split(".");
  const steady = decimals.slice(0, 4);
  const live = decimals.slice(4); // the part that visibly accrues

  return (
    <div className="rounded-2xl border border-border bg-surface-1/80 backdrop-blur-md p-4 sm:p-8 glow-orange text-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-sm font-medium text-emerald-400">Live stream</span>
        <span className="ml-auto hidden sm:inline font-mono text-xs text-zinc-500">
          sender.btc &rarr; recipient.btc
        </span>
      </div>

      {/* Earned so far */}
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Earned so far
      </p>
      <div className="font-mono text-2xl font-bold tabular-nums sm:text-3xl md:text-4xl lg:text-5xl">
        <span className="text-zinc-100">{whole}.</span>
        <span className="text-zinc-300">{steady}</span>
        <span className="text-brand-400">{live}</span>
        <span className="ml-2 text-base text-zinc-500 sm:text-lg">sBTC</span>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-linear-to-r from-brand-500 to-brand-400 transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>A 0.1 sBTC salary, streaming over 30 days</span>
          <span>{progress.toFixed(1)}% in</span>
        </div>
      </div>

      {/* Friendly caption */}
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        This is real money landing every second. No invoice, no waiting for
        payday, and they can cash out the moment they want.
      </p>

      {/* Any token */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-4">
        <span className="mr-1 text-xs text-zinc-500">Stream any token:</span>
        {TOKENS.map((t) => (
          <span
            key={t}
            className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
          >
            {t}
          </span>
        ))}
        <span className="text-[11px] text-zinc-500">and more</span>
      </div>
    </div>
  );
}
