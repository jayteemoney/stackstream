"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-zinc-100",
            "placeholder:text-zinc-600",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50",
            error ? "border-red-500/50" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
