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
  "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79";

// Contract identifiers
export const STREAM_MANAGER_CONTRACT = `${CONTRACT_DEPLOYER}.stream-manager`;
export const STREAM_FACTORY_CONTRACT = `${CONTRACT_DEPLOYER}.stream-factory`;
export const MOCK_TOKEN_CONTRACT = `${CONTRACT_DEPLOYER}.mock-sip010-token`;
export const SIP010_TRAIT_CONTRACT = `${CONTRACT_DEPLOYER}.sip-010-trait`;

// OpenClaw API. Empty string = same origin: the API runs as Next.js route
// handlers in this app (src/app/api), so no separate backend is needed.
// Set NEXT_PUBLIC_OPENCLAW_API_URL only to point at an external service.
export const OPENCLAW_API_URL = process.env.NEXT_PUBLIC_OPENCLAW_API_URL ?? "";

// Hiro API
export const HIRO_API_BASE = IS_MAINNET
  ? "https://api.mainnet.hiro.so"
  : "https://api.testnet.hiro.so";

// Explorer
export const EXPLORER_BASE = IS_MAINNET
  ? "https://explorer.hiro.so"
  : "https://explorer.hiro.so/?chain=testnet";

// Human-readable network name for UI badges and labels. Derived from NETWORK
// so the site always reflects the chain it is actually running on.
export const NETWORK_LABEL = IS_MAINNET ? "Mainnet" : "Testnet";

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
  "Real-time payment streaming on Stacks — for teams, organizations, and individuals. Stream sBTC, USDA, ALEX, xBTC, or any SIP-010 token.";

// Stacks block cadence under Nakamoto (Epoch 3.0+). `stacks-block-height` —
// which the stream-manager contract uses for start-block / end-block — now
// advances roughly every 5 seconds, decoupled from the 10-min Bitcoin block.
// Pre-Nakamoto values (600s/block, 6/hour, 144/day) made a "5 hour" stream
// run on-chain for ~2.5 minutes; see commit 2f15b6f for the related start-
// block buffer fix.

/** Average Stacks block time in seconds (Nakamoto) */
export const BLOCK_TIME_SECONDS = 5;

/** Blocks per minute (60 / 5) */
export const BLOCKS_PER_MINUTE = 12;

/** Blocks per hour (60 * 12) */
export const BLOCKS_PER_HOUR = 720;

/** Blocks per day (24 * 720) */
export const BLOCKS_PER_DAY = 17_280;

/** Blocks per month (30 * 17_280) */
export const BLOCKS_PER_MONTH = 518_400;

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

/**
 * Token metadata is defined in `token-metadata.ts` (pure + testable) and
 * resolved from chain in `token-metadata-client.ts`. Re-exported here so the
 * existing `@/lib/constants` import surface keeps working.
 */
export {
  getCuratedToken,
  getCuratedTokens,
  registerCuratedToken,
  isValidAssetName,
  isValidContractId,
  isValidDecimals,
  toRawAmount,
  hasExcessPrecision,
  fromRawAmount,
  unresolvableTokenLabel,
  type ResolvedToken,
  type TokenConfig,
} from "./token-metadata";

import { getCuratedTokens, registerCuratedToken } from "./token-metadata";
import type { TokenConfig } from "./token-metadata";

// The mock testnet token's contract id depends on the deployer address, so it
// is registered here rather than hardcoded in token-metadata.ts (which this
// file already imports from, and which must not import back).
if (!IS_MAINNET) {
  registerCuratedToken({
    contractId: MOCK_TOKEN_CONTRACT,
    assetName: "mock-sbtc",
    decimals: 8,
    symbol: "msBTC",
    name: "Mock sBTC",
    curated: true,
    icon: "/bitcoin.svg",
    description: "Testnet mock token with public faucet",
  });
}

/**
 * Tokens the UI offers in the create-stream selector.
 *
 * This is a UI seed list, NOT a protocol allowlist. `stream-manager.clar` takes
 * any `(token <sip-010-trait>)`, so any SIP-010 token can be streamed; streams
 * in tokens outside this list still resolve and function correctly, they just
 * don't appear in this dropdown. Display metadata (name, description, icon)
 * cannot be read off-chain, which is the only reason the list exists.
 */
export const SUPPORTED_TOKENS = getCuratedTokens(NETWORK);

/**
 * Default token for the create-stream form (first in the selector).
 *
 * Only ever a *seed*. Never use this to resolve the token of an existing
 * stream — a stream in an unlisted token is not this token, and using it as a
 * fallback is what produced wrong asset names in post-conditions.
 */
export const DEFAULT_TOKEN = SUPPORTED_TOKENS[0];

/**
 * Curated lookup by exact contract id, e.g. "SM3VDX...sbtc-token".
 *
 * Returns null when the contract is not curated. Callers MUST handle null:
 *
 *   - Display: show the contract name, or resolve via `useTokenMetadata`.
 *   - Transaction building: refuse. A substituted default yields a
 *     post-condition naming an asset the transaction never touches, which the
 *     wallet rejects with "a post-condition was not met" — a failure that
 *     gives the user no clue about the real cause.
 *
 * This function previously returned DEFAULT_TOKEN on a miss. That silently
 * mislabelled every unlisted token as sBTC, reported 6-decimal balances at an
 * 8-decimal scale (100x wrong), and broke claim/cancel/top-up post-conditions.
 */
export function getTokenConfigByContractId(contractId: string): TokenConfig | null {
  return SUPPORTED_TOKENS.find((t) => t.contractId === contractId) ?? null;
}

/** Polling interval for balance updates (ms) */
export const BALANCE_POLL_INTERVAL = 15_000;

/** Block polling interval (ms) */
export const BLOCK_POLL_INTERVAL = 30_000;

/**
 * User-feedback form. Defaults to a placeholder Google Form URL — set
 * `NEXT_PUBLIC_FEEDBACK_URL` in the Vercel env to point at a real
 * form. The URL is opened in a new tab; we do not POST to it.
 */
export const FEEDBACK_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_URL ??
  "https://forms.gle/xmpNJkjtWwV2gYCS7";
