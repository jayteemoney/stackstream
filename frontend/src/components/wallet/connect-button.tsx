"use client";

import { useWalletStore } from "@/stores/wallet-store";
import { useStacksAuth } from "@/providers/stacks-provider";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ConnectButton() {
  const { address, isConnected, isConnecting } = useWalletStore();
  const { connect, disconnect } = useStacksAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (!isConnected || !address) {
    return (
      <Button onClick={connect} loading={isConnecting} size="md" variant="primary">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-surface-3"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-mono text-xs">{truncateAddress(address, 5)}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 rounded-xl border border-border bg-surface-2 p-1.5 shadow-2xl z-50">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs text-zinc-500">Connected</p>
            <p className="text-xs font-mono text-zinc-300 mt-0.5 break-all">{address}</p>
          </div>
          <button
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
