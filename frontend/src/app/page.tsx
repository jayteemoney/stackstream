"use client";

import { Hero } from "@/components/landing/hero";
import { WhoItsFor } from "@/components/landing/who-its-for";
import { Features } from "@/components/landing/features";
import { AssistantSection } from "@/components/landing/assistant-section";
import { FAQ } from "@/components/landing/faq";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { SiteNav } from "@/components/landing/site-nav";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <SiteNav />

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
