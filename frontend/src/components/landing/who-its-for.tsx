"use client";

import { motion } from "framer-motion";
import { Landmark, Store, Laptop, Target } from "lucide-react";

const segments = [
  {
    icon: Landmark,
    title: "DAOs & protocol teams",
    headline: "Retire multi-sig payday",
    description:
      "Stop coordinating batch transfers every cycle. Open one stream per contributor and they claim as they earn. Pause or cancel anytime. Register your DAO on-chain for payroll anyone can audit.",
  },
  {
    icon: Store,
    title: "Merchants & SaaS",
    headline: "Subscriptions that settle per second",
    description:
      "Swap net-30 invoices and chargebacks for money that lands as the service is delivered. Stream to your vendors, or let customers stream to you.",
  },
  {
    icon: Laptop,
    title: "Freelancers & builders",
    headline: "Get paid as you work",
    description:
      "No more waiting 30 days on an invoice. Share your address, watch earnings tick up live, and claim to your wallet any moment in real Bitcoin via sBTC.",
  },
  {
    icon: Target,
    title: "Grant & bounty programs",
    headline: "Disburse with built-in clawback",
    description:
      "Stream funding in tranches instead of one lump sum. Anything not yet earned stays yours to reclaim, so milestone payouts need no escrow agent. We run on this ourselves.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create",
    description: "Pick a recipient, an amount, and a duration.",
  },
  {
    number: "2",
    title: "Stream",
    description: "Funds flow every block on their own, with nothing left to do.",
  },
  {
    number: "3",
    title: "Claim",
    description: "Recipients pull earnings anytime. Senders reclaim the rest.",
  },
];

export function WhoItsFor() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
            One protocol. Every kind of payment.
          </h2>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
            However your team, DAO, or business moves money, StackStream makes it
            flow in real time and makes it final.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          {segments.map((segment, i) => (
            <motion.div
              key={segment.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-surface-1 p-6 transition-all duration-300 hover:border-brand-500/20 hover:bg-surface-2"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                  <segment.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {segment.title}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {segment.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {segment.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* How to StackStream */}
        <div className="mt-16">
          <h3 className="text-center text-sm font-medium uppercase tracking-wide text-zinc-500 mb-8">
            How to StackStream
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-surface-1 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 font-mono text-sm font-bold text-brand-400">
                  {step.number}
                </div>
                <h4 className="text-base font-semibold text-zinc-200">
                  {step.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
