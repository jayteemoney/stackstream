"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle, Send, Github } from "lucide-react";
import { FEEDBACK_URL } from "@/lib/constants";

const faqs = [
  {
    q: "What is StackStream?",
    a: "A Bitcoin-native payment streaming protocol. Instead of paying people in one lump sum on a payday, you open a stream and funds flow to them every few seconds. It runs on Stacks and settles on Bitcoin, so payments are final and can't be reversed.",
  },
  {
    q: "Is it live? Can I use it now?",
    a: "Yes. StackStream is live on Stacks mainnet at stackstream.xyz. Connect a Stacks wallet, create a stream, and it starts flowing immediately. You can watch a real balance tick up in the app right now.",
  },
  {
    q: "Which tokens can I stream?",
    a: "sBTC, STX, USDA, ALEX, xBTC, or any SIP-010 token. If it follows the SIP-010 standard on Stacks, you can stream it by the second.",
  },
  {
    q: "Is my money safe while it's streaming?",
    a: "Funds sit in on-chain escrow, not in anyone's pocket. The recipient can only ever claim what they've already earned, and everything not yet earned stays yours. Pause, top up, or cancel at any time and the unearned remainder comes straight back to your wallet.",
  },
  {
    q: "What is OpenClaw?",
    a: "OpenClaw is the assistant built into the app. Ask it about any stream, sender, recipient, or workspace and it pulls the live on-chain answer instantly — no block explorer or raw contract calls needed.",
  },
  {
    q: "Who is StackStream for?",
    a: "DAOs and protocol teams paying contributors, businesses running subscriptions or paying suppliers, freelancers who want to get paid as they work, and grant or bounty programs funding builders steadily instead of in one lump sum.",
  },
  {
    q: "How is this different from a normal crypto payment?",
    a: "A normal payment is one transfer at one moment. A stream is continuous — money moves second by second for as long as you set it to run, and either side can adjust or stop it mid-flow. Think of it as a tap you turn on, not a calendar reminder.",
  },
  {
    q: "Is the code open and audited?",
    a: "The Clarity smart contracts are open source on GitHub and covered by a full test suite that verifies funds are always conserved. You can read every contract and run the tests yourself.",
  },
];

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-1 transition-colors hover:border-brand-500/20">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-zinc-100 sm:text-base">
          {faq.q}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-zinc-400 transition-all duration-300 ${
            isOpen ? "rotate-45 border-brand-500/40 bg-brand-500/10 text-brand-400" : ""
          }`}
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400 sm:px-6 sm:pb-6">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-zinc-100 md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-500">
            Everything you need to know about streaming money on Bitcoin. Still
            curious? Reach out below — we answer fast.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* Feedback / contact strip */}
        <div className="mt-10 rounded-2xl border border-brand-500/20 bg-linear-to-b from-brand-500/5 to-transparent p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">
            Still have a question?
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Send us feedback or a question directly, or reach the team on
            Telegram. Every message gets read.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <MessageCircle className="h-4 w-4" />
              Send feedback
            </a>
            <a
              href="https://t.me/dev_jaytee"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-500/30 hover:text-zinc-100"
            >
              <Send className="h-4 w-4" />
              Telegram
            </a>
            <a
              href="https://github.com/jayteemoney/stackstream"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-500/30 hover:text-zinc-100"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
