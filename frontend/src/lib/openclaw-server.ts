/**
 * Server-side OpenClaw logic, ported from openclaw-service so the API can run
 * as Next.js route handlers on the same Vercel deployment (no separate host).
 * Response shapes are kept identical to the standalone Express service.
 */
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
  principalCV,
  type ClarityValue,
} from "@stacks/transactions";

// ============================================================================
// Config
// ============================================================================

const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? "mainnet") as
  | "testnet"
  | "mainnet";
const IS_MAINNET = NETWORK === "mainnet";

const CONTRACT_DEPLOYER =
  process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER ??
  "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79";

const STREAM_MANAGER_CONTRACT = `${CONTRACT_DEPLOYER}.stream-manager`;
const STREAM_FACTORY_CONTRACT = `${CONTRACT_DEPLOYER}.stream-factory`;

const HIRO_API_BASE = IS_MAINNET
  ? "https://api.mainnet.hiro.so"
  : "https://api.testnet.hiro.so";

export function getNetwork() {
  return IS_MAINNET ? "mainnet" : "testnet";
}

// ============================================================================
// Read-only contract calls
// ============================================================================

function splitContract(contractId: string): [string, string] {
  const [addr, name] = contractId.split(".");
  return [addr, name];
}

async function callReadOnly(
  contractId: string,
  functionName: string,
  args: ClarityValue[] = []
) {
  const [contractAddress, contractName] = splitContract(contractId);
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs: args,
    senderAddress: contractAddress,
    network: getNetwork(),
  });
  return cvToJSON(result);
}

export interface StreamData {
  sender: string;
  recipient: string;
  token: string;
  depositAmount: bigint;
  withdrawnAmount: bigint;
  startBlock: number;
  endBlock: number;
  ratePerBlock: bigint;
  status: number;
  pausedAtBlock: number;
  totalPausedDuration: number;
  createdAtBlock: number;
  memo: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseStreamData(raw: Record<string, any>): StreamData {
  return {
    sender: raw.sender.value,
    recipient: raw.recipient.value,
    token: raw.token.value,
    depositAmount: BigInt(raw["deposit-amount"].value),
    withdrawnAmount: BigInt(raw["withdrawn-amount"].value),
    startBlock: Number(raw["start-block"].value),
    endBlock: Number(raw["end-block"].value),
    ratePerBlock: BigInt(raw["rate-per-block"].value),
    status: Number(raw.status.value),
    pausedAtBlock: Number(raw["paused-at-block"].value),
    totalPausedDuration: Number(raw["total-paused-duration"].value),
    createdAtBlock: Number(raw["created-at-block"].value),
    memo: raw.memo?.value?.value ?? null,
  };
}

export async function getStream(streamId: number): Promise<StreamData | null> {
  const result = await callReadOnly(STREAM_MANAGER_CONTRACT, "get-stream", [
    uintCV(streamId),
  ]);
  if (result.value === null) return null;
  // cvToJSON nests an (optional (tuple ...)) as { value: { value: {fields} } }
  // — the tuple fields live one level below the optional's unwrapped value.
  return parseStreamData(result.value.value);
}

async function readUintOrNull(
  functionName: string,
  streamId: number
): Promise<bigint | null> {
  const result = await callReadOnly(STREAM_MANAGER_CONTRACT, functionName, [
    uintCV(streamId),
  ]);
  if (result.value === null) return null;
  return BigInt(result.value.value);
}

export const getClaimableBalance = (id: number) =>
  readUintOrNull("get-claimable-balance", id);
export const getStreamedAmount = (id: number) =>
  readUintOrNull("get-streamed-amount", id);
export const getRemainingBalance = (id: number) =>
  readUintOrNull("get-remaining-balance", id);
export const getRefundableAmount = (id: number) =>
  readUintOrNull("get-refundable-amount", id);

async function getAddressStreams(
  functionName: string,
  address: string
): Promise<number[]> {
  const result = await callReadOnly(STREAM_MANAGER_CONTRACT, functionName, [
    principalCV(address),
  ]);
  if (!result.value) return [];
  return result.value.map((v: { value: string }) => Number(v.value));
}

export const getSenderStreams = (addr: string) =>
  getAddressStreams("get-sender-streams", addr);
export const getRecipientStreams = (addr: string) =>
  getAddressStreams("get-recipient-streams", addr);

export async function getStreamNonce(): Promise<number> {
  const result = await callReadOnly(STREAM_MANAGER_CONTRACT, "get-stream-nonce");
  return Number(result.value);
}

export interface DaoData {
  name: string;
  admin: string;
  totalStreamsCreated: number;
  totalDeposited: bigint;
  createdAtBlock: number;
  isActive: boolean;
}

function parseDaoData(raw: Record<string, any>): DaoData {
  return {
    name: raw.name.value,
    admin: raw.admin.value,
    totalStreamsCreated: Number(raw["total-streams-created"].value),
    totalDeposited: BigInt(raw["total-deposited"].value),
    createdAtBlock: Number(raw["created-at-block"].value),
    isActive: raw["is-active"].value,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getDao(admin: string): Promise<DaoData | null> {
  const result = await callReadOnly(STREAM_FACTORY_CONTRACT, "get-dao", [
    principalCV(admin),
  ]);
  if (result.value === null) return null;
  // Same optional-of-tuple nesting as get-stream (see getStream above).
  return parseDaoData(result.value.value);
}

export async function getDaoCount(): Promise<number> {
  const result = await callReadOnly(STREAM_FACTORY_CONTRACT, "get-dao-count");
  return Number(result.value);
}

export async function getCurrentBlockHeight(): Promise<number> {
  const res = await fetch(`${HIRO_API_BASE}/v2/info`, { cache: "no-store" });
  const data = (await res.json()) as { stacks_tip_height: number };
  return data.stacks_tip_height;
}

// ============================================================================
// Formatting helpers (mirrors openclaw-service/src/utils.ts)
// ============================================================================

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

// ============================================================================
// Route-handler helpers
// ============================================================================

export const STREAM_ID_RE = /^\d+$/;
export const STACKS_ADDRESS_RE = /^S[A-Z0-9]{38,40}$/;

function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, bigIntReplacer), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Never forward raw err.message to clients: internal errors can leak paths,
// SDK versions, and upstream URLs. Log with an opaque ref, return the ref only.
// (Mirrors openclaw-service error-handler, finding M-2.)
export function errorResponse(err: unknown): Response {
  const ref = crypto.randomUUID();
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error(`[ERROR ${ref}] ${message}`);
  if (err instanceof Error && err.message.includes("fetch")) {
    return jsonResponse({ error: "Blockchain API unavailable", ref }, 502);
  }
  return jsonResponse({ error: "Internal server error", ref }, 500);
}
