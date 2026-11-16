import { describe, it, expect } from "vitest";

import {
  aggregateStreamVolumes,
  collectStreamCreatedEvents,
  fixedPriceForToken,
  parseStreamCreatedEvent,
  priceAssetIdForToken,
  USDA_MAINNET_TOKEN,
  XBTC_MAINNET_TOKEN,
  type HiroContractEvent,
  type StreamCreatedEvent,
} from "../frontend/src/lib/protocol-metrics";

const STREAM_CREATED_HEX =
  "0x0c0000000a0e6465706f7369742d616d6f756e74010000000000000000000000000007a1200f6475726174696f6e2d626c6f636b73010000000000000000000000000000007809656e642d626c6f636b01000000000000000000000000008eaeb1056576656e740d0000000e73747265616d2d637265617465640e726174652d7065722d626c6f636b010000000000000000000ecd8fae906aaa09726563697069656e74051684c72910f352f9aa4390168f59f0becb27da055a0673656e6465720516369dadca25560b8aa63c5a6576c2a432e9ed527b0b73746172742d626c6f636b01000000000000000000000000008eae390973747265616d2d6964010000000000000000000000000000001105746f6b656e0616982f3ec112a5f5928a5c96a914bd733793b896a50a757364612d746f6b656e";

const STREAM_CANCELLED_HEX =
  "0x0c00000006056576656e740d0000001073747265616d2d63616e63656c6c656409726563697069656e74051677305f8b9042f0cdfd27eff8a667f7c9e9e2171010726563697069656e742d616d6f756e7401000000000000000000000000000017f60673656e6465720516545a03f8cd6f47a175b5ed44738c2da468c890740d73656e6465722d726566756e6401000000000000000000000000000000010973747265616d2d69640100000000000000000000000000000010";

function event(hex: string): HiroContractEvent {
  return {
    event_type: "smart_contract_log",
    contract_log: { value: { hex } },
  };
}

describe("parseStreamCreatedEvent", () => {
  it("decodes a real stream-created event", () => {
    expect(parseStreamCreatedEvent(event(STREAM_CREATED_HEX))).toEqual({
      streamId: 17,
      sender: "SPV9VBEA4NB0Q2N67HD6AXP2MGSEKVAJFE3T8S5R",
      recipient: "SP22CEA8GYD9FKAJ3J0B8YPFGQV5JFPG5B8SYV5VF",
      token: USDA_MAINNET_TOKEN,
      depositAmount: 500_000n,
      startBlock: 9_350_713,
      endBlock: 9_350_833,
      ratePerBlock: 4_166_666_666_666_666n,
    });
  });

  it("ignores other contract events", () => {
    expect(parseStreamCreatedEvent(event(STREAM_CANCELLED_HEX))).toBeNull();
  });

  it("ignores malformed and non-contract-log rows", () => {
    expect(parseStreamCreatedEvent(event("0xzz"))).toBeNull();
    expect(
      parseStreamCreatedEvent({
        event_type: "fungible_token_asset",
        contract_log: { value: { hex: STREAM_CREATED_HEX } },
      })
    ).toBeNull();
  });

  it("deduplicates a stream when pagination overlaps", () => {
    const row = event(STREAM_CREATED_HEX);
    expect(collectStreamCreatedEvents([row, row])).toHaveLength(1);
  });
});

describe("aggregateStreamVolumes", () => {
  it("sums deposits per token and counts streams", () => {
    const base = parseStreamCreatedEvent(event(STREAM_CREATED_HEX));
    if (!base) throw new Error("test fixture did not parse");

    const sbtc = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";
    const events: StreamCreatedEvent[] = [
      base,
      { ...base, streamId: 18, depositAmount: 1_000_000n },
      { ...base, streamId: 19, token: sbtc, depositAmount: 250n },
    ];

    const byToken = aggregateStreamVolumes(events);
    expect(byToken.get(USDA_MAINNET_TOKEN)).toEqual({
      streams: 2,
      rawVolume: 1_500_000n,
    });
    expect(byToken.get(sbtc)).toEqual({ streams: 1, rawVolume: 250n });
  });

  it("returns an empty map when there are no events", () => {
    expect(aggregateStreamVolumes([]).size).toBe(0);
  });
});

describe("price mapping", () => {
  it("pins USDA to one dollar", () => {
    expect(fixedPriceForToken(USDA_MAINNET_TOKEN)).toBe(1);
    expect(fixedPriceForToken(XBTC_MAINNET_TOKEN)).toBeNull();
  });

  it("prices xBTC as BTC and other SIP-010s by their Stacks contract id", () => {
    expect(priceAssetIdForToken(XBTC_MAINNET_TOKEN)).toBe("coingecko:bitcoin");
    expect(priceAssetIdForToken(USDA_MAINNET_TOKEN)).toBe(`stacks:${USDA_MAINNET_TOKEN}`);
  });
});
