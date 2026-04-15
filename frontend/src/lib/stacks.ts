/**
 * Stacks blockchain utilities for contract interaction.
 *
 * References:
 * - Stacks.js docs: https://docs.stacks.co/stacks.js
 * - SIP-010 standard: https://github.com/stacksgov/sips/blob/main/sips/sip-010
 * - Hiro API: https://docs.hiro.so/stacks/api
 */

import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
  principalCV,
  optionalCVOf,
  stringUtf8CV,
  noneCV,
  type ClarityValue,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import {
  HIRO_API_BASE,
  STREAM_MANAGER_CONTRACT,
  STREAM_FACTORY_CONTRACT,
  MOCK_TOKEN_CONTRACT,
  IS_MAINNET,
} from "./constants";

// ============================================================================
// Network helpers
// ============================================================================

export function getNetwork() {
  return IS_MAINNET ? "mainnet" : "testnet";
}

export function getApiUrl(path: string): string {
  return `${HIRO_API_BASE}${path}`;
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
  args: ClarityValue[] = [],
  senderAddress?: string
) {
  const [contractAddress, contractName] = splitContract(contractId);
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs: args,
    senderAddress: senderAddress ?? contractAddress,
    network: getNetwork(),
  });
  return cvToJSON(result);
}

// ============================================================================
// Stream Manager read-only calls
// ============================================================================

/**
 * Unwrap cvToJSON optional nesting.
 *
 * cvToJSON converts Clarity (optional T) into:
 *   some → { type: "(optional T)", value: { type: "T", value: <inner> } }
 *   none → { type: "(optional T)", value: null }
 *
 * This helper returns the inner value object or null.
 */
function unwrapOptional(cv: { value: any }): any {
  if (cv.value === null || cv.value === undefined) return null;
  // If the value itself has a .value property, it's the optional wrapper
  // around a typed value (tuple, uint, principal, etc.)
  return cv.value;
}

export async function getStream(streamId: number) {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-stream",
    [uintCV(streamId)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  // inner is { type: "(tuple ...)", value: { sender: ..., ... } }
  return parseStreamData(inner.value);
}

export async function getStreamStatus(streamId: number): Promise<number | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-stream-status",
    [uintCV(streamId)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  return Number(inner.value);
}

export async function getClaimableBalance(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-claimable-balance",
    [uintCV(streamId)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  return BigInt(inner.value);
}

export async function getStreamedAmount(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-streamed-amount",
    [uintCV(streamId)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  return BigInt(inner.value);
}

export async function getRemainingBalance(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-remaining-balance",
    [uintCV(streamId)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  return BigInt(inner.value);
}

export async function getRefundableAmount(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-refundable-amount",
    [uintCV(streamId)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  return BigInt(inner.value);
}

export async function getSenderStreams(sender: string): Promise<number[]> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-sender-streams",
    [principalCV(sender)]
  );
  if (!result.value) return [];
  return result.value.map((v: { value: string }) => Number(v.value));
}

export async function getRecipientStreams(recipient: string): Promise<number[]> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-recipient-streams",
    [principalCV(recipient)]
  );
  if (!result.value) return [];
  return result.value.map((v: { value: string }) => Number(v.value));
}

export async function getStreamNonce(): Promise<number> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-stream-nonce"
  );
  return Number(result.value);
}

// ============================================================================
// Stream Factory read-only calls
// ============================================================================

export async function getDao(admin: string) {
  const result = await callReadOnly(
    STREAM_FACTORY_CONTRACT,
    "get-dao",
    [principalCV(admin)]
  );
  const inner = unwrapOptional(result);
  if (inner === null) return null;
  return parseDaoData(inner.value);
}

export async function getDaoCount(): Promise<number> {
  const result = await callReadOnly(
    STREAM_FACTORY_CONTRACT,
    "get-dao-count"
  );
  return Number(result.value);
}

export async function isRegisteredDao(admin: string): Promise<boolean> {
  const result = await callReadOnly(
    STREAM_FACTORY_CONTRACT,
    "is-registered-dao",
    [principalCV(admin)]
  );
  return result.value === true;
}

// ============================================================================
// Transaction builders (return openContractCall options)
// ============================================================================

export function buildCreateStreamTx(params: {
  recipient: string;
  tokenContract: string;
  /** Fungible token asset name inside the contract (e.g. "sbtc", "mock-sbtc", "usda") */
  ftName: string;
  depositAmount: bigint;
  startBlock: number;
  durationBlocks: number;
  memo?: string;
  senderAddress: string;
}) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);
  const [tokenAddr, tokenName] = splitContract(params.tokenContract);

  const functionArgs: ClarityValue[] = [
    principalCV(params.recipient),
    principalCV(params.tokenContract),
    uintCV(params.depositAmount),
    uintCV(params.startBlock),
    uintCV(params.durationBlocks),
    params.memo ? optionalCVOf(stringUtf8CV(params.memo)) : noneCV(),
  ];

  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "create-stream",
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [
      Pc.principal(params.senderAddress)
        .willSendLte(params.depositAmount)
        .ft(`${tokenAddr}.${tokenName}`, params.ftName),
    ],
    network: getNetwork(),
  };
}

export function buildClaimTx(params: {
  streamId: number;
  tokenContract: string;
  amount: bigint;
}) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);

  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "claim",
    functionArgs: [
      uintCV(params.streamId),
      principalCV(params.tokenContract),
      uintCV(params.amount),
    ],
    postConditionMode: PostConditionMode.Allow,
    network: getNetwork(),
  };
}

export function buildClaimAllTx(params: {
  streamId: number;
  tokenContract: string;
}) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);

  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "claim-all",
    functionArgs: [
      uintCV(params.streamId),
      principalCV(params.tokenContract),
    ],
    postConditionMode: PostConditionMode.Allow,
    network: getNetwork(),
  };
}

export function buildPauseStreamTx(streamId: number) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);
  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "pause-stream",
    functionArgs: [uintCV(streamId)],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    network: getNetwork(),
  };
}

export function buildResumeStreamTx(streamId: number) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);
  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "resume-stream",
    functionArgs: [uintCV(streamId)],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    network: getNetwork(),
  };
}

export function buildCancelStreamTx(params: {
  streamId: number;
  tokenContract: string;
}) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);
  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "cancel-stream",
    functionArgs: [
      uintCV(params.streamId),
      principalCV(params.tokenContract),
    ],
    postConditionMode: PostConditionMode.Allow,
    network: getNetwork(),
  };
}

export function buildTopUpStreamTx(params: {
  streamId: number;
  tokenContract: string;
  /** Fungible token asset name inside the contract (e.g. "sbtc", "mock-sbtc", "usda") */
  ftName: string;
  amount: bigint;
  senderAddress: string;
}) {
  const [mgrAddr, mgrName] = splitContract(STREAM_MANAGER_CONTRACT);
  const [tokenAddr, tokenName] = splitContract(params.tokenContract);

  return {
    contractAddress: mgrAddr,
    contractName: mgrName,
    functionName: "top-up-stream",
    functionArgs: [
      uintCV(params.streamId),
      principalCV(params.tokenContract),
      uintCV(params.amount),
    ],
    postConditionMode: PostConditionMode.Allow,
    postConditions: [
      Pc.principal(params.senderAddress)
        .willSendLte(params.amount)
        .ft(`${tokenAddr}.${tokenName}`, params.ftName),
    ],
    network: getNetwork(),
  };
}

export function buildFaucetTx(params: {
  amount: bigint;
  senderAddress: string;
}) {
  const [tokenAddr, tokenName] = splitContract(MOCK_TOKEN_CONTRACT);

  return {
    contractAddress: tokenAddr,
    contractName: tokenName,
    functionName: "faucet",
    functionArgs: [uintCV(params.amount)],
    postConditionMode: PostConditionMode.Allow,
    network: getNetwork(),
  };
}

export function buildRegisterDaoTx(name: string) {
  const [factAddr, factName] = splitContract(STREAM_FACTORY_CONTRACT);
  return {
    contractAddress: factAddr,
    contractName: factName,
    functionName: "register-dao",
    functionArgs: [stringUtf8CV(name)],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    network: getNetwork(),
  };
}

// ============================================================================
// Hiro API helpers
// ============================================================================

export async function getCurrentBlockHeight(): Promise<number> {
  const res = await fetch(getApiUrl("/v2/info"), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.stacks_tip_height;
}

export async function getTokenBalance(
  address: string,
  tokenContract: string,
  /** Fungible token asset name inside the contract (e.g. "sbtc", "mock-sbtc", "usda") */
  ftName: string
): Promise<bigint> {
  if (!address) return 0n;
  const res = await fetch(
    getApiUrl(`/extended/v1/address/${address}/balances`),
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return 0n;
  const data = await res.json();
  const ftBalances = data.fungible_tokens || {};
  const key = `${tokenContract}::${ftName}`;
  return BigInt(ftBalances[key]?.balance ?? "0");
}

// ============================================================================
// Clarity error code mapping
// ============================================================================

const CLARITY_ERROR_MESSAGES: Record<string, string> = {
  "u100": "Not authorized",
  "u101": "Only the stream sender can do this",
  "u102": "Only the stream recipient can do this",
  "u200": "Stream not found",
  "u201": "Stream is fully depleted",
  "u202": "Stream has been cancelled",
  "u203": "Stream is paused",
  "u204": "Stream is not paused",
  "u207": "Stream has already ended",
  "u208": "Stream has not expired yet",
  "u300": "Invalid amount",
  "u301": "Invalid duration",
  "u302": "Start block is in the past",
  "u303": "Cannot stream to yourself",
  "u304": "Nothing available to claim yet",
  "u305": "Maximum streams limit reached (100)",
  "u401": "Token contract mismatch",
  // Factory errors
  "u501": "DAO not found",
  "u502": "DAO already registered",
  "u503": "Not the DAO admin",
  "u504": "Invalid DAO name",
  "u505": "Stream not found",
  "u506": "Stream already tracked",
};

/**
 * Convert a Clarity error code (e.g. "u100") to a human-readable message.
 */
export function clarityErrorMessage(errorCode?: string): string | undefined {
  if (!errorCode) return undefined;
  return CLARITY_ERROR_MESSAGES[errorCode];
}

// ============================================================================
// Transaction confirmation polling
// ============================================================================

/**
 * Poll the Hiro API until a transaction is confirmed (or fails).
 * Returns the final tx status: "success" | "abort_by_response" | "abort_by_post_condition" | null (timeout).
 */
export interface TxConfirmationResult {
  status: string;
  confirmed: boolean;
  /** Clarity error code (e.g. "u105") when status is "abort_by_response" */
  errorCode?: string;
  /** Raw tx_result repr string from the API */
  errorRepr?: string;
}

export async function waitForTxConfirmation(
  txId: string,
  {
    interval = 5_000,
    timeout = 600_000,
  }: { interval?: number; timeout?: number } = {}
): Promise<TxConfirmationResult> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(getApiUrl(`/extended/v1/tx/${txId}`), {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const status = data.tx_status;
        if (status === "success") {
          return { status, confirmed: true };
        }
        if (status === "abort_by_response" || status === "abort_by_post_condition") {
          const repr: string | undefined = data.tx_result?.repr;
          // Extract error code from repr like "(err u105)" -> "u105"
          const codeMatch = repr?.match(/\(err\s+(.+?)\)/);
          return {
            status,
            confirmed: false,
            errorCode: codeMatch?.[1],
            errorRepr: repr,
          };
        }
        // "pending" — keep polling
      }
    } catch {
      // Network error — keep trying
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  return { status: "timeout", confirmed: false };
}

// ============================================================================
// Data parsers
// ============================================================================

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
