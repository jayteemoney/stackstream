"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0–100
  className?: string;
  variant?: "brand" | "green" | "amber";
  showLabel?: boolean;
  size?: "sm" | "md";
}

const barColors = {
  brand: "from-brand-500 to-brand-400",
  green: "from-emerald-500 to-emerald-400",
  amber: "from-amber-500 to-amber-400",
};

export function Progress({
  value,
  className,
  variant = "brand",
  showLabel = false,
  size = "md",
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  // CSS transition (not framer-motion) so callers can pump a new `value`
  // every animation frame from useStreamProgress without the bar lagging
  // behind a 0.8s tween. A short ease softens the per-frame steps while
  // still feeling real-time.
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
          <span>Progress</span>
          <span>{clamped.toFixed(2)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-surface-3 overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-100 ease-out",
            barColors[variant]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
