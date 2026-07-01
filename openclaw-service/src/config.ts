import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 3001);

export const NETWORK = (process.env.NETWORK ?? "mainnet") as
  | "testnet"
  | "mainnet";

export const IS_MAINNET = NETWORK === "mainnet";

export const CONTRACT_DEPLOYER =
  process.env.CONTRACT_DEPLOYER ??
  "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79";

export const STREAM_MANAGER_CONTRACT = `${CONTRACT_DEPLOYER}.stream-manager`;
export const STREAM_FACTORY_CONTRACT = `${CONTRACT_DEPLOYER}.stream-factory`;
export const MOCK_TOKEN_CONTRACT = `${CONTRACT_DEPLOYER}.mock-sip010-token`;

export const HIRO_API_BASE = IS_MAINNET
  ? "https://api.mainnet.hiro.so"
  : "https://api.testnet.hiro.so";

export const STREAM_STATUS = {
  ACTIVE: 0,
  PAUSED: 1,
  CANCELLED: 2,
  DEPLETED: 3,
} as const;

// Nakamoto (Epoch 3.0+) cadence: Stacks blocks advance ~every 5s, so a day is
// 17_280 blocks, not the pre-Nakamoto 144. Kept in sync with the frontend.
export const BLOCK_TIME_SECONDS = 5;
export const BLOCKS_PER_DAY = 17_280;
export const BLOCKS_PER_MONTH = 518_400;
export const MAX_STREAMS_PER_USER = 100;
