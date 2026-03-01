import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  className?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, sub, icon, className, trend }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface-1 p-3 sm:p-4 lg:p-5",
        "transition-all duration-300 hover:border-brand-500/20",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
        {icon && <div className="text-zinc-600">{icon}</div>}
      </div>
      <p className="mt-2 text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sub && (
        <p
          className={cn(
            "mt-1 text-xs",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-red-400",
            (!trend || trend === "neutral") && "text-zinc-500"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
