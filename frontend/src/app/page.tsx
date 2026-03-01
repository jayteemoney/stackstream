"use client";

import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CTASection } from "@/components/landing/cta-section";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Landing nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-0/80 backdrop-blur-md border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-brand-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Stack<span className="text-brand-400">Stream</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="hidden md:inline text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Dashboard
          </Link>
          <Link href="/earn" className="hidden md:inline text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Earn
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <Hero />
      <Features />
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>StackStream &mdash; Bitcoin-native payroll streaming on Stacks</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/jayteemoney/stackstream"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://docs.stacks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              Stacks Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
