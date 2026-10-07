import { describe, it, expect } from "vitest";

import {
  parseStreamPrefill,
  buildStreamSetupLink,
  hasPrefill,
  MAX_MEMO_LENGTH,
} from "../frontend/src/lib/stream-setup-link";

const BUILDER = "SP1A5M0ZRSNQMF8BNPQPM8WWC5PJ6HJ4GEKFP8W4M";
const TESTNET_BUILDER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const USDA = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token";

describe("parseStreamPrefill", () => {
  it("reads a complete setup link", () => {
    const search = `?token=${USDA}&recipient=${BUILDER}&amount=1250.5&duration=28&unit=days&memo=Milestone%201%20of%203`;
    expect(parseStreamPrefill(search, "mainnet")).toEqual({
      recipient: BUILDER,
      amount: "1250.5",
      durationValue: "28",
      durationUnit: "days",
      memo: "Milestone 1 of 3",
    });
  });

  it("drops a recipient from the other network", () => {
    expect(parseStreamPrefill(`?recipient=${TESTNET_BUILDER}`, "mainnet").recipient).toBeUndefined();
    expect(parseStreamPrefill(`?recipient=${TESTNET_BUILDER}`, "testnet").recipient).toBe(TESTNET_BUILDER);
  });

  it("drops malformed values instead of correcting them", () => {
    const prefill = parseStreamPrefill(
      "?recipient=not-an-address&amount=-5&duration=abc&unit=days",
      "mainnet"
    );
    expect(prefill).toEqual({});
    expect(hasPrefill(prefill)).toBe(false);
  });

  it("rejects a zero amount and amounts in scientific notation", () => {
    expect(parseStreamPrefill("?amount=0", "mainnet").amount).toBeUndefined();
    expect(parseStreamPrefill("?amount=1e9", "mainnet").amount).toBeUndefined();
  });

  it("only takes a duration together with a known unit", () => {
    expect(parseStreamPrefill("?duration=4", "mainnet")).toEqual({});
    expect(parseStreamPrefill("?duration=4&unit=weeks", "mainnet")).toEqual({});
    expect(parseStreamPrefill("?duration=2&unit=months", "mainnet")).toEqual({
      durationValue: "2",
      durationUnit: "months",
    });
  });

  it("refuses an over-long memo and control characters", () => {
    const long = "a".repeat(MAX_MEMO_LENGTH + 1);
    expect(parseStreamPrefill(`?memo=${long}`, "mainnet").memo).toBeUndefined();
    expect(parseStreamPrefill("?memo=line%0Abreak", "mainnet").memo).toBeUndefined();
  });

  it("accepts a contract principal as recipient", () => {
    const gate = `${BUILDER}.milestone-gate`;
    expect(parseStreamPrefill(`?recipient=${gate}`, "mainnet").recipient).toBe(gate);
  });
});

describe("buildStreamSetupLink", () => {
  it("round-trips through the parser", () => {
    const values = {
      token: USDA,
      recipient: BUILDER,
      amount: "500",
      durationValue: "28",
      durationUnit: "days" as const,
      memo: "Milestone 1 of 3: design",
    };
    const link = buildStreamSetupLink("https://stackstream.xyz", values);
    expect(link.startsWith("https://stackstream.xyz/dashboard/create?token=")).toBe(true);
    const { token, ...rest } = values;
    expect(new URL(link).searchParams.get("token")).toBe(token);
    expect(parseStreamPrefill(new URL(link).search, "mainnet")).toEqual(rest);
  });

  it("leaves out empty fields", () => {
    expect(buildStreamSetupLink("https://stackstream.xyz", { recipient: BUILDER })).toBe(
      `https://stackstream.xyz/dashboard/create?recipient=${BUILDER}`
    );
  });
});
