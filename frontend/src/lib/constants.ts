// ============================================================================
// Network & Contract Configuration
// ============================================================================

export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet";

export const IS_MAINNET = NETWORK === "mainnet";

// Contract deployer address
export const CONTRACT_DEPLOYER =
  process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER ??
  "STV9VBEA4NB0Q2N67HD6AXP2MGSEKVAJFC8GFTT7";

// Contract identifiers
export const STREAM_MANAGER_CONTRACT = `${CONTRACT_DEPLOYER}.stream-manager`;
export const STREAM_FACTORY_CONTRACT = `${CONTRACT_DEPLOYER}.stream-factory`;
export const MOCK_TOKEN_CONTRACT = `${CONTRACT_DEPLOYER}.mock-sip010-token`;
export const SIP010_TRAIT_CONTRACT = `${CONTRACT_DEPLOYER}.sip-010-trait`;

// OpenClaw API
export const OPENCLAW_API_URL =
  process.env.NEXT_PUBLIC_OPENCLAW_API_URL ?? "http://localhost:3001";

// Hiro API
export const HIRO_API_BASE = IS_MAINNET
  ? "https://api.mainnet.hiro.so"
  : "https://api.testnet.hiro.so";

// Explorer
export const EXPLORER_BASE = IS_MAINNET
  ? "https://explorer.hiro.so"
  : "https://explorer.hiro.so/?chain=testnet";

// ============================================================================
// Stream Status Codes (matching smart contract)
// ============================================================================

export const STREAM_STATUS = {
  ACTIVE: 0,
  PAUSED: 1,
  CANCELLED: 2,
  DEPLETED: 3,
} as const;

// ============================================================================
// App Constants
// ============================================================================

export const APP_NAME = "StackStream";
export const APP_DESCRIPTION =
  "Bitcoin-native payroll streaming for DAOs on Stacks";

/** Average Stacks block time in seconds */
export const BLOCK_TIME_SECONDS = 600; // ~10 minutes

/** Blocks per day (approx) */
export const BLOCKS_PER_DAY = 144;

/** Blocks per month (approx 30 days) */
export const BLOCKS_PER_MONTH = 4320;

/** Blocks per hour (approx) */
export const BLOCKS_PER_HOUR = 6;

/** Blocks per minute (approx — 1 block / 10 min) */
export const BLOCKS_PER_MINUTE = 1 / 10;

/** Duration unit options for stream creation */
export const DURATION_UNITS = [
  { value: "minutes", label: "Minutes", blocksPerUnit: BLOCKS_PER_MINUTE },
  { value: "hours", label: "Hours", blocksPerUnit: BLOCKS_PER_HOUR },
  { value: "days", label: "Days", blocksPerUnit: BLOCKS_PER_DAY },
  { value: "months", label: "Months", blocksPerUnit: BLOCKS_PER_MONTH },
] as const;

export type DurationUnit = (typeof DURATION_UNITS)[number]["value"];

/** Maximum streams per user (from contract) */
export const MAX_STREAMS_PER_USER = 100;

/** Token info for supported tokens */
export const SUPPORTED_TOKENS = [
  {
    symbol: "msBTC",
    name: "Mock sBTC",
    decimals: 8,
    contractId: MOCK_TOKEN_CONTRACT,
    icon: "/bitcoin.svg",
  },
] as const;

/** Polling interval for balance updates (ms) */
export const BALANCE_POLL_INTERVAL = 15_000;

/** Block polling interval (ms) */
export const BLOCK_POLL_INTERVAL = 30_000;
