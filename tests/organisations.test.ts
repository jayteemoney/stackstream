import { describe, it, expect } from "vitest";

import {
  parseRegistrations,
  organisationInitials,
  explorerTxUrl,
  type HiroTxRow,
} from "../frontend/src/lib/organisations";

const FACTORY = "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-factory";
const GRIMALDO = "SP1A5M0ZRSNQMF8BNPQPM8WWC5PJ6HJ4GEKFP8W4M";
const OTHER = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR";

function registration(overrides: Partial<HiroTxRow> = {}): HiroTxRow {
  return {
    tx_id: "0x0e1d",
    tx_type: "contract_call",
    tx_status: "success",
    sender_address: GRIMALDO,
    block_height: 9_134_238,
    burn_block_time_iso: "2026-10-06T15:33:44.000Z",
    contract_call: { contract_id: FACTORY, function_name: "register-dao" },
    ...overrides,
  };
}

describe("parseRegistrations", () => {
  it("reads a successful register-dao call", () => {
    expect(parseRegistrations([registration()], FACTORY)).toEqual([
      {
        admin: GRIMALDO,
        txId: "0x0e1d",
        blockHeight: 9_134_238,
        registeredAt: "2026-10-06T15:33:44.000Z",
      },
    ]);
  });

  it("ignores failed calls, other functions, other contracts and the deploy", () => {
    const rows: HiroTxRow[] = [
      registration({ tx_status: "abort_by_response" }),
      registration({ contract_call: { contract_id: FACTORY, function_name: "track-stream" } }),
      registration({ contract_call: { contract_id: "SP000.other", function_name: "register-dao" } }),
      { tx_id: "0xdeploy", tx_type: "smart_contract", tx_status: "success", block_height: 1 },
    ];
    expect(parseRegistrations(rows, FACTORY)).toEqual([]);
  });

  it("keeps the earliest registration per admin and lists newest first", () => {
    const rows: HiroTxRow[] = [
      registration({ tx_id: "0xlater", block_height: 9_200_000 }),
      registration({ tx_id: "0xfirst", block_height: 9_134_238 }),
      registration({ tx_id: "0xother", sender_address: OTHER, block_height: 9_150_000 }),
    ];
    const parsed = parseRegistrations(rows, FACTORY);
    expect(parsed.map((r) => r.txId)).toEqual(["0xother", "0xfirst"]);
  });

  it("keeps a registration whose anchor time is not known yet", () => {
    const [parsed] = parseRegistrations([registration({ burn_block_time_iso: undefined })], FACTORY);
    expect(parsed.registeredAt).toBeNull();
  });
});

describe("organisationInitials", () => {
  it("uses the first two letters of a single word, and the first of two words", () => {
    expect(organisationInitials("Grimaldo")).toBe("GR");
    expect(organisationInitials("Zero Authority DAO")).toBe("ZA");
    expect(organisationInitials("  ")).toBe("?");
  });
});

describe("explorerTxUrl", () => {
  it("links to the network the app runs on", () => {
    expect(explorerTxUrl("0xabc", "mainnet")).toBe("https://explorer.hiro.so/txid/0xabc?chain=mainnet");
  });
});
