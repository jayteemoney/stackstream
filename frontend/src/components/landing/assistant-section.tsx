"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Hash,
  User,
  Building2,
  Search,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

const capabilities = [
  {
    icon: Hash,
    title: "Look up any stream",
    points: [
      "Drop in a stream ID for status, deposit, and rate",
      "See exactly what's claimable right now",
    ],
  },
  {
    icon: User,
    title: "Search by address",
    points: [
      "Paste any sender or recipient address",
      "Pull every stream flowing in or out of it",
    ],
  },
  {
    icon: Building2,
    title: "Inspect a workspace",
    points: [
      "Check any registered DAO or business",
      "Streams created, total deposited, active status",
    ],
  },
  {
    icon: Zap,
    title: "Read the chain live",
    points: [
      "Ask for the current block height",
      "Read on-chain state without leaving the app",
    ],
  },
];

// Preview of the OpenClaw panel — mirrors the real in-app widget so visitors
// see exactly what they get once they launch the app.
function AssistantPreview() {
  const tabs = [
    { icon: Hash, label: "Stream", active: true },
    { icon: User, label: "Sender", active: false },
    { icon: User, label: "Recipient", active: false },
    { icon: Building2, label: "Workspace", active: false },
    { icon: Zap, label: "Block", active: false },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-surface-0 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10">
          <Zap className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">OpenClaw Assistant</p>
          <p className="text-[10px] text-zinc-500">
            Query streams, workspaces, and blockchain state
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
        {tabs.map((t) => (
          <span
            key={t.label}
            className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium ${
              t.active
                ? "bg-brand-500/10 text-brand-400"
                : "text-zinc-500"
            }`}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </span>
        ))}
      </div>

      {/* Result */}
      <div className="space-y-3 p-3">
        <div className="rounded-xl border border-border bg-surface-0 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
              stream
            </span>
            <span className="font-mono text-[10px] text-zinc-600">7</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-200">Stream #7</span>
              <span className="font-medium text-emerald-400">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
              <div>Sender</div>
              <div className="truncate font-mono text-zinc-300">SP2J6ZY...</div>
              <div>Recipient</div>
              <div className="truncate font-mono text-zinc-300">SP3FBR2...</div>
              <div>Deposited</div>
              <div className="font-mono text-zinc-300">0.500000 sBTC</div>
              <div>Claimable</div>
              <div className="font-mono text-emerald-400">0.184210 sBTC</div>
              <div>Progress</div>
              <div className="font-mono text-zinc-300">36.8%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-border px-3 py-2.5">
        <div className="flex flex-1 items-center rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-zinc-500">
          Stream ID (e.g. 7)
        </div>
        <div className="flex h-8 w-9 items-center justify-center rounded-lg bg-brand-500">
          <Search className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function AssistantSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-3 py-1 text-xs font-medium text-brand-400">
              <Sparkles className="h-3.5 w-3.5" />
              Built in: OpenClaw Assistant
            </div>
            <h2 className="text-3xl font-bold text-zinc-100 md:text-4xl">
              An assistant that reads the chain for you
            </h2>
            <p className="mt-3 max-w-lg text-zinc-500">
              OpenClaw lives inside the app. Ask it about any stream, address, or
              workspace and it answers in a click — no block explorer, no raw
              contract calls, no guesswork.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-border bg-surface-1 p-4 transition-colors hover:border-brand-500/20 hover:bg-surface-2"
                >
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                    <cap.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {cap.title}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {cap.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-1.5 text-xs leading-relaxed text-zinc-500"
                      >
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg">
                  Try OpenClaw in the app
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-full bg-brand-500/10 blur-3xl" />
              <div className="relative">
                <AssistantPreview />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
