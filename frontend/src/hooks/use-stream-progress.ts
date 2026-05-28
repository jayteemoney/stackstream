"use client";

import { useEffect, useRef, useState } from "react";
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

  const [value, setValue] = useState(snapshotProgress);
  const baseRef = useRef(snapshotProgress);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    baseRef.current = snapshotProgress;
    startTimeRef.current = Date.now();
    setValue(snapshotProgress);
  }, [snapshotProgress]);

  useEffect(() => {
    if (!isAccruing) {
      setValue(snapshotProgress);
      return;
    }

    const progressPerSecond = 100 / (duration * BLOCK_TIME_SECONDS);
    let raf: number | null = null;

    function tick() {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const interpolated = Math.min(
        100,
        baseRef.current + progressPerSecond * elapsed
      );
      setValue(interpolated);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [isAccruing, duration, snapshotProgress]);

  return value;
}
