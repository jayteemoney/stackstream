"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center rounded-3xl border border-brand-500/20 bg-gradient-to-b from-brand-500/5 to-transparent p-6 sm:p-12"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-100">
          Ready to stream?
        </h2>
        <p className="mt-4 text-zinc-400 max-w-md mx-auto">
          Set up your first payment stream and start paying contributors
          in real-time on Stacks testnet.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard/create">
            <Button size="lg">
              Create a Stream
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/earn">
            <Button size="lg" variant="outline">
              Check Earnings
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
