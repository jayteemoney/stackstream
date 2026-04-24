"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Clock,
  BarChart3,
  Coins,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-Time Streaming",
    description:
      "Funds flow block-by-block on Stacks. Recipients watch earnings accumulate live and claim anytime.",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    description:
      "Tokens are held in smart contract escrow. No intermediaries. Fully transparent and auditable on-chain.",
  },
  {
    icon: Clock,
    title: "Flexible Control",
    description:
      "Pause, resume, cancel, or top-up streams as needed. Full lifecycle management for any workflow.",
  },
  {
    icon: BarChart3,
    title: "Full Visibility",
    description:
      "Track burn rate, active streams, and total value locked. Real-time analytics for your payment flows.",
  },
  {
    icon: Coins,
    title: "Multi-Token",
    description:
      "Stream sBTC, USDA, ALEX, xBTC, or any SIP-010 token on Stacks. One protocol, every asset.",
  },
  {
    icon: Users,
    title: "Built for Everyone",
    description:
      "Teams, organizations, DAOs, freelancers, and individuals. Register a workspace, create streams, and manage payments from one dashboard.",
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
            Everything you need to pay a team, a contractor, a grantee, or anyone —
            continuously, transparently, and on your terms.
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
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
