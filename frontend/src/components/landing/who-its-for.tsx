"use client";

import { motion } from "framer-motion";
import { Landmark, Store, Laptop, Target } from "lucide-react";

const segments = [
  {
    icon: Landmark,
    title: "DAOs & protocol teams",
    headline: "Payday that runs itself",
    description:
      "Open one stream for each contributor, set the rate, and you are done. They watch their pay grow every second and cash out whenever they like. Need to change something? Pause, top up, or stop in a click, and anything not yet earned comes straight back to your treasury. Register your DAO once so every payment is on the record for members to see.",
  },
  {
    icon: Store,
    title: "Merchants & SaaS",
    headline: "Subscriptions that feel fair",
    description:
      "Stop charging upfront and hoping it sticks. Set up a stream with your customer and the money flows in second by second for as long as they stay. If they cancel, it stops on the spot, so no chargebacks and no disputes. Pay your own suppliers the very same way.",
  },
  {
    icon: Laptop,
    title: "Freelancers & builders",
    headline: "Watch your pay grow as you work",
    description:
      "Send your client your address, agree an amount and a length, and the stream handles the rest. Your balance ticks up live while you build, and you pull it to your wallet any moment you want. No invoice, no chasing, no 30 day wait. Get paid in sBTC, STX, or any token you choose.",
  },
  {
    icon: Target,
    title: "Grant & bounty programs",
    headline: "Fund builders, keep control",
    description:
      "Stream a grant across the whole project instead of handing over one lump sum. The builder earns steadily as they ship, and whatever is not yet earned stays in your wallet to pause or pull back if plans change. No escrow agent, no awkward refunds. We fund our own work exactly like this.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create",
    description: "Pick a recipient, any token, an amount, and a duration.",
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
            One app. Every way to get paid.
          </h2>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
            DAOs, businesses, freelancers, grant programs. Here is exactly how
            each one puts StackStream to work.
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
