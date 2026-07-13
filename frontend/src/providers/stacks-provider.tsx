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
 * Connect is deliberately stateless-first: we clear any cached approval and
 * force the wallet chooser on every connect, so switching accounts in the
 * wallet (e.g. sender -> recipient) always takes effect. Cached data made
 * reconnects silently return the previous account.
 *
 * Ref: https://www.npmjs.com/package/@stacks/connect
 */

import { type ReactNode, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/wallet-store";

/** Stacks addresses start with S + P/M (mainnet) or T/N (testnet). */
const STX_ADDRESS_RE = /^S[PMTN]/;

export function StacksProvider({ children }: { children: ReactNode }) {
  const { setAddress, disconnect } = useWalletStore();

  // Rehydrate connection on mount from @stacks/connect localStorage
  useEffect(() => {
    (async () => {
      try {
        // Purge pre-v8 leftovers. Returning visitors carry the legacy
        // UserSession blob, and our persisted store may claim "connected"
        // from that era — without a matching v8 session the UI would lie
        // and wallet actions would misbehave.
        try {
          localStorage.removeItem("blockstack-session");
          localStorage.removeItem("blockstack-gaia-hub-config");
        } catch {
          /* storage unavailable — nothing to clean */
        }

        const { isConnected, getLocalStorage } = await import("@stacks/connect");
        if (isConnected()) {
          const stx = getLocalStorage()?.addresses.stx.find((a) =>
            STX_ADDRESS_RE.test(a.address)
          );
          if (stx) {
            setAddress(stx.address);
            return;
          }
        }
        // No live v8 session: make the UI agree (clears any stale
        // persisted "connected" state from before the migration).
        disconnect();
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
      const {
        connect,
        disconnect: walletDisconnect,
        JsonRpcError,
      } = await import("@stacks/connect");

      // Drop any cached approval/addresses so the wallet is always asked
      // fresh — otherwise a reconnect can silently return the previously
      // approved account even after the user switched accounts in the wallet.
      walletDisconnect();

      const res = await connect({ forceWalletSelect: true }).catch(
        (err: unknown) => {
          // User closed the chooser or rejected in the wallet — not an error
          if (
            err instanceof JsonRpcError &&
            (err.code === -32000 || err.code === -31001)
          ) {
            return null;
          }
          throw err;
        }
      );

      if (!res) {
        setConnecting(false);
        return;
      }

      // Use the wallet's fresh response (authoritative for the currently
      // selected account), never merged localStorage.
      const stx = res.addresses.find((a) => STX_ADDRESS_RE.test(a.address));
      if (!stx) {
        toast.error(
          "The wallet returned no Stacks address. Switch to a Stacks account in your wallet and try again."
        );
        setConnecting(false);
        return;
      }

      setAddress(stx.address);
      toast.success(
        `Connected ${stx.address.slice(0, 6)}…${stx.address.slice(-4)}`
      );
    } catch (err) {
      console.error("[wallet connect]", err);
      toast.error(
        "Couldn't reach the wallet. Unlock the extension, then try again."
      );
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
