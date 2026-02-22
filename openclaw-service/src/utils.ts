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

/** Estimate time remaining from blocks (Stacks ~10 min/block) */
export function blocksToTimeString(blocks: number): string {
  const minutes = blocks * 10;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ${hours % 24}h`;
  const months = Math.floor(days / 30);
  return `${months}mo ${days % 30}d`;
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

/** Truncate a principal address for display */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** BigInt-safe JSON replacer — converts BigInt values to strings */
export function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
