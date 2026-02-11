/**
 * Wallet connection state management using Zustand.
 *
 * Integrates with @stacks/connect for Leather/Xverse wallet support.
 * Ref: https://docs.stacks.co/stacks.js/connect
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;

  setAddress: (address: string) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      isConnecting: false,

      setAddress: (address: string) =>
        set({ address, isConnected: true, isConnecting: false }),

      disconnect: () =>
        set({ address: null, isConnected: false, isConnecting: false }),

      setConnecting: (connecting: boolean) =>
        set({ isConnecting: connecting }),
    }),
    {
      name: "stackstream-wallet",
      partialize: (state) => ({ address: state.address, isConnected: state.isConnected }),
    }
  )
);
