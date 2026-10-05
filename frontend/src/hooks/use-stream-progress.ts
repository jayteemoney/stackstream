"use client";

import { useEffect, useState } from "react";
import { BLOCK_TIME_SECONDS } from "@/lib/constants";

/**
 * Interpolated stream progress (0–100) that ticks smoothly between
 * block-height snapshots, so the bar advances in sync with the
 * RealtimeBalance counter. Block height polling fires every
 * BLOCK_POLL_INTERVAL (30s) — without interpolation the bar visibly
 * jumps once per poll and feels frozen the rest of the time.
 *
 * When isAccruing is false the value is pinned to the latest snapshot.
 */
export function useStreamProgress(
  startBlock: number,
  endBlock: number,
  currentBlock: number,
  totalPausedDuration: number,
  isAccruing: boolean
): number {
  const duration = Math.max(1, endBlock - startBlock);

  const snapshotElapsed = Math.max(
    0,
    currentBlock - startBlock - totalPausedDuration
  );
  const snapshotProgress = Math.min(
    100,
    Math.max(0, (snapshotElapsed / duration) * 100)
  );

  // The latest animation frame, tagged with the snapshot it extrapolates from
  // so a frame computed from an old snapshot is never shown over a new one.
  const [frame, setFrame] = useState<{ base: number; value: number } | null>(null);

  useEffect(() => {
    if (!isAccruing) return;

    const progressPerSecond = 100 / (duration * BLOCK_TIME_SECONDS);
    const base = snapshotProgress;
    const startedAt = Date.now();
    let raf = 0;

    function tick() {
      const elapsed = (Date.now() - startedAt) / 1000;
      setFrame({ base, value: Math.min(100, base + progressPerSecond * elapsed) });
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isAccruing, duration, snapshotProgress]);

  // Not accruing, or no frame yet for this snapshot: the snapshot is the truth.
  return isAccruing && frame?.base === snapshotProgress ? frame.value : snapshotProgress;
}