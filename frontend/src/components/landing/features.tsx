"use client";

import { motion } from "framer-motion";
import {
  Bitcoin,
  Zap,
  Shield,
  Clock,
  Coins,
  Network,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Bitcoin,
    title: "Settled on Bitcoin",
    points: [
      "Every stream is anchored to Bitcoin, final once settled",
      "Can't be reversed — Bitcoin-grade settlement no other chain streams with",
    ],
  },
  {
    icon: Zap,
    title: "Real-time, every few seconds",
    points: [
      "Funds flow every few seconds, not every payday",
      "Recipients watch earnings add up live and claim any moment",
    ],
  },
  {
    icon: Shield,
    title: "Your money stays yours",
    points: [
      "Tokens sit in audited on-chain escrow",
      "Recipients claim only what they've earned; you reclaim the rest instantly",
    ],
  },
  {
    icon: Clock,
    title: "Full lifecycle control",
    points: [
      "Pause, resume, top up, or cancel on demand",
      "Anything not yet earned always comes back to the sender",
    ],
  },
  {
    icon: Coins,
    title: "Stream any asset",
    points: [
      "sBTC, STX, USDA, ALEX, or any SIP-010 token",
      "Stream real Bitcoin, by the second",
    ],
  },
  {
    icon: Network,
    title: "Cross-chain and private, on the roadmap",
    points: [
      "Coming next: pay out across other chains through sBTC bridges",
      "Shielded streams for private payroll — the moat we're building toward",
    ],
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Payments that never stop
          </h2>
          <p className="mt-3 text-zinc-500 max-w-lg mx-auto">
            Everything you need to pay a team, a contractor, a grantee, or a
            vendor. Continuously, transparently, and final like Bitcoin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-surface-1 p-6 transition-all duration-300 hover:border-brand-500/20 hover:bg-surface-2"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">{feature.title}</h3>
              <ul className="mt-3 space-y-2">
                {feature.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm leading-relaxed text-zinc-500"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
