import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BLOCK_TIME_SECONDS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a micro-token amount (8 decimals for sBTC) into a human-readable string */
export function formatTokenAmount(
  amount: bigint | number,
  decimals = 8,
  displayDecimals = 6
): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  const value = num / Math.pow(10, decimals);
  if (value === 0) return "0";
  if (value < 0.000001) return "< 0.000001";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: displayDecimals,
  });
}

/** Format a principal address for display (truncated) */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Map stream status code to label */
export function getStreamStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return "Active";
    case 1:
      return "Paused";
    case 2:
      return "Cancelled";
    case 3:
      return "Depleted";
    default:
      return "Unknown";
  }
}

/** Map stream status code to color class */
export function getStreamStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "text-emerald-400";
    case 1:
      return "text-amber-400";
    case 2:
      return "text-red-400";
    case 3:
      return "text-zinc-400";
    default:
      return "text-zinc-500";
  }
}

/** Calculate stream progress as 0-100 */
export function getStreamProgress(
  startBlock: number,
  endBlock: number,
  currentBlock: number,
  totalPausedDuration: number
): number {
  const duration = endBlock - startBlock;
  if (duration === 0) return 100;
  const elapsed = Math.max(0, currentBlock - startBlock - totalPausedDuration);
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
}

/** Estimate wall-clock time from a Stacks-block count (Nakamoto: ~5s/block) */
export function blocksToTimeString(blocks: number): string {
  const totalSeconds = blocks * BLOCK_TIME_SECONDS;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return `${totalSeconds}s`;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ${hours % 24}h`;
  const months = Math.floor(days / 30);
  return `${months}mo ${days % 30}d`;
}

/**
 * Wall-clock description of a stream's window relative to the current block.
 * Hides block numbers behind a time-first phrasing.
 *
 *   future:   "Starts in 12m"
 *   active:   "Ends in 4h 30m"
 *   past:     "Ended 1d ago"
 *   loading:  null  (caller renders a fallback)
 */
export function formatStreamWindow(
  startBlock: number,
  endBlock: number,
  currentBlock: number,
): string | null {
  if (currentBlock <= 0) return null;
  if (currentBlock < startBlock) return `Starts in ${blocksToTimeString(startBlock - currentBlock)}`;
  if (currentBlock < endBlock) return `Ends in ${blocksToTimeString(endBlock - currentBlock)}`;
  return `Ended ${blocksToTimeString(currentBlock - endBlock)} ago`;
}

/**
 * Approximate wall-clock time at which a future block will be mined,
 * computed as now + (targetBlock - currentBlock) * BLOCK_TIME_SECONDS.
 * Returns local-time "3:42 PM" if within the next 24h, else "May 21 · 3:42 PM".
 */
export function blockToClockTime(targetBlock: number, currentBlock: number): string {
  if (currentBlock <= 0) return "—";
  const deltaMs = (targetBlock - currentBlock) * BLOCK_TIME_SECONDS * 1000;
  const target = new Date(Date.now() + deltaMs);
  const sameDay = target.toDateString() === new Date().toDateString();
  if (sameDay) {
    return target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return target.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** PRECISION constant matching smart contract (1e12) */
export const PRECISION = 1_000_000_000_000n;

/** Token decimals for sBTC */
export const SBTC_DECIMALS = 8;
