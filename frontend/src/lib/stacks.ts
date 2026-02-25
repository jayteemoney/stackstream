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

export async function getStream(streamId: number) {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-stream",
    [uintCV(streamId)]
  );
  if (result.value === null) return null;
  return parseStreamData(result.value);
}

export async function getStreamStatus(streamId: number): Promise<number | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-stream-status",
    [uintCV(streamId)]
  );
  if (result.value === null) return null;
  return Number(result.value.value);
}

export async function getClaimableBalance(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-claimable-balance",
    [uintCV(streamId)]
  );
  if (result.value === null) return null;
  return BigInt(result.value.value);
}

export async function getStreamedAmount(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-streamed-amount",
    [uintCV(streamId)]
  );
  if (result.value === null) return null;
  return BigInt(result.value.value);
}

export async function getRemainingBalance(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-remaining-balance",
    [uintCV(streamId)]
  );
  if (result.value === null) return null;
  return BigInt(result.value.value);
}

export async function getRefundableAmount(streamId: number): Promise<bigint | null> {
  const result = await callReadOnly(
    STREAM_MANAGER_CONTRACT,
    "get-refundable-amount",
    [uintCV(streamId)]
  );
  if (result.value === null) return null;
  return BigInt(result.value.value);
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
  if (result.value === null) return null;
  return parseDaoData(result.value);
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
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      Pc.principal(params.senderAddress)
        .willSendLte(params.depositAmount)
        .ft(`${tokenAddr}.${tokenName}`, "mock-sbtc"),
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
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      Pc.principal(params.senderAddress)
        .willSendLte(params.amount)
        .ft(`${tokenAddr}.${tokenName}`, "mock-sbtc"),
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
  const res = await fetch(getApiUrl("/v2/info"));
  const data = await res.json();
  return data.stacks_tip_height;
}

export async function getTokenBalance(
  address: string,
  tokenContract: string
): Promise<bigint> {
  const res = await fetch(
    getApiUrl(`/extended/v1/address/${address}/balances`)
  );
  const data = await res.json();
  const ftBalances = data.fungible_tokens || {};
  const key = `${tokenContract}::mock-sbtc`;
  return BigInt(ftBalances[key]?.balance ?? "0");
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
