import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "active" | "paused" | "cancelled" | "depleted" | "default";

const variants: Record<BadgeVariant, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  depleted: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  default: "bg-surface-3 text-zinc-400 border-border",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/** Map stream status number to badge variant */
export function streamStatusToBadge(status: number): BadgeVariant {
  switch (status) {
    case 0: return "active";
    case 1: return "paused";
    case 2: return "cancelled";
    case 3: return "depleted";
    default: return "default";
  }
}
