"use client";

import { useState } from "react";
import { ConnectButton } from "@/components/wallet/connect-button";
import { MintDialog } from "@/components/wallet/mint-dialog";
import { usePathname } from "next/navigation";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWalletStore } from "@/stores/wallet-store";
import { useAppStore } from "@/stores/app-store";
import { formatTokenAmount } from "@/lib/utils";
import { Coins, Droplets, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/create": "Create Stream",
  "/dashboard/streams": "Manage Streams",
  "/dashboard/analytics": "Analytics",
  "/dashboard/register": "Register DAO",
  "/earn": "Earnings",
  "/earn/streams": "My Streams",
  "/earn/history": "Claim History",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "StackStream";
  const { isConnected } = useWalletStore();
  const { balance, isLoading } = useTokenBalance();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const [mintOpen, setMintOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface-0/80 backdrop-blur-md px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-surface-3 hover:text-zinc-200 transition-colors md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isConnected && !isLoading && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-400">
              <Coins className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">{formatTokenAmount(balance)}</span>
              <span className="text-zinc-600 text-xs">msBTC</span>
            </div>
          )}
          {isConnected && (
            <button
              onClick={() => setMintOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Droplets className="h-3.5 w-3.5" />
              Faucet
            </button>
          )}
          <ConnectButton />
        </div>
      </header>
      <MintDialog open={mintOpen} onClose={() => setMintOpen(false)} />
    </>
  );
}
