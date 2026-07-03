"use client";

import { Hero } from "@/components/landing/hero";
import { WhoItsFor } from "@/components/landing/who-its-for";
import { Features } from "@/components/landing/features";
import { AssistantSection } from "@/components/landing/assistant-section";
import { FAQ } from "@/components/landing/faq";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Landing nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-0/80 backdrop-blur-md border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-full.png"
            alt="StackStream"
            width={62}
            height={48}
            className="h-12 w-auto"
            priority
          />
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
      <WhoItsFor />
      <Features />
      <AssistantSection />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
