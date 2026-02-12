"use client";

import { ConnectButton } from "@/components/wallet/connect-button";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/create": "Create Stream",
  "/dashboard/streams": "Manage Streams",
  "/dashboard/analytics": "Analytics",
  "/earn": "Earnings",
  "/earn/streams": "My Streams",
  "/earn/history": "Claim History",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "StackStream";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface-0/80 backdrop-blur-md px-6">
      <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
      <ConnectButton />
    </header>
  );
}
