"use client";

/**
 * Stacks wallet provider using @stacks/connect v8.
 *
 * v8 replaces the legacy UserSession/showConnect flow with `connect()` +
 * localStorage-backed address storage, and talks to wallets over the modern
 * `LeatherProvider`/WBIP JSON-RPC bridge. Leather deprecated the old
 * `StacksProvider` object, which left the previous `showConnect`/
 * `openContractCall` calls hanging with no popup.
 *
 * Ref: https://www.npmjs.com/package/@stacks/connect
 */

import { type ReactNode, useEffect, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet-store";

export function StacksProvider({ children }: { children: ReactNode }) {
  const { setAddress, disconnect } = useWalletStore();

  // Rehydrate connection on mount from @stacks/connect localStorage
  useEffect(() => {
    (async () => {
      try {
        const { isConnected, getLocalStorage } = await import("@stacks/connect");
        if (isConnected()) {
          const address = getLocalStorage()?.addresses.stx[0]?.address;
          if (address) setAddress(address);
        }
      } catch {
        // Stale or incompatible connect data — start fresh
        disconnect();
      }
    })();
  }, [setAddress, disconnect]);

  return <>{children}</>;
}

/** Hook to get wallet actions */
export function useStacksAuth() {
  const { setAddress, disconnect, setConnecting } = useWalletStore();

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const { connect, getLocalStorage } = await import("@stacks/connect");
      await connect(); // opens the wallet chooser + approval popup
      const address = getLocalStorage()?.addresses.stx[0]?.address;
      if (address) {
        setAddress(address);
      } else {
        setConnecting(false);
      }
    } catch {
      // User closed the popup or wallet rejected — back to idle
      setConnecting(false);
    }
  }, [setAddress, setConnecting]);

  const handleDisconnect = useCallback(() => {
    import("@stacks/connect").then(({ disconnect: walletDisconnect }) => {
      walletDisconnect();
    });
    disconnect();
  }, [disconnect]);

  return { connect: handleConnect, disconnect: handleDisconnect };
}
