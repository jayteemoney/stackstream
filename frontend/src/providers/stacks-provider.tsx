"use client";

/**
 * Stacks wallet provider using @stacks/connect.
 *
 * For v7+ the library exposes `showConnect` and `openContractCall` directly
 * rather than a React context provider. This wrapper provides auth helpers
 * that integrate with our Zustand wallet store.
 *
 * Ref: https://docs.stacks.co/stacks.js/connect
 */

import { type ReactNode, useEffect, useCallback } from "react";
import { AppConfig, UserSession } from "@stacks/connect";
import { useWalletStore } from "@/stores/wallet-store";
import { IS_MAINNET } from "@/lib/constants";

const appConfig = new AppConfig(["store_write"]);
export const userSession = new UserSession({ appConfig });

export function StacksProvider({ children }: { children: ReactNode }) {
  const { setAddress, disconnect } = useWalletStore();

  // Rehydrate session on mount
  useEffect(() => {
    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const address = IS_MAINNET
          ? userData.profile.stxAddress.mainnet
          : userData.profile.stxAddress.testnet;
        setAddress(address);
      }
    } catch {
      // Stale or incompatible session data in localStorage — clear it and start fresh
      userSession.signUserOut();
      disconnect();
    }
  }, [setAddress, disconnect]);

  return <>{children}</>;
}

/** Hook to get wallet actions */
export function useStacksAuth() {
  const { setAddress, disconnect, setConnecting } = useWalletStore();

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const { showConnect } = await import("@stacks/connect");
      showConnect({
        appDetails: {
          name: "StackStream",
          icon: typeof window !== "undefined" ? `${window.location.origin}/logo.svg` : "/logo.svg",
        },
        userSession,
        onFinish: () => {
          const userData = userSession.loadUserData();
          const address = IS_MAINNET
            ? userData.profile.stxAddress.mainnet
            : userData.profile.stxAddress.testnet;
          setAddress(address);
        },
        onCancel: () => {
          setConnecting(false);
        },
      });
    } catch {
      setConnecting(false);
    }
  }, [setAddress, setConnecting]);

  const handleDisconnect = useCallback(() => {
    userSession.signUserOut();
    disconnect();
  }, [disconnect]);

  return { connect: handleConnect, disconnect: handleDisconnect, userSession };
}
