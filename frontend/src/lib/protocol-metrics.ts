import { cvToJSON, deserializeCV } from "@stacks/transactions";
import { HIRO_API_BASE, NETWORK, STREAM_MANAGER_CONTRACT } from "./constants";
import { getStreamNonce } from "./openclaw-server";
import {
  fromRawAmount,
  getCuratedToken,
  isValidContractId,
  unresolvableTokenLabel,
} from "./token-metadata";
import { getTokenDecimals, getTokenSymbol } from "./token-metadata-client";

export interface StreamCreatedEvent {
  streamId: number;
  sender: string;
  recipient: string;
  token: string;
  depositAmount: bigint;
  startBlock: number;
  endBlock: number;
  ratePerBlock: bigint;
}

export interface HiroContractEvent {
  event_index?: number;
  event_type?: string;
  tx_id?: string;
  contract_log?: {
    contract_id?: string;
    value?: {
      hex?: string;
      repr?: string;
    };
  };
}

export interface TokenVolumeAggregate {
  streams: number;
  rawVolume: bigint;
}

export interface TokenVolume {
  contractId: string;
  symbol: string;
  decimals: number | null;
  streams: number;
  rawVolume: string;
  priceUsd: number | null;
  volumeUsd: number | null;
  priceSource: "DefiLlama" | "USD peg" | null;
}

export interface ProtocolMetrics {
  network: "mainnet" | "testnet";
  totalStreams: number;
  indexedStreams: number;
  totalVolumeUsd: number;
  pricedTokens: number;
  unpricedTokens: number;
  tokens: TokenVolume[];
  asOf: string;
  pricesAsOf: string | null;
}

interface ClarityJson {
  type?: string;
  value?: unknown;
}

interface PriceQuote {
  price?: unknown;
  confidence?: unknown;
  timestamp?: unknown;
}

export const USDA_MAINNET_TOKEN = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token";
export const XBTC_MAINNET_TOKEN = "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin";

const EVENTS_PAGE_SIZE = 50;
const MAX_EVENT_PAGES = 200;
const PRICE_BATCH_SIZE = 25;
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

function asClarityJson(value: unknown): ClarityJson | null {
  return value && typeof value === "object" ? (value as ClarityJson) : null;
}

function tupleField(tuple: ClarityJson | null, key: string): ClarityJson | null {
  if (!tuple || typeof tuple !== "object") return null;
  return asClarityJson((tuple as Record<string, unknown>)[key]);
}

function uintValue(field: ClarityJson | null): bigint | null {
  if (!field || field.type !== "uint" || typeof field.value !== "string") return null;
  try {
    return BigInt(field.value);
  } catch {
    return null;
  }
}

function principalValue(field: ClarityJson | null): string | null {
  if (!field || field.type !== "principal" || typeof field.value !== "string") return null;
  return field.value;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length === 0 || clean.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(clean)) {
    throw new Error("Invalid event hex");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function parseStreamCreatedEvent(row: HiroContractEvent): StreamCreatedEvent | null {
  if (row.event_type !== "smart_contract_log") return null;
  const hex = row.contract_log?.value?.hex;
  if (!hex) return null;

  try {
    const json = asClarityJson(cvToJSON(deserializeCV(hexToBytes(hex))));
    const tuple = asClarityJson(json?.value);
    const event = tupleField(tuple, "event");
    if (!event || event.value !== "stream-created") return null;

    const streamIdRaw = uintValue(tupleField(tuple, "stream-id"));
    const sender = principalValue(tupleField(tuple, "sender"));
    const recipient = principalValue(tupleField(tuple, "recipient"));
    const token = principalValue(tupleField(tuple, "token"));
    const depositAmount = uintValue(tupleField(tuple, "deposit-amount"));
    const startBlockRaw = uintValue(tupleField(tuple, "start-block"));
    const endBlockRaw = uintValue(tupleField(tuple, "end-block"));
    const ratePerBlock = uintValue(tupleField(tuple, "rate-per-block"));

    if (
      streamIdRaw === null ||
      sender === null ||
      recipient === null ||
      token === null ||
      !isValidContractId(token) ||
      depositAmount === null ||
      startBlockRaw === null ||
      endBlockRaw === null ||
      ratePerBlock === null
    ) {
      return null;
    }

    const streamId = Number(streamIdRaw);
    const startBlock = Number(startBlockRaw);
    const endBlock = Number(endBlockRaw);
    if (
      !Number.isSafeInteger(streamId) ||
      !Number.isSafeInteger(startBlock) ||
      !Number.isSafeInteger(endBlock)
    ) {
      return null;
    }

    return {
      streamId,
      sender,
      recipient,
      token,
      depositAmount,
      startBlock,
      endBlock,
      ratePerBlock,
    };
  } catch {
    return null;
  }
}

export function collectStreamCreatedEvents(
  rows: readonly HiroContractEvent[]
): StreamCreatedEvent[] {
  const seen = new Set<number>();
  const events: StreamCreatedEvent[] = [];
  for (const row of rows) {
    const event = parseStreamCreatedEvent(row);
    if (!event || seen.has(event.streamId)) continue;
    seen.add(event.streamId);
    events.push(event);
  }
  return events;
}

export function aggregateStreamVolumes(
  events: readonly StreamCreatedEvent[]
): Map<string, TokenVolumeAggregate> {
  const byToken = new Map<string, TokenVolumeAggregate>();
  for (const event of events) {
    const aggregate = byToken.get(event.token) ?? { streams: 0, rawVolume: 0n };
    aggregate.streams += 1;
    aggregate.rawVolume += event.depositAmount;
    byToken.set(event.token, aggregate);
  }
  return byToken;
}

export function fixedPriceForToken(token: string): number | null {
  return token === USDA_MAINNET_TOKEN ? 1 : null;
}

export function priceAssetIdForToken(token: string): string {
  return token === XBTC_MAINNET_TOKEN ? "coingecko:bitcoin" : `stacks:${token}`;
}

function rawToNumber(raw: bigint, decimals: number): number {
  return Number(fromRawAmount(raw, decimals));
}

async function fetchStreamEventRows(): Promise<HiroContractEvent[]> {
  const rows: HiroContractEvent[] = [];
  for (let page = 0; page < MAX_EVENT_PAGES; page++) {
    const url =
      `${HIRO_API_BASE}/extended/v1/contract/${STREAM_MANAGER_CONTRACT}/events` +
      `?limit=${EVENTS_PAGE_SIZE}&offset=${page * EVENTS_PAGE_SIZE}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Hiro contract events request failed (${res.status})`);
    const data = (await res.json()) as { results?: HiroContractEvent[] };
    const results = Array.isArray(data.results) ? data.results : [];
    rows.push(...results);
    if (results.length < EVENTS_PAGE_SIZE) break;
  }
  return rows;
}

async function fetchDefiLlamaPrices(
  assetIds: readonly string[]
): Promise<Map<string, { price: number; asOf: string | null }>> {
  const prices = new Map<string, { price: number; asOf: string | null }>();
  const unique = [...new Set(assetIds)];

  for (let start = 0; start < unique.length; start += PRICE_BATCH_SIZE) {
    const batch = unique.slice(start, start + PRICE_BATCH_SIZE);
    try {
      const res = await fetch(`https://coins.llama.fi/prices/current/${batch.join(",")}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { coins?: Record<string, PriceQuote> };
      for (const [assetId, quote] of Object.entries(data.coins ?? {})) {
        const price = Number(quote.price);
        const confidence = quote.confidence === undefined ? 1 : Number(quote.confidence);
        if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(confidence)) continue;
        if (confidence < 0.5) continue;
        const timestamp = Number(quote.timestamp);
        prices.set(assetId, {
          price,
          asOf:
            Number.isFinite(timestamp) && timestamp > 0
              ? new Date(timestamp * 1000).toISOString()
              : null,
        });
      }
    } catch {
      continue;
    }
  }

  return prices;
}

async function resolveDisplayToken(
  token: string
): Promise<{ symbol: string; decimals: number | null }> {
  const curated = getCuratedToken(token);
  if (curated) return { symbol: curated.symbol, decimals: curated.decimals };

  const [decimals, symbol] = await Promise.all([getTokenDecimals(token), getTokenSymbol(token)]);
  return { symbol: symbol ?? unresolvableTokenLabel(token), decimals };
}

const cache: { metrics: ProtocolMetrics | null; expires: number } = {
  metrics: null,
  expires: 0,
};

let inflight: Promise<ProtocolMetrics> | null = null;

export async function getProtocolMetrics(): Promise<ProtocolMetrics> {
  if (cache.metrics && Date.now() < cache.expires) return cache.metrics;
  if (inflight) return inflight;

  inflight = loadProtocolMetrics().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function loadProtocolMetrics(): Promise<ProtocolMetrics> {
  const [rows, totalStreams] = await Promise.all([fetchStreamEventRows(), getStreamNonce()]);
  const events = collectStreamCreatedEvents(rows);
  const byToken = aggregateStreamVolumes(events);
  const tokenIds = [...byToken.keys()];

  const [metadata, prices] = await Promise.all([
    Promise.all(
      tokenIds.map(async (token) => [token, await resolveDisplayToken(token)] as const)
    ),
    fetchDefiLlamaPrices(
      tokenIds
        .filter((token) => fixedPriceForToken(token) === null)
        .map(priceAssetIdForToken)
    ),
  ]);

  const metadataByToken = new Map(metadata);
  const tokens: TokenVolume[] = tokenIds.map((contractId) => {
    const aggregate = byToken.get(contractId);
    const meta = metadataByToken.get(contractId) ?? {
      symbol: unresolvableTokenLabel(contractId),
      decimals: null,
    };
    const fixedPrice = fixedPriceForToken(contractId);
    const quote = prices.get(priceAssetIdForToken(contractId));
    const priceUsd = fixedPrice ?? quote?.price ?? null;
    const amount =
      meta.decimals === null ? null : rawToNumber(aggregate?.rawVolume ?? 0n, meta.decimals);
    const volumeUsd =
      amount !== null && Number.isFinite(amount) && priceUsd !== null
        ? amount * priceUsd
        : null;

    return {
      contractId,
      symbol: meta.symbol,
      decimals: meta.decimals,
      streams: aggregate?.streams ?? 0,
      rawVolume: (aggregate?.rawVolume ?? 0n).toString(),
      priceUsd,
      volumeUsd,
      priceSource: fixedPrice !== null ? "USD peg" : quote ? "DefiLlama" : null,
    };
  });

  tokens.sort(
    (a, b) =>
      (b.volumeUsd ?? -1) - (a.volumeUsd ?? -1) ||
      b.streams - a.streams ||
      a.contractId.localeCompare(b.contractId)
  );

  const totalVolumeUsd = tokens.reduce((sum, token) => sum + (token.volumeUsd ?? 0), 0);
  const pricedTokens = tokens.filter((token) => token.volumeUsd !== null).length;
  const priceTimestamps = [...prices.values()]
    .map((price) => price.asOf)
    .filter((asOf): asOf is string => asOf !== null)
    .sort();

  const metrics: ProtocolMetrics = {
    network: NETWORK,
    totalStreams,
    indexedStreams: events.length,
    totalVolumeUsd,
    pricedTokens,
    unpricedTokens: tokens.length - pricedTokens,
    tokens,
    asOf: new Date().toISOString(),
    pricesAsOf: priceTimestamps.length > 0 ? priceTimestamps[priceTimestamps.length - 1] : null,
  };

  cache.metrics = metrics;
  cache.expires = Date.now() + CACHE_TTL_MS;
  return metrics;
}
