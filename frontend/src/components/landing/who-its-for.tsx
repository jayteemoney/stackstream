"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  Store,
  Laptop,
  Target,
  Wallet,
  UserRound,
  Check,
} from "lucide-react";

const segments = [
  {
    icon: Landmark,
    title: "DAOs & protocol teams",
    headline: "Payday that runs itself",
    points: [
      "One stream per contributor — set the rate and you're done",
      "They watch pay grow live and cash out whenever they like",
      "Pause, top up, or stop in a click; unearned funds return to treasury",
      "Register your DAO so every payment is on the record for members",
    ],
  },
  {
    icon: Store,
    title: "Merchants & SaaS",
    headline: "Subscriptions that feel fair",
    points: [
      "Money flows in second by second for as long as they stay",
      "No upfront charge — if they cancel, it stops on the spot",
      "No chargebacks and no disputes",
      "Pay your own suppliers the very same way",
    ],
  },
  {
    icon: Laptop,
    title: "Freelancers & builders",
    headline: "Watch your pay grow as you work",
    points: [
      "Share your address, agree an amount and a length — done",
      "Balance ticks up live while you build; pull it anytime",
      "No invoice, no chasing, no 30-day wait",
      "Get paid in sBTC, STX, or any token you choose",
    ],
  },
  {
    icon: Target,
    title: "Grant & bounty programs",
    headline: "Fund builders, keep control",
    points: [
      "Stream a grant across the whole project, not one lump sum",
      "Builders earn steadily as they ship",
      "Unearned funds stay in your wallet to pause or pull back",
      "No escrow agent, no awkward refunds — we fund our work this way",
    ],
  },
];

const steps = [
  {
    number: "1",
    title: "Create",
    headline: "Set it up once",
    points: [
      "Choose who you are paying",
      "Pick any token — sBTC, STX, or your own",
      "Set the amount and how long it runs",
    ],
  },
  {
    number: "2",
    title: "Stream",
    headline: "It runs itself",
    points: [
      "Funds flow every few seconds, on Bitcoin",
      "No payroll runs, no reminders to set",
      "Pause, top up, or stop anytime",
    ],
  },
  {
    number: "3",
    title: "Claim",
    headline: "Cash out anytime",
    points: [
      "Watch the balance grow live",
      "Pull it to your wallet — all or part",
      "Cancel early and the rest comes back",
    ],
  },
];

const particles = [0, 1, 2, 3, 4, 5];

function StreamVisual({ phase }: { phase: number }) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const RATE = 0.00042; // sBTC accrued per second, tuned for a calm tick
    const loop = (t: number) => {
      if (start === null) start = t;
      setBalance(((t - start) / 1000) * RATE);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-surface-1 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Sender */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-all duration-500 ${
              phase === 0 ? "ring-2 ring-brand-500/50" : "ring-0"
            }`}
          >
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Sender
          </span>
        </div>

        {/* Rail with flowing funds */}
        <div className="relative h-px flex-1 bg-border">
          {particles.map((p) => (
            <motion.span
              key={p}
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(247,147,26,0.6)]"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "linear",
                delay: p * 0.4,
              }}
            />
          ))}
        </div>

        {/* Recipient */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-all duration-500 ${
              phase === 2 ? "ring-2 ring-brand-500/50" : "ring-0"
            }`}
          >
            <UserRound className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Recipient
          </span>
        </div>
      </div>

      {/* Live balance landing at the recipient */}
      <div className="mt-6 text-center">
        <div className="font-mono text-2xl font-bold tabular-nums text-brand-400 sm:text-3xl">
          +{balance.toFixed(6)}{" "}
          <span className="text-sm font-normal text-zinc-500">sBTC</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          streaming live every block, secured by Bitcoin finality
        </div>
      </div>
    </div>
  );
}

export function WhoItsFor() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 2400);
    return () => clearInterval(id);
  }, []);

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
              <ul className="mt-3 space-y-2">
                {segment.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm leading-relaxed text-zinc-400"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* How to StackStream */}
        <div className="mt-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
              How to StackStream
            </h2>
            <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
              Three steps, and the first is the only one that takes any effort.
              Watch a payment flow from sender to recipient in real time.
            </p>
          </div>

          <StreamVisual phase={phase} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-2xl border p-6 transition-all duration-500 ${
                  phase === i
                    ? "border-brand-500/40 bg-surface-2"
                    : "border-border bg-surface-1"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-bold transition-colors duration-500 ${
                      phase === i
                        ? "bg-brand-500 text-white"
                        : "bg-brand-500/10 text-brand-400"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {step.title}
                  </span>
                </div>
                <h4 className="mt-4 text-base font-semibold text-zinc-100">
                  {step.headline}
                </h4>
                <ul className="mt-3 space-y-2">
                  {step.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm leading-relaxed text-zinc-400"
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
      </div>
    </section>
  );
}
