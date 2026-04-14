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
  "ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB";

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

// ============================================================================
// Token Configuration
// ============================================================================

/** Shape of every token entry used throughout the UI */
export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  contractId: string;
  /** Fungible token name inside the contract — used for post-conditions */
  ftName: string;
  icon: string;
  description: string;
}

/**
 * Real mainnet SIP-010 tokens supported by StackStream.
 *
 * Contract IDs reflect Stacks mainnet as of Epoch 3.0 / Q1 2026.
 * Verify addresses on Stacks Explorer before deploying if significant time
 * has passed since this file was last updated.
 *
 * Adding a new token: append an entry here and supply an icon in /public/.
 * The protocol itself is permissionless — any SIP-010 token can be streamed;
 * this list controls what the frontend surfaces in the token selector.
 */
const MAINNET_TOKENS: readonly TokenConfig[] = [
  {
    symbol: "sBTC",
    name: "Stacks BTC",
    decimals: 8,
    contractId: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc",
    ftName: "sbtc",
    icon: "/bitcoin.svg",
    description: "Native Bitcoin on Stacks — the flagship streaming token",
  },
  {
    symbol: "USDA",
    name: "USDA",
    decimals: 6,
    contractId: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token",
    ftName: "usda",
    icon: "/usda.svg",
    description: "Arkadiko USD stablecoin — ideal for stable payroll streams",
  },
  {
    symbol: "ALEX",
    name: "ALEX",
    decimals: 8,
    contractId: "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex",
    ftName: "token-alex",
    icon: "/alex.svg",
    description: "ALEX DeFi protocol token",
  },
  {
    symbol: "xBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    contractId: "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin",
    ftName: "wrapped-bitcoin",
    icon: "/bitcoin.svg",
    description: "Tokenized Bitcoin on Stacks",
  },
];

/** Testnet tokens — mock only, faucet available */
const TESTNET_TOKENS: readonly TokenConfig[] = [
  {
    symbol: "msBTC",
    name: "Mock sBTC",
    decimals: 8,
    contractId: MOCK_TOKEN_CONTRACT,
    ftName: "mock-sbtc",
    icon: "/bitcoin.svg",
    description: "Testnet mock token with public faucet",
  },
];

/**
 * Network-aware supported token list.
 * Mainnet: 4 real SIP-010 tokens (sBTC, USDA, ALEX, xBTC).
 * Testnet: 1 mock token with faucet for development.
 */
export const SUPPORTED_TOKENS: readonly TokenConfig[] = IS_MAINNET
  ? MAINNET_TOKENS
  : TESTNET_TOKENS;

/** Default token for the create stream form (first in list) */
export const DEFAULT_TOKEN = SUPPORTED_TOKENS[0];

/** Polling interval for balance updates (ms) */
export const BALANCE_POLL_INTERVAL = 15_000;

/** Block polling interval (ms) */
export const BLOCK_POLL_INTERVAL = 30_000;
