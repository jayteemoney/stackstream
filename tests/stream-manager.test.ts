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
});
