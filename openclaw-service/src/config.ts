import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 3001);

export const NETWORK = (process.env.NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet";

export const IS_MAINNET = NETWORK === "mainnet";

export const CONTRACT_DEPLOYER =
  process.env.CONTRACT_DEPLOYER ??
  "STV9VBEA4NB0Q2N67HD6AXP2MGSEKVAJFC8GFTT7";

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

export const BLOCKS_PER_DAY = 144;
export const BLOCKS_PER_MONTH = 4320;
export const MAX_STREAMS_PER_USER = 100;
