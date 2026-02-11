/**
 * Global app state: current block height, network info, UI state.
 */

import { create } from "zustand";

export interface AppState {
  currentBlockHeight: number;
  setCurrentBlockHeight: (height: number) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentBlockHeight: 0,
  setCurrentBlockHeight: (height) => set({ currentBlockHeight: height }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
