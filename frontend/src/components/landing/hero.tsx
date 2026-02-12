"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-medium text-brand-400">
            <Zap className="h-3 w-3" />
            First Payment Streaming Protocol on Stacks
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
        >
          <span className="text-zinc-100">Stream payments.</span>
          <br />
          <span className="gradient-text">Block by block.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-lg text-zinc-400 leading-relaxed"
        >
          StackStream lets DAOs pay contributors in real-time. Funds flow
          continuously on-chain, and workers can claim earnings at any moment.
          Bitcoin-native. Built on Stacks.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <Button size="lg">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/earn">
            <Button size="lg" variant="outline">
              View Earnings
            </Button>
          </Link>
        </motion.div>

        {/* Animated streaming preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="rounded-2xl border border-border bg-surface-1/80 backdrop-blur-md p-8 glow-orange">
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm text-emerald-400 font-medium">Live Stream</span>
              <span className="ml-auto text-xs text-zinc-600">StacksDAO &rarr; contributor.btc</span>
            </div>
            <div className="font-mono text-4xl md:text-5xl font-bold tabular-nums">
              <span className="text-zinc-100">1,234</span>
              <span className="text-zinc-100">.</span>
              <span className="text-zinc-300">567891</span>
              <motion.span
                className="text-brand-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                234567
              </motion.span>
              <span className="text-zinc-500 text-lg ml-2">sBTC</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
              <span>Rate: 0.0001 sBTC/block</span>
              <span className="text-zinc-700">|</span>
              <span>78.4% streamed</span>
              <div className="ml-auto flex-1 max-w-32">
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                    initial={{ width: "70%" }}
                    animate={{ width: "80%" }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
