"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AssistantWidget } from "@/components/openclaw/assistant-widget";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-0">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
      <AssistantWidget />
    </div>
  );
}
