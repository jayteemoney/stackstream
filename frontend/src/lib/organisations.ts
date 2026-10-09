/**
 * The public directory of organisations registered on StackStream.
 *
 * stream-factory keeps organisations in a map keyed by admin address, and
 * Clarity maps cannot be enumerated: the contract can say whether an address is
 * registered and how many are, but not who they are. The list therefore comes
 * from the chain's transaction history (every successful `register-dao` call),
 * and each entry's live record (name, streams, status) is then read back from
 * the contract, so nothing shown here comes from us.
 *
 * Server-only: it pages through the Hiro API and makes read-only calls.
 */

import {
  getDao,
  getDaoCount,
  getNetwork,
  getStreamNonce,
  HIRO_API_BASE,
  STREAM_FACTORY_CONTRACT,
} from "./openclaw-server";

/** One organisation, as shown on /organisations and returned by /api/organisations. */
export interface Organisation {
  name: string;
  admin: string;
  isActive: boolean;
  /** Streams the organisation has linked to its workspace via `track-stream`. */
  streamsTracked: number;
  registeredAtBlock: number;
  /** ISO time of the Bitcoin block that anchored the registration, if known. */
  registeredAt: string | null;
  registrationTxId: string;
}

export interface OrganisationDirectory {
  network: "mainnet" | "testnet";
  /** `get-dao-count`, the authoritative total. */
  total: number;
  /**
   * Every stream ever opened on mainnet (`get-stream-nonce`), by anyone, whether
   * or not an organisation sent it. Distinct from the streams organisations
   * have linked, which is the sum of `streamsTracked`.
   */
  streamsCreated: number;
  /** Newest first. */
  organisations: Organisation[];
  /**
   * Registrations the count includes but the history scan could not list, for
   * example a `register-dao` reached through another contract. Shown, never hidden.
   */
  unlisted: number;
  asOf: string;
}

// ============================================================================
// Parsing (pure, unit-tested)
// ============================================================================

/** The fields this module reads from a Hiro `/transactions` row. */
export interface HiroTxRow {
  tx_id?: string;
  tx_type?: string;
  tx_status?: string;
  sender_address?: string;
  block_height?: number;
  burn_block_time_iso?: string;
  contract_call?: { contract_id?: string; function_name?: string };
}

export interface Registration {
  admin: string;
  txId: string;
  blockHeight: number;
  registeredAt: string | null;
}

/**
 * Pick the successful `register-dao` calls on the factory out of a page of
 * transactions. Failed calls (a duplicate name, an address that already
 * registered) are dropped because they registered nothing. An admin can only
 * register once, but if the history ever showed two, the earliest is the real one.
 */
export function parseRegistrations(
  rows: readonly HiroTxRow[],
  factoryContract: string
): Registration[] {
  const byAdmin = new Map<string, Registration>();
  for (const row of rows) {
    if (row.tx_type !== "contract_call" || row.tx_status !== "success") continue;
    if (row.contract_call?.contract_id !== factoryContract) continue;
    if (row.contract_call.function_name !== "register-dao") continue;
    if (!row.sender_address || !row.tx_id || typeof row.block_height !== "number") continue;

    const registration: Registration = {
      admin: row.sender_address,
      txId: row.tx_id,
      blockHeight: row.block_height,
      registeredAt: row.burn_block_time_iso ?? null,
    };
    const existing = byAdmin.get(registration.admin);
    if (!existing || registration.blockHeight < existing.blockHeight) {
      byAdmin.set(registration.admin, registration);
    }
  }
  return [...byAdmin.values()].sort((a, b) => b.blockHeight - a.blockHeight);
}

/** Two-letter monogram for an organisation's avatar. */
export function organisationInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters =
    words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[1]][0]];
  return letters.join("").toUpperCase();
}

/** Explorer link for a transaction on the network the app runs on. */
export function explorerTxUrl(txId: string, network: "mainnet" | "testnet"): string {
  return `https://explorer.hiro.so/txid/${txId}?chain=${network}`;
}

// ============================================================================
// Fetching
// ============================================================================

const PAGE_SIZE = 50;
/** Hard stop on paging, so a slow or misbehaving API cannot loop forever. */
const MAX_PAGES = 40;

async function fetchFactoryTransactions(): Promise<HiroTxRow[]> {
  const rows: HiroTxRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const url =
      `${HIRO_API_BASE}/extended/v1/address/${STREAM_FACTORY_CONTRACT}/transactions` +
      `?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Hiro transactions request failed (${res.status})`);
    const data = (await res.json()) as { total?: number; results?: HiroTxRow[] };
    const results = data.results ?? [];
    rows.push(...results);
    if (results.length < PAGE_SIZE || rows.length >= (data.total ?? 0)) break;
  }
  return rows;
}

/**
 * Registrations change rarely and the page may be shared widely, so the
 * directory is cached per warm instance for a minute, the same policy as
 * /api/stats.
 */
const CACHE_TTL_MS = 60_000;
let cached: { directory: OrganisationDirectory; expires: number } | null = null;

export async function getOrganisationDirectory(): Promise<OrganisationDirectory> {
  if (cached && Date.now() < cached.expires) return cached.directory;

  const [rows, total, streamsCreated] = await Promise.all([
    fetchFactoryTransactions(),
    getDaoCount(),
    getStreamNonce(),
  ]);
  const registrations = parseRegistrations(rows, STREAM_FACTORY_CONTRACT);

  // The contract is the source of truth for each record. A registration whose
  // record is gone (it never should be) is left out rather than shown stale.
  const records = await Promise.all(registrations.map((r) => getDao(r.admin)));
  const organisations: Organisation[] = [];
  registrations.forEach((registration, i) => {
    const record = records[i];
    if (!record) return;
    organisations.push({
      name: record.name,
      admin: record.admin,
      isActive: record.isActive,
      streamsTracked: record.totalStreamsCreated,
      registeredAtBlock: record.createdAtBlock,
      registeredAt: registration.registeredAt,
      registrationTxId: registration.txId,
    });
  });

  const directory: OrganisationDirectory = {
    network: getNetwork(),
    total,
    streamsCreated,
    organisations,
    unlisted: Math.max(0, total - organisations.length),
    asOf: new Date().toISOString(),
  };
  cached = { directory, expires: Date.now() + CACHE_TTL_MS };
  return directory;
}
