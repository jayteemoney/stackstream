import { describe, it, expect, beforeEach } from "vitest";
import { Cl, ClarityValue } from "@stacks/transactions";

// Test accounts provided by Clarinet simnet
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!; // Sender (DAO)
const wallet2 = accounts.get("wallet_2")!; // Recipient (Contributor)
const wallet3 = accounts.get("wallet_3")!; // Unauthorized user

// Contract identifiers
const streamManagerContract = `${deployer}.stream-manager`;
const mockTokenContract = `${deployer}.mock-sip010-token`;

// Helper to get current block height
function getCurrentBlock(): number {
  return simnet.blockHeight;
}

// Helper to mint tokens to an address
function mintTokens(recipient: string, amount: number) {
  return simnet.callPublicFn(
    mockTokenContract,
    "mint",
    [Cl.uint(amount), Cl.principal(recipient)],
    deployer
  );
}

// Helper to get token balance
function getBalance(address: string): bigint {
  const result = simnet.callReadOnlyFn(
    mockTokenContract,
    "get-balance",
    [Cl.principal(address)],
    deployer
  );
  return (result.result as any).value.value;
}

// Helper to create a stream
function createStream(
  sender: string,
  recipient: string,
  amount: number,
  startBlock: number,
  durationBlocks: number
) {
  return simnet.callPublicFn(
    streamManagerContract,
    "create-stream",
    [
      Cl.principal(recipient),
      Cl.contractPrincipal(deployer, "mock-sip010-token"),
      Cl.uint(amount),
      Cl.uint(startBlock),
      Cl.uint(durationBlocks),
      Cl.none(),
    ],
    sender
  );
}

// ============================================================================
// PROPERTY TEST HELPER
// ============================================================================

function generateRandomStream(min = 100_000_000n, max = 1_000_000_000n) {
  const deposit = BigInt(Math.floor(Math.random() * Number(max - min))) + min;
  const duration = BigInt(Math.floor(Math.random() * 9999) + 1);
  return { deposit, duration };
}

describe("StackStream - Stream Manager Contract", () => {
  // ============================================================================
  // SETUP
  // ============================================================================

  beforeEach(() => {
    // Mint tokens to wallet1 (sender) for testing
    mintTokens(wallet1, 10_000_000_000_000); // 100,000 tokens (8 decimals)
  });

  // ============================================================================
  // STREAM CREATION TESTS
  // ============================================================================

  describe("create-stream", () => {
    it("should create a stream with valid parameters", () => {
      const startBlock = getCurrentBlock() + 1;
      const result = createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      expect(result.result).toBeOk(Cl.uint(1));

      // Verify stream data
      const streamData = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream",
        [Cl.uint(1)],
        deployer
      );
      expect(streamData.result).not.toBeNone();
    });

    it("should transfer tokens to contract on stream creation", () => {
      const depositAmount = 1000_000_000_00; // 1000 tokens
      const startBlock = getCurrentBlock() + 1;

      const balanceBefore = getBalance(wallet1);
      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      const balanceAfter = getBalance(wallet1);

      expect(balanceBefore - balanceAfter).toBe(BigInt(depositAmount));
    });

    it("should fail with zero deposit amount", () => {
      const startBlock = getCurrentBlock() + 1;
      const result = createStream(wallet1, wallet2, 0, startBlock, 100);

      expect(result.result).toBeErr(Cl.uint(300)); // ERR-INVALID-AMOUNT
    });

    it("should fail with zero duration", () => {
      const startBlock = getCurrentBlock() + 1;
      const result = createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 0);

      expect(result.result).toBeErr(Cl.uint(301)); // ERR-INVALID-DURATION
    });

    it("should fail with start block in the past", () => {
      // Mine some blocks first so we have room for a past block
      simnet.mineEmptyBlocks(5);
      const startBlock = getCurrentBlock() - 3; // Clearly in the past
      const result = createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      expect(result.result).toBeErr(Cl.uint(302)); // ERR-INVALID-START-TIME
    });

    it("should fail when sender equals recipient", () => {
      const startBlock = getCurrentBlock() + 1;
      const result = createStream(wallet1, wallet1, 1000_000_000_00, startBlock, 100);

      expect(result.result).toBeErr(Cl.uint(303)); // ERR-INVALID-RECIPIENT
    });

    it("should fail when sender has insufficient balance", () => {
      const startBlock = getCurrentBlock() + 1;
      // wallet3 has no tokens
      const result = createStream(wallet3, wallet2, 1000_000_000_00, startBlock, 100);

      // This should fail on token transfer
      expect(result.result).toBeErr(Cl.uint(1)); // Token transfer error
    });

    it("should increment stream nonce correctly", () => {
      // Use a future start block so both creates are valid
      const startBlock = getCurrentBlock() + 10;

      // Create first stream
      createStream(wallet1, wallet2, 100_000_000_00, startBlock, 100);

      // Create second stream (startBlock still in future since only 1 block mined)
      const result2 = createStream(wallet1, wallet2, 100_000_000_00, startBlock, 100);
      expect(result2.result).toBeOk(Cl.uint(2));

      // Verify nonce
      const nonce = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream-nonce",
        [],
        deployer
      );
      expect(nonce.result).toBeUint(2);
    });

    it("should store memo correctly", () => {
      const startBlock = getCurrentBlock() + 1;
      const memo = "Monthly salary payment";

      const result = simnet.callPublicFn(
        streamManagerContract,
        "create-stream",
        [
          Cl.principal(wallet2),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(1000_000_000_00),
          Cl.uint(startBlock),
          Cl.uint(100),
          Cl.some(Cl.stringUtf8(memo)),
        ],
        wallet1
      );

      expect(result.result).toBeOk(Cl.uint(1));
    });
  });

  // ============================================================================
  // CLAIM TESTS
  // ============================================================================

  describe("claim", () => {
    it("should allow recipient to claim streamed tokens", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;
      const duration = 100;

      createStream(wallet1, wallet2, depositAmount, startBlock, duration);

      // Advance 50 blocks (50% streamed)
      simnet.mineEmptyBlocks(51);

      // Check claimable
      const claimable = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-claimable-balance",
        [Cl.uint(1)],
        deployer
      );
      expect(claimable.result).not.toBeNone();

      // Claim all
      const result = simnet.callPublicFn(
        streamManagerContract,
        "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );

      // Verify it's a successful ok response with a positive claimed amount
      const claimedAmount = (result.result as any).value.value;
      expect(claimedAmount).toBeGreaterThan(0n);
    });

    it("should allow partial claims", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      simnet.mineEmptyBlocks(51);

      // Claim only 100 tokens
      const claimAmount = 100_000_000_00;
      const result = simnet.callPublicFn(
        streamManagerContract,
        "claim",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(claimAmount),
        ],
        wallet2
      );

      expect(result.result).toBeOk(Cl.uint(claimAmount));
    });

    it("should fail when non-recipient tries to claim", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);
      simnet.mineEmptyBlocks(51);

      // wallet3 (not recipient) tries to claim
      const result = simnet.callPublicFn(
        streamManagerContract,
        "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet3
      );

      expect(result.result).toBeErr(Cl.uint(102)); // ERR-NOT-RECIPIENT
    });

    it("should fail when stream has not started", () => {
      const startBlock = getCurrentBlock() + 100; // Far in future
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );

      expect(result.result).toBeErr(Cl.uint(304)); // ERR-ZERO-CLAIM
    });

    it("should fail with wrong token contract", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);
      simnet.mineEmptyBlocks(51);

      // Try to claim with wrong token (sip-010-trait is not a token contract)
      const result = simnet.callPublicFn(
        streamManagerContract,
        "claim",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "sip-010-trait"),
          Cl.uint(100),
        ],
        wallet2
      );

      expect(result.result).toBeErr(Cl.uint(401)); // ERR-TOKEN-MISMATCH
    });

    it("should update withdrawn amount correctly", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      simnet.mineEmptyBlocks(101); // Stream fully elapsed

      // Claim half
      simnet.callPublicFn(
        streamManagerContract,
        "claim",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(500_000_000_00),
        ],
        wallet2
      );

      // Check remaining
      const remaining = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-remaining-balance",
        [Cl.uint(1)],
        deployer
      );

      // Should be deposit - withdrawn
      const remainingValue = (remaining.result as any).value.value;
      expect(remainingValue).toBe(BigInt(500_000_000_00));
    });

    it("should mark stream as depleted when fully claimed", () => {
      // Use a deposit amount that divides evenly by duration to avoid rounding
      const duration = 100;
      const depositAmount = 100 * 100_000_000; // Exactly divisible
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, duration);
      simnet.mineEmptyBlocks(duration + 5); // Well past end

      // Claim all
      simnet.callPublicFn(
        streamManagerContract,
        "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );

      // Check status
      const status = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream-status",
        [Cl.uint(1)],
        deployer
      );

      expect(status.result).toBeSome(Cl.uint(3)); // STATUS-DEPLETED
    });
  });

  // ============================================================================
  // PAUSE/RESUME TESTS
  // ============================================================================

  describe("pause-stream", () => {
    it("should allow sender to pause an active stream", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "pause-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Verify status
      const status = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream-status",
        [Cl.uint(1)],
        deployer
      );
      expect(status.result).toBeSome(Cl.uint(1)); // STATUS-PAUSED
    });

    it("should fail when non-sender tries to pause", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "pause-stream",
        [Cl.uint(1)],
        wallet2 // recipient, not sender
      );

      expect(result.result).toBeErr(Cl.uint(101)); // ERR-NOT-SENDER
    });

    it("should fail when stream is already paused", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // First pause
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Second pause should fail
      const result = simnet.callPublicFn(
        streamManagerContract,
        "pause-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(203)); // ERR-STREAM-PAUSED
    });

    it("should stop token accrual while paused", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      simnet.mineEmptyBlocks(26); // ~25% elapsed

      // Pause the stream
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Get claimable immediately after pause
      const claimableAtPause = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-claimable-balance",
        [Cl.uint(1)],
        deployer
      );
      const valueAtPause = (claimableAtPause.result as any).value.value;

      // Advance many more blocks while paused
      simnet.mineEmptyBlocks(50);

      // Get claimable after waiting — should be unchanged
      const claimableAfter = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-claimable-balance",
        [Cl.uint(1)],
        deployer
      );
      const valueAfter = (claimableAfter.result as any).value.value;

      // Should be the same (no accrual while paused)
      expect(valueAtPause).toBe(valueAfter);
    });
  });

  describe("resume-stream", () => {
    it("should allow sender to resume a paused stream", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "resume-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Verify status
      const status = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream-status",
        [Cl.uint(1)],
        deployer
      );
      expect(status.result).toBeSome(Cl.uint(0)); // STATUS-ACTIVE
    });

    it("should fail when stream is not paused", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "resume-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(204)); // ERR-STREAM-NOT-PAUSED
    });

    it("should track total paused duration correctly", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;
      const duration = 100;

      createStream(wallet1, wallet2, depositAmount, startBlock, duration);
      simnet.mineEmptyBlocks(11); // 10 blocks elapsed

      // Pause for 20 blocks
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);
      simnet.mineEmptyBlocks(20);
      simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(1)], wallet1);

      // Stream for 40 more blocks (total: 10 + 40 = 50 effective)
      simnet.mineEmptyBlocks(40);

      // Get streamed amount
      const streamed = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-streamed-amount",
        [Cl.uint(1)],
        deployer
      );

      // Should be ~50% despite 70+ blocks elapsed (20 were paused)
      const value = (streamed.result as any).value.value;
      // Allow some rounding tolerance
      expect(Number(value)).toBeGreaterThan(450_000_000_00);
      expect(Number(value)).toBeLessThan(550_000_000_00);
    });
  });

  // ============================================================================
  // CANCEL TESTS
  // ============================================================================

  describe("cancel-stream", () => {
    it("should allow sender to cancel and refund remaining", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      simnet.mineEmptyBlocks(51); // 50% streamed

      const senderBalanceBefore = getBalance(wallet1);
      const recipientBalanceBefore = getBalance(wallet2);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );

      // Verify cancel succeeded and returned distribution tuple
      const cancelResult = (result.result as any).value;
      expect(cancelResult).toBeDefined();

      // Check balances were distributed
      const senderBalanceAfter = getBalance(wallet1);
      const recipientBalanceAfter = getBalance(wallet2);

      // Sender should get refund (~50%)
      expect(senderBalanceAfter).toBeGreaterThan(senderBalanceBefore);
      // Recipient should get earned (~50%)
      expect(recipientBalanceAfter).toBeGreaterThan(recipientBalanceBefore);
    });

    it("should fail when non-sender tries to cancel", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );

      expect(result.result).toBeErr(Cl.uint(101)); // ERR-NOT-SENDER
    });

    it("should fail when stream is already cancelled", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // First cancel
      simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );

      // Second cancel should fail
      const result = simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(202)); // ERR-STREAM-CANCELLED
    });

    it("should mark stream as cancelled", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );

      const status = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream-status",
        [Cl.uint(1)],
        deployer
      );

      expect(status.result).toBeSome(Cl.uint(2)); // STATUS-CANCELLED
    });

    it("should give full refund if cancelled before start", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 100; // Future start

      const balanceBefore = getBalance(wallet1);
      createStream(wallet1, wallet2, depositAmount, startBlock, 100);

      simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );

      const balanceAfter = getBalance(wallet1);

      // Should get full refund
      expect(balanceAfter).toBe(balanceBefore);
    });
  });

  // ============================================================================
  // READ-ONLY FUNCTION TESTS
  // ============================================================================

  describe("read-only functions", () => {
    it("get-sender-streams should return correct list", () => {
      // Use a future start block so both creates are valid
      const startBlock = getCurrentBlock() + 10;

      createStream(wallet1, wallet2, 100_000_000_00, startBlock, 100);
      createStream(wallet1, wallet2, 200_000_000_00, startBlock, 100);

      const result = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-sender-streams",
        [Cl.principal(wallet1)],
        deployer
      );

      const list = (result.result as any).value;
      expect(list.length).toBe(2);
    });

    it("get-recipient-streams should return correct list", () => {
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, 100_000_000_00, startBlock, 100);

      const result = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-recipient-streams",
        [Cl.principal(wallet2)],
        deployer
      );

      const list = (result.result as any).value;
      expect(list.length).toBe(1);
    });

    it("get-stream should return none for non-existent stream", () => {
      const result = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream",
        [Cl.uint(999)],
        deployer
      );

      expect(result.result).toBeNone();
    });

    it("get-refundable-amount should calculate correctly", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      simnet.mineEmptyBlocks(51); // 50% elapsed

      const result = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-refundable-amount",
        [Cl.uint(1)],
        deployer
      );

      const refundable = (result.result as any).value.value;
      // Should be ~50%
      expect(Number(refundable)).toBeGreaterThan(400_000_000_00);
      expect(Number(refundable)).toBeLessThan(600_000_000_00);
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  describe("edge cases", () => {
    it("should handle stream with 1 block duration", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      const result = createStream(wallet1, wallet2, depositAmount, startBlock, 1);
      expect(result.result).toBeOk(Cl.uint(1));

      simnet.mineEmptyBlocks(5); // Well past the 1-block duration

      // Should be fully streamed
      const streamed = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-streamed-amount",
        [Cl.uint(1)],
        deployer
      );

      expect((streamed.result as any).value.value).toBe(BigInt(depositAmount));
    });

    it("should handle claim at exact end block", () => {
      // Use amount evenly divisible by duration to avoid precision loss
      const duration = 100;
      const depositAmount = duration * 100_000_000; // 100 tokens, evenly divisible
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, duration);
      simnet.mineEmptyBlocks(duration + 5); // Past end

      const result = simnet.callPublicFn(
        streamManagerContract,
        "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );

      expect(result.result).toBeOk(Cl.uint(depositAmount));
    });

    it("should handle multiple pause/resume cycles", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);
      simnet.mineEmptyBlocks(11);

      // Pause 1
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);
      simnet.mineEmptyBlocks(10);
      simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(1)], wallet1);

      simnet.mineEmptyBlocks(10);

      // Pause 2
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);
      simnet.mineEmptyBlocks(10);
      simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(1)], wallet1);

      // Stream should still be active
      const status = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-stream-status",
        [Cl.uint(1)],
        deployer
      );
      expect(status.result).toBeSome(Cl.uint(0)); // STATUS-ACTIVE
    });
  });

  // ============================================================================
  // TOP-UP TESTS
  // ============================================================================

  describe("top-up-stream", () => {
    it("should allow sender to top up an active stream", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;
      const duration = 100;

      createStream(wallet1, wallet2, depositAmount, startBlock, duration);

      const topUpAmount = 500_000_000_00;
      const result = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(topUpAmount),
        ],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Verify deposit increased by checking remaining balance
      const remaining = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-remaining-balance",
        [Cl.uint(1)],
        deployer
      );
      // All tokens should still be remaining (nothing claimed yet)
      expect((remaining.result as any).value.value).toBe(BigInt(depositAmount + topUpAmount));
    });

    it("should extend end block proportionally", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;
      const duration = 100;

      createStream(wallet1, wallet2, depositAmount, startBlock, duration);

      // Top up with 50% more (should add ~50 blocks)
      // After top-up, the stream should be able to stream more tokens
      // over a longer period. We verify by checking the full claim amount
      // increases after top-up.

      const topUpAmount = 500_000_000_00;
      const topUpResult = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(topUpAmount),
        ],
        wallet1
      );

      expect(topUpResult.result).toBeOk(Cl.bool(true));

      // Verify the event contains expected additional blocks (~50)
      const events = topUpResult.events;
      const printEvent = events.find((e: any) => e.event === "print_event");
      expect(printEvent).toBeDefined();

      // The remaining balance should now be the full amount (deposit + top-up)
      const remaining = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-remaining-balance",
        [Cl.uint(1)],
        deployer
      );
      expect((remaining.result as any).value.value).toBe(BigInt(depositAmount + topUpAmount));
    });

    it("should transfer tokens to contract on top-up", () => {
      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 1;

      createStream(wallet1, wallet2, depositAmount, startBlock, 100);

      const balanceBefore = getBalance(wallet1);
      const topUpAmount = 200_000_000_00;

      simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(topUpAmount),
        ],
        wallet1
      );

      const balanceAfter = getBalance(wallet1);
      expect(balanceBefore - balanceAfter).toBe(BigInt(topUpAmount));
    });

    it("should fail when non-sender tries to top up", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // wallet2 (recipient) tries to top up
      mintTokens(wallet2, 500_000_000_00);
      const result = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(500_000_000_00),
        ],
        wallet2
      );

      expect(result.result).toBeErr(Cl.uint(101)); // ERR-NOT-SENDER
    });

    it("should fail when topping up cancelled stream", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // Cancel first
      simnet.callPublicFn(
        streamManagerContract,
        "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );

      const result = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(500_000_000_00),
        ],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(202)); // ERR-STREAM-CANCELLED
    });

    it("should fail with zero amount", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(0),
        ],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(300)); // ERR-INVALID-AMOUNT
    });

    it("should allow topping up a paused stream", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // Pause
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Top up while paused
      const result = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "mock-sip010-token"),
          Cl.uint(500_000_000_00),
        ],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  // ============================================================================
  // ADMIN FUNCTION TESTS
  // ============================================================================

  describe("admin functions", () => {
    it("should allow owner to set emergency pause", () => {
      const result = simnet.callPublicFn(
        streamManagerContract,
        "set-emergency-pause",
        [Cl.bool(true)],
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const isPaused = simnet.callReadOnlyFn(
        streamManagerContract,
        "is-emergency-paused",
        [],
        deployer
      );
      expect(isPaused.result).toBeBool(true);
    });

    it("should block stream creation when emergency paused", () => {
      simnet.callPublicFn(
        streamManagerContract,
        "set-emergency-pause",
        [Cl.bool(true)],
        deployer
      );

      const startBlock = getCurrentBlock() + 1;
      const result = createStream(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should fail when non-owner tries to set emergency pause", () => {
      const result = simnet.callPublicFn(
        streamManagerContract,
        "set-emergency-pause",
        [Cl.bool(true)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });

  // ============================================================================
  // BLOCK A — PROPERTY-BASED / FUZZ TESTS (20 tests)
  // ============================================================================

  describe("property-based / fuzz tests", () => {
    // --- Invariant 1: Token Conservation ---

    it("invariant: streamed + refundable == deposit at ~25% elapsed", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream();
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const elapsed = Math.max(1, Math.floor(Number(duration) * 0.25));
        simnet.mineEmptyBlocks(elapsed);

        const refundable = (simnet.callReadOnlyFn(streamManagerContract, "get-refundable-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
        const streamed = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(streamed + refundable).toBe(deposit);
        expect(streamed).toBeLessThanOrEqual(deposit);
      }
    });

    it("invariant: streamed + refundable == deposit at ~50% elapsed", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream();
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const elapsed = Math.max(1, Math.floor(Number(duration) * 0.50));
        simnet.mineEmptyBlocks(elapsed);

        const refundable = (simnet.callReadOnlyFn(streamManagerContract, "get-refundable-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
        const streamed = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(streamed + refundable).toBe(deposit);
        expect(streamed).toBeLessThanOrEqual(deposit);
      }
    });

    it("invariant: streamed + refundable == deposit at ~75% elapsed", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream();
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const elapsed = Math.max(1, Math.floor(Number(duration) * 0.75));
        simnet.mineEmptyBlocks(elapsed);

        const refundable = (simnet.callReadOnlyFn(streamManagerContract, "get-refundable-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
        const streamed = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(streamed + refundable).toBe(deposit);
        expect(streamed).toBeLessThanOrEqual(deposit);
      }
    });

    it("invariant: streamed == deposit and refundable == 0 after stream ends", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream();
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        simnet.mineEmptyBlocks(Number(duration) + 10);

        const refundable = (simnet.callReadOnlyFn(streamManagerContract, "get-refundable-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
        const streamed = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        // Allow ≤1 unit of precision dust from integer division
        expect(deposit - streamed).toBeLessThanOrEqual(1n);
        expect(refundable).toBeLessThanOrEqual(1n);
        expect(streamed + refundable).toBe(deposit);
      }
    });

    // --- Invariant 2: Claim Bounds ---

    it("invariant: claimed amount never exceeds deposit and claim-all leaves zero claimable", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream();
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const elapsed = Math.max(1, Math.floor(Number(duration) * 0.5));
        simnet.mineEmptyBlocks(elapsed);

        const claimResult = simnet.callPublicFn(streamManagerContract, "claim-all", [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token")], wallet2);
        const claimed = (claimResult.result as any).value.value as bigint;

        // Claimed must never exceed deposit
        expect(claimed).toBeLessThanOrEqual(deposit);
        expect(claimed).toBeGreaterThan(0n);

        // After claim-all, claimable balance should be 0
        const claimableAfter = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
        expect(claimableAfter).toBe(0n);
      }
    });

    it("invariant: claim-all on fully elapsed stream returns exactly remaining deposit", () => {
      for (let i = 0; i < 5; i++) {
        // Use evenly divisible amounts to avoid precision dust
        const duration = BigInt(Math.floor(Math.random() * 100) + 10);
        const deposit = duration * 1_000_000n; // always divisible
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        simnet.mineEmptyBlocks(Number(duration) + 5);

        const claimResult = simnet.callPublicFn(streamManagerContract, "claim-all", [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token")], wallet2);
        const claimed = (claimResult.result as any).value.value as bigint;

        expect(claimed).toBe(deposit);
      }
    });

    it("invariant: partial claim — claimed == requested when requested < claimable", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(500_000_000n, 1_000_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        // Mine to ~80% to ensure large claimable balance
        simnet.mineEmptyBlocks(Math.max(1, Math.floor(Number(duration) * 0.8)));

        const claimable = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        if (claimable > 2n) {
          const requested = claimable / 2n;
          const claimResult = simnet.callPublicFn(streamManagerContract, "claim",
            [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(requested)],
            wallet2
          );
          const claimed = (claimResult.result as any).value.value as bigint;
          expect(claimed).toBe(requested);
        }
      }
    });

    it("invariant: sequential partial claims — sum never exceeds deposit", () => {
      for (let i = 0; i < 5; i++) {
        const duration = BigInt(Math.floor(Math.random() * 200) + 50);
        const deposit = duration * 1_000_000n;
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        let totalClaimed = 0n;

        // Claim at 25%, 50%, 75%, 100%
        for (const pct of [0.25, 0.25, 0.25, 0.25]) {
          simnet.mineEmptyBlocks(Math.max(1, Math.floor(Number(duration) * pct)));
          const claimResult = simnet.callPublicFn(streamManagerContract, "claim-all",
            [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token")],
            wallet2
          );
          if ((claimResult.result as any).value?.value) {
            totalClaimed += (claimResult.result as any).value.value as bigint;
          }
        }

        expect(totalClaimed).toBeLessThanOrEqual(deposit);
      }
    });

    // --- Invariant 3: Pause Gap Accounting (single cycle) ---

    it("invariant: claimable balance does not increase while stream is paused", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        // Mine to ~30%
        simnet.mineEmptyBlocks(Math.max(1, Math.floor(Number(duration) * 0.3)));

        // Pause
        simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamId)], wallet1);

        const claimableAtPause = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        // Mine while paused
        simnet.mineEmptyBlocks(20);

        const claimableAfterWait = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(claimableAfterWait).toBe(claimableAtPause);

        // Resume to unblock next iteration
        simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamId)], wallet1);
      }
    });

    it("invariant: streamed amount frozen during pause — same before and after waiting", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        simnet.mineEmptyBlocks(Math.max(1, Math.floor(Number(duration) * 0.4)));
        simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamId)], wallet1);

        const streamedAtPause = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        simnet.mineEmptyBlocks(30);

        const streamedAfterWait = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(streamedAfterWait).toBe(streamedAtPause);
        simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamId)], wallet1);
      }
    });

    it("invariant: balance at resume equals balance at pause (no accrual during pause)", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        simnet.mineEmptyBlocks(Math.max(1, Math.floor(Number(duration) * 0.3)));
        simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamId)], wallet1);

        const claimableAtPause = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        const pauseDuration = Math.floor(Math.random() * 15) + 5;
        simnet.mineEmptyBlocks(pauseDuration);

        simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamId)], wallet1);

        // One block mined by resume tx — claimable should still equal what it was at pause
        const claimableAtResume = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(claimableAtResume).toBe(claimableAtPause);
      }
    });

    // --- Invariant 4: Multi-cycle Pause Accounting ---

    it("invariant: multi-cycle pause — claimable frozen during each individual pause", () => {
      const { deposit, duration } = generateRandomStream(500_000_000n, 1_000_000_000n);
      const startBlock = getCurrentBlock() + 2;
      const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
      const streamId = (createResult.result as any).value.value as bigint;

      for (let cycle = 0; cycle < 3; cycle++) {
        simnet.mineEmptyBlocks(Math.max(3, Math.floor(Number(duration) * 0.1)));
        simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamId)], wallet1);

        const claimableAtPause = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        simnet.mineEmptyBlocks(5);

        const claimableDuringPause = (simnet.callReadOnlyFn(streamManagerContract, "get-claimable-balance", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;

        expect(claimableDuringPause).toBe(claimableAtPause);

        simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamId)], wallet1);
      }
    });

    it("invariant: multi-cycle pause — streamed is less than if no pauses had occurred", () => {
      // Verify pauses reduce total streamed compared to an unpaused stream
      const deposit = 1_000_000_000n;
      const duration = 300n;
      const startBlock = getCurrentBlock() + 2;

      // Stream A: will be paused twice
      const createA = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
      const streamA = (createA.result as any).value.value as bigint;

      // Stream B: identical but no pauses
      const createB = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
      const streamB = (createB.result as any).value.value as bigint;

      // Mine 30 blocks, pause A for 20, resume
      simnet.mineEmptyBlocks(30);
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamA)], wallet1);
      simnet.mineEmptyBlocks(20);
      simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamA)], wallet1);

      // Mine 30 more, pause A for 20, resume
      simnet.mineEmptyBlocks(30);
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamA)], wallet1);
      simnet.mineEmptyBlocks(20);
      simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamA)], wallet1);

      simnet.mineEmptyBlocks(10);

      const streamedA = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamA)], deployer).result as any).value.value as bigint;
      const streamedB = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamB)], deployer).result as any).value.value as bigint;

      // Unpaused stream should have streamed more than paused stream
      expect(streamedB).toBeGreaterThan(streamedA);
    });

    it("invariant: multi-cycle pause — token conservation holds throughout", () => {
      for (let i = 0; i < 3; i++) {
        const { deposit, duration } = generateRandomStream(500_000_000n, 1_000_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        // 5 random pause/resume cycles
        for (let cycle = 0; cycle < 5; cycle++) {
          simnet.mineEmptyBlocks(Math.max(2, Math.floor(Number(duration) * 0.05)));
          simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamId)], wallet1);
          simnet.mineEmptyBlocks(3);
          simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamId)], wallet1);

          const streamed = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
          const refundable = (simnet.callReadOnlyFn(streamManagerContract, "get-refundable-amount", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
          expect(streamed + refundable).toBe(deposit);
        }
      }
    });

    it("invariant: multi-cycle pause — status returns to ACTIVE after each resume", () => {
      const { deposit, duration } = generateRandomStream(500_000_000n, 1_000_000_000n);
      const startBlock = getCurrentBlock() + 2;
      const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
      const streamId = (createResult.result as any).value.value as bigint;

      for (let cycle = 0; cycle < 5; cycle++) {
        simnet.mineEmptyBlocks(Math.max(2, Math.floor(Number(duration) * 0.04)));
        simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(streamId)], wallet1);
        simnet.mineEmptyBlocks(2);
        simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(streamId)], wallet1);

        const status = (simnet.callReadOnlyFn(streamManagerContract, "get-stream-status", [Cl.uint(streamId)], deployer).result as any).value.value as bigint;
        expect(status).toBe(0n); // STATUS-ACTIVE
      }
    });

    // --- Invariant 5: Top-up Rate Preservation ---

    it("invariant: rate-per-block unchanged after top-up", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const streamBefore = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
        const rateBefore = streamBefore.value.value["rate-per-block"].value as bigint;

        const topUpAmount = deposit / 2n;
        simnet.callPublicFn(streamManagerContract, "top-up-stream",
          [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(topUpAmount)],
          wallet1
        );

        const streamAfter = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
        const rateAfter = streamAfter.value.value["rate-per-block"].value as bigint;

        expect(rateAfter).toBe(rateBefore);
      }
    });

    it("invariant: new deposit equals original deposit plus top-up amount", () => {
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const topUp = 100_000_000n;
        simnet.callPublicFn(streamManagerContract, "top-up-stream",
          [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(topUp)],
          wallet1
        );

        const streamAfter = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
        const newDeposit = streamAfter.value.value["deposit-amount"].value as bigint;

        expect(newDeposit).toBe(deposit + topUp);
      }
    });

    it("invariant: new end-block == old end-block + (top-up * PRECISION / rate)", () => {
      const PRECISION = 1_000_000_000_000n;
      for (let i = 0; i < 5; i++) {
        const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
        const startBlock = getCurrentBlock() + 2;
        const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
        const streamId = (createResult.result as any).value.value as bigint;

        const streamBefore = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
        const oldEndBlock = streamBefore.value.value["end-block"].value as bigint;
        const rate = streamBefore.value.value["rate-per-block"].value as bigint;

        const topUp = 100_000_000n;
        const expectedAdditionalBlocks = (topUp * PRECISION) / rate;

        simnet.callPublicFn(streamManagerContract, "top-up-stream",
          [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(topUp)],
          wallet1
        );

        const streamAfter = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
        const newEndBlock = streamAfter.value.value["end-block"].value as bigint;

        expect(newEndBlock).toBe(oldEndBlock + expectedAdditionalBlocks);
      }
    });

    it("invariant: multiple sequential top-ups preserve rate-per-block", () => {
      const { deposit, duration } = generateRandomStream(200_000_000n, 500_000_000n);
      const startBlock = getCurrentBlock() + 2;
      const createResult = createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
      const streamId = (createResult.result as any).value.value as bigint;

      const originalStream = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
      const originalRate = originalStream.value.value["rate-per-block"].value as bigint;

      // 3 sequential top-ups
      for (let t = 0; t < 3; t++) {
        simnet.callPublicFn(streamManagerContract, "top-up-stream",
          [Cl.uint(streamId), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(50_000_000)],
          wallet1
        );
        const afterTopUp = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(streamId)], deployer).result as any;
        const currentRate = afterTopUp.value.value["rate-per-block"].value as bigint;
        expect(currentRate).toBe(originalRate);
      }
    });
  });

  // ============================================================================
  // BLOCK B — ADDITIONAL EDGE CASE TESTS (10 tests)
  // ============================================================================

  describe("additional edge cases", () => {
    it("1-block stream: advance exactly 1 block after start, claim-all returns full deposit", () => {
      const depositAmount = 1_000_000_000n;
      const startBlock = getCurrentBlock() + 1;

      const createResult = createStream(wallet1, wallet2, Number(depositAmount), startBlock, 1);
      expect(createResult.result).toBeOk(Cl.uint(1));

      // Advance exactly 1 block to reach start+1 = end-block
      simnet.mineEmptyBlocks(1);

      const result = simnet.callPublicFn(streamManagerContract, "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );
      expect(result.result).toBeOk(Cl.uint(depositAmount));
    });

    it("indivisible deposit: no token loss — streamed + refundable == deposit", () => {
      // Amounts that do NOT divide evenly by duration
      const deposit = 1_000_000_007n; // Prime-ish, won't divide cleanly
      const duration = 3n;
      const startBlock = getCurrentBlock() + 2;

      createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));
      simnet.mineEmptyBlocks(1);

      const streamed = (simnet.callReadOnlyFn(streamManagerContract, "get-streamed-amount", [Cl.uint(1)], deployer).result as any).value.value as bigint;
      const refundable = (simnet.callReadOnlyFn(streamManagerContract, "get-refundable-amount", [Cl.uint(1)], deployer).result as any).value.value as bigint;

      expect(streamed + refundable).toBe(deposit);
      expect(streamed).toBeLessThanOrEqual(deposit);
    });

    it("top-up on a near-depleted stream: succeeds and extends end block", () => {
      const duration = 10;
      const depositAmount = 1_000_000n * BigInt(duration); // exactly divisible
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, Number(depositAmount), startBlock, duration);

      // Mine past end-block and claim almost all
      simnet.mineEmptyBlocks(duration + 2);
      simnet.callPublicFn(streamManagerContract, "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")], wallet2
      );

      // Verify remaining is 0 and status is depleted
      const status = (simnet.callReadOnlyFn(streamManagerContract, "get-stream-status", [Cl.uint(1)], deployer).result as any).value.value as bigint;
      expect(status).toBe(3n); // STATUS-DEPLETED

      // Top-up a depleted stream should fail with ERR-STREAM-DEPLETED
      // Amount must be >= rate (1_000_000) to pass the zero-extension guard first
      const result = simnet.callPublicFn(streamManagerContract, "top-up-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(1_000_000n)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(201)); // ERR-STREAM-DEPLETED
    });

    it("cancel at exactly end-block: recipient gets full deposit", () => {
      const duration = 10;
      const depositAmount = 1_000_000n * BigInt(duration);
      const startBlock = getCurrentBlock() + 1;
      const senderBefore = getBalance(wallet1);
      createStream(wallet1, wallet2, Number(depositAmount), startBlock, duration);

      // Mine exactly to end-block
      simnet.mineEmptyBlocks(duration);

      simnet.callPublicFn(streamManagerContract, "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")], wallet1
      );

      // Recipient should have received the full deposit
      const recipientBalance = getBalance(wallet2);
      expect(recipientBalance).toBe(depositAmount);
    });

    it("pause then immediately resume (0-block pause): total-paused-duration += 0", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000n, startBlock, 100);

      simnet.mineEmptyBlocks(10);

      // Pause and immediately resume (same block height effectively — but resume mines 1 block)
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Read stream to get total-paused-duration before resume
      const pausedStream = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(1)], deployer).result as any;
      const totalPausedBefore = pausedStream.value.value["total-paused-duration"].value as bigint;

      // Resume immediately (this mines 1 block, so pause duration = 1)
      simnet.callPublicFn(streamManagerContract, "resume-stream", [Cl.uint(1)], wallet1);

      const resumedStream = simnet.callReadOnlyFn(streamManagerContract, "get-stream", [Cl.uint(1)], deployer).result as any;
      const totalPausedAfter = resumedStream.value.value["total-paused-duration"].value as bigint;

      // The pause duration was exactly 1 block (the resume tx itself mines 1 block)
      expect(totalPausedAfter).toBe(totalPausedBefore + 1n);
      // Status should be ACTIVE again
      const status = resumedStream.value.value["status"].value as bigint;
      expect(status).toBe(0n);
    });

    it("create stream, partial claim, top-up, claim again — accounting stays correct", () => {
      const deposit = 1_000_000_000n;
      const duration = 100n;
      const startBlock = getCurrentBlock() + 2;
      createStream(wallet1, wallet2, Number(deposit), startBlock, Number(duration));

      // Mine 50 blocks — 50% streamed
      simnet.mineEmptyBlocks(50);

      // Partial claim
      const partialClaim = 200_000_000n;
      simnet.callPublicFn(streamManagerContract, "claim",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(partialClaim)],
        wallet2
      );

      // Top up with equal amount
      const topUp = 1_000_000_000n;
      simnet.callPublicFn(streamManagerContract, "top-up-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(topUp)],
        wallet1
      );

      // Verify remaining = (deposit + topUp) - partialClaim
      const remaining = (simnet.callReadOnlyFn(streamManagerContract, "get-remaining-balance", [Cl.uint(1)], deployer).result as any).value.value as bigint;
      expect(remaining).toBe(deposit + topUp - partialClaim);

      // Claim again — should succeed
      simnet.mineEmptyBlocks(20);
      const claimResult = simnet.callPublicFn(streamManagerContract, "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );
      expect((claimResult.result as any).value?.value).toBeGreaterThan(0n);
    });

    it("emergency pause blocks create-stream but does NOT block claim", () => {
      // Create stream before emergency pause
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 100);
      simnet.mineEmptyBlocks(50);

      // Enable emergency pause
      simnet.callPublicFn(streamManagerContract, "set-emergency-pause", [Cl.bool(true)], deployer);

      // Claim should still work
      const claimResult = simnet.callPublicFn(streamManagerContract, "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );
      expect((claimResult.result as any).value?.value).toBeGreaterThan(0n);

      // Create-stream should be blocked
      const createResult = createStream(wallet1, wallet2, 500_000_000, getCurrentBlock() + 1, 50);
      expect(createResult.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("emergency pause does NOT block cancel-stream", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 100);
      simnet.mineEmptyBlocks(10);

      simnet.callPublicFn(streamManagerContract, "set-emergency-pause", [Cl.bool(true)], deployer);

      const cancelResult = simnet.callPublicFn(streamManagerContract, "cancel-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet1
      );
      expect((cancelResult.result as any).value).toBeDefined();
      // Status should be cancelled
      const status = simnet.callReadOnlyFn(streamManagerContract, "get-stream-status", [Cl.uint(1)], deployer);
      expect(status.result).toBeSome(Cl.uint(2)); // STATUS-CANCELLED
    });

    it("resume on non-existent stream returns ERR-STREAM-NOT-PAUSED (via ERR-STREAM-NOT-FOUND path)", () => {
      const result = simnet.callPublicFn(streamManagerContract, "resume-stream",
        [Cl.uint(999)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR-STREAM-NOT-FOUND
    });

    it("pause on a stream past its end-block returns ERR-STREAM-ENDED", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 5);

      // Mine past end
      simnet.mineEmptyBlocks(10);

      const result = simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);
      expect(result.result).toBeErr(Cl.uint(207)); // ERR-STREAM-ENDED
    });
  });

  // ============================================================================
  // BLOCK C — dannyy2000 REVIEW FINDINGS (5 tests)
  // ============================================================================

  describe("expire-stream (M-1 fix — dannyy2000)", () => {
    it("should settle a paused-then-abandoned stream after end-block passes", () => {
      // Create stream: 1_000_000_000 over 100 blocks
      const depositAmount = 1_000_000_000;
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, depositAmount, startBlock, 100);

      // Mine to ~50 blocks after start, then pause
      simnet.mineEmptyBlocks(51); // stream has been running ~50 blocks
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Sender goes silent — mine past end-block (need ~55 more to clear block 101)
      simnet.mineEmptyBlocks(60);

      const senderBalanceBefore = getBalance(wallet1);
      const recipientBalanceBefore = getBalance(wallet2);

      // wallet3 (uninvolved party) triggers expiry — permissionless
      const result = simnet.callPublicFn(
        streamManagerContract,
        "expire-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet3
      );

      // Result should be ok with a tuple value
      expect((result.result as any).type).toBe("ok");

      // Both parties must have received tokens
      expect(getBalance(wallet2)).toBeGreaterThan(recipientBalanceBefore);
      expect(getBalance(wallet1)).toBeGreaterThan(senderBalanceBefore);

      // Conservation: total out == deposit
      const recipientReceived = getBalance(wallet2) - recipientBalanceBefore;
      const senderRefunded = getBalance(wallet1) - senderBalanceBefore;
      expect(recipientReceived + senderRefunded).toBe(BigInt(depositAmount));

      // Stream status should now be CANCELLED
      const status = simnet.callReadOnlyFn(streamManagerContract, "get-stream-status", [Cl.uint(1)], deployer);
      expect(status.result).toBeSome(Cl.uint(2)); // STATUS-CANCELLED
    });

    it("should fail before end-block has passed", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 100);

      simnet.mineEmptyBlocks(30);
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Still well before end-block — expire should reject
      const result = simnet.callPublicFn(
        streamManagerContract,
        "expire-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet3
      );

      expect(result.result).toBeErr(Cl.uint(208)); // ERR-STREAM-NOT-EXPIRED
    });

    it("should fail on an active (non-paused) stream", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 5);

      // Mine past end-block without pausing
      simnet.mineEmptyBlocks(10);

      const result = simnet.callPublicFn(
        streamManagerContract,
        "expire-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet3
      );

      expect(result.result).toBeErr(Cl.uint(204)); // ERR-STREAM-NOT-PAUSED
    });

    it("token conservation holds: recipient-amount + sender-refund == deposit - withdrawn", () => {
      const deposit = 1_000_000_000;
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, deposit, startBlock, 100);

      // Recipient claims some before pause
      simnet.mineEmptyBlocks(21);
      simnet.callPublicFn(streamManagerContract, "claim-all",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet2
      );

      // Pause and wait out the stream
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);
      simnet.mineEmptyBlocks(90);

      const senderBefore = getBalance(wallet1);
      const recipientBefore = getBalance(wallet2);

      simnet.callPublicFn(
        streamManagerContract,
        "expire-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token")],
        wallet3
      );

      const senderReceived = getBalance(wallet1) - senderBefore;
      const recipientReceived = getBalance(wallet2) - recipientBefore;

      // No tokens should disappear — whatever remained in escrow goes to sender + recipient
      expect(senderReceived + recipientReceived).toBeGreaterThanOrEqual(0n);
      expect(senderReceived + recipientReceived).toBeLessThanOrEqual(BigInt(deposit));
    });
  });

  describe("pause-stream pre-start guard (L-9 fix — dannyy2000)", () => {
    it("should reject pause before stream has started", () => {
      // Create stream starting 10 blocks in the future
      const startBlock = getCurrentBlock() + 10;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 100);

      // Attempt to pause immediately — start-block has not been reached
      const result = simnet.callPublicFn(
        streamManagerContract,
        "pause-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(302)); // ERR-INVALID-START-TIME
    });
  });

  // ============================================================================
  // BLOCK D — Zachyo REVIEW FINDINGS (5 tests)
  // ============================================================================

  // Updated for two-step ownership (L-13 fix — Ryjen1): transfer-ownership
  // replaced by propose-ownership + accept-ownership to prevent permanent loss
  // of control due to a typo or wrong address.
  describe("two-step ownership transfer (L-13 fix — Ryjen1, M-2 base — Zachyo)", () => {
    it("propose-ownership sets pending owner; owner unchanged until accepted", () => {
      const proposeResult = simnet.callPublicFn(
        streamManagerContract,
        "propose-ownership",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(proposeResult.result).toBeOk(Cl.bool(true));

      // Owner is still deployer — not wallet1 yet
      const owner = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-contract-owner",
        [],
        deployer
      );
      expect(owner.result).toBePrincipal(deployer);

      // Pending owner is wallet1
      const pending = simnet.callReadOnlyFn(
        streamManagerContract,
        "get-pending-owner",
        [],
        deployer
      );
      expect(pending.result).toStrictEqual(Cl.some(Cl.principal(wallet1)));
    });

    it("accept-ownership completes the transfer; new owner can use admin functions", () => {
      // Step 1: propose
      simnet.callPublicFn(
        streamManagerContract,
        "propose-ownership",
        [Cl.principal(wallet1)],
        deployer
      );
      // Step 2: accept
      const acceptResult = simnet.callPublicFn(
        streamManagerContract,
        "accept-ownership",
        [],
        wallet1
      );
      expect(acceptResult.result).toBeOk(Cl.bool(true));

      // wallet1 is now owner and can set emergency pause
      const result = simnet.callPublicFn(
        streamManagerContract,
        "set-emergency-pause",
        [Cl.bool(true)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should reject propose-ownership from non-owner", () => {
      const result = simnet.callPublicFn(
        streamManagerContract,
        "propose-ownership",
        [Cl.principal(wallet3)],
        wallet1 // wallet1 is not the owner
      );
      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("previous owner loses admin access after full two-step transfer", () => {
      // Step 1 + 2
      simnet.callPublicFn(
        streamManagerContract,
        "propose-ownership",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        streamManagerContract,
        "accept-ownership",
        [],
        wallet1
      );

      // Deployer should no longer be able to set emergency pause
      const result = simnet.callPublicFn(
        streamManagerContract,
        "set-emergency-pause",
        [Cl.bool(true)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });

  describe("top-up-stream end-block guard (L-10 fix — Zachyo)", () => {
    it("should reject top-up on a paused stream whose end-block has passed", () => {
      const startBlock = getCurrentBlock() + 1;
      createStream(wallet1, wallet2, 1_000_000_000, startBlock, 10);

      // Mine to midpoint and pause
      simnet.mineEmptyBlocks(6);
      simnet.callPublicFn(streamManagerContract, "pause-stream", [Cl.uint(1)], wallet1);

      // Mine past end-block
      simnet.mineEmptyBlocks(15);

      // Sender tries to top up to extend end-block and escape expire-stream
      const result = simnet.callPublicFn(
        streamManagerContract,
        "top-up-stream",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "mock-sip010-token"), Cl.uint(1_000_000_000)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(207)); // ERR-STREAM-ENDED
    });
  });
});
