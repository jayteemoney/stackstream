import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

// Test accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!; // DAO admin
const wallet2 = accounts.get("wallet_2")!; // Recipient
const wallet3 = accounts.get("wallet_3")!; // Another DAO / user

// Contract identifiers
const factoryContract = `${deployer}.stream-factory`;
const managerContract = `${deployer}.stream-manager`;
const mockTokenContract = `${deployer}.mock-sip010-token`;

function getCurrentBlock(): number {
  return simnet.blockHeight;
}

function mintTokens(recipient: string, amount: number) {
  return simnet.callPublicFn(
    mockTokenContract,
    "mint",
    [Cl.uint(amount), Cl.principal(recipient)],
    deployer
  );
}

function createStreamDirect(
  sender: string,
  recipient: string,
  amount: number,
  startBlock: number,
  durationBlocks: number
) {
  return simnet.callPublicFn(
    managerContract,
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

describe("StackStream - Stream Factory Contract", () => {
  beforeEach(() => {
    mintTokens(wallet1, 10_000_000_000_000);
    mintTokens(wallet3, 10_000_000_000_000);
  });

  // ============================================================================
  // DAO REGISTRY TESTS
  // ============================================================================

  describe("register-dao", () => {
    it("should register a new DAO", () => {
      const result = simnet.callPublicFn(
        factoryContract,
        "register-dao",
        [Cl.stringUtf8("StacksDAO")],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const dao = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(dao.result).not.toBeNone();
    });

    it("should fail to register duplicate DAO", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);

      const result = simnet.callPublicFn(
        factoryContract,
        "register-dao",
        [Cl.stringUtf8("StacksDAO2")],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(502)); // ERR-DAO-ALREADY-EXISTS
    });

    it("should fail with empty name", () => {
      const result = simnet.callPublicFn(
        factoryContract,
        "register-dao",
        [Cl.stringUtf8("")],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(504)); // ERR-INVALID-NAME
    });

    it("should fail with duplicate name from different admin", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);

      const result = simnet.callPublicFn(
        factoryContract,
        "register-dao",
        [Cl.stringUtf8("StacksDAO")],
        wallet3
      );

      expect(result.result).toBeErr(Cl.uint(504)); // ERR-INVALID-NAME (name taken)
    });

    it("should increment DAO count", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO1")], wallet1);
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO2")], wallet3);

      const count = simnet.callReadOnlyFn(factoryContract, "get-dao-count", [], deployer);
      expect(count.result).toBeUint(2);
    });
  });

  describe("update-dao-name", () => {
    it("should allow DAO admin to update name", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("OldName")], wallet1);

      const result = simnet.callPublicFn(
        factoryContract,
        "update-dao-name",
        [Cl.stringUtf8("NewName")],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Verify new name lookup works
      const dao = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao-by-name",
        [Cl.stringUtf8("NewName")],
        deployer
      );
      expect(dao.result).not.toBeNone();

      // Old name should no longer resolve
      const oldDao = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao-by-name",
        [Cl.stringUtf8("OldName")],
        deployer
      );
      expect(oldDao.result).toBeNone();
    });

    it("should fail for non-registered DAO", () => {
      const result = simnet.callPublicFn(
        factoryContract,
        "update-dao-name",
        [Cl.stringUtf8("NewName")],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(501)); // ERR-DAO-NOT-FOUND
    });
  });

  describe("deactivate-dao", () => {
    it("should deactivate a registered DAO", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);

      const result = simnet.callPublicFn(factoryContract, "deactivate-dao", [], wallet1);
      expect(result.result).toBeOk(Cl.bool(true));

      const isRegistered = simnet.callReadOnlyFn(
        factoryContract,
        "is-registered-dao",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isRegistered.result).toBeBool(false);
    });

    it("should fail for non-registered DAO", () => {
      const result = simnet.callPublicFn(factoryContract, "deactivate-dao", [], wallet1);
      expect(result.result).toBeErr(Cl.uint(501)); // ERR-DAO-NOT-FOUND
    });
  });

  // ============================================================================
  // STREAM TRACKING TESTS
  // ============================================================================

  describe("track-stream", () => {
    it("should track a stream created by the DAO admin", () => {
      // Register as DAO
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      // Create stream directly via stream-manager
      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // Track the stream in the factory
      const result = simnet.callPublicFn(
        factoryContract,
        "track-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Verify tracking
      const isTracked = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(isTracked.result).toBeBool(true);
    });

    it("should update DAO stats when tracking", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      const depositAmount = 1000_000_000_00;
      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, depositAmount, startBlock, 100);

      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(1)], wallet1);

      // Check DAO stats
      const dao = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(dao.result).not.toBeNone();
    });

    it("should fail if not registered as DAO", () => {
      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // wallet1 is not a registered DAO
      const result = simnet.callPublicFn(
        factoryContract,
        "track-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(501)); // ERR-DAO-NOT-FOUND
    });

    it("should fail if caller is not the stream sender", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO1")], wallet1);
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO3")], wallet3);

      // wallet1 creates a stream
      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      // wallet3 (different DAO) tries to track wallet1's stream
      const result = simnet.callPublicFn(
        factoryContract,
        "track-stream",
        [Cl.uint(1)],
        wallet3
      );

      expect(result.result).toBeErr(Cl.uint(503)); // ERR-NOT-DAO-ADMIN
    });

    it("should fail for non-existent stream", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      const result = simnet.callPublicFn(
        factoryContract,
        "track-stream",
        [Cl.uint(999)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(505)); // ERR-STREAM-NOT-FOUND
    });

    it("should fail if stream already tracked", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, 1000_000_000_00, startBlock, 100);

      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(1)], wallet1);

      // Try to track again
      const result = simnet.callPublicFn(
        factoryContract,
        "track-stream",
        [Cl.uint(1)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(506)); // ERR-ALREADY-TRACKED
    });

    it("should track multiple streams", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      const startBlock = getCurrentBlock() + 20;
      createStreamDirect(wallet1, wallet2, 500_000_000_00, startBlock, 100);
      createStreamDirect(wallet1, wallet2, 300_000_000_00, startBlock, 50);

      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(1)], wallet1);
      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(2)], wallet1);

      const tracked1 = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      const tracked2 = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );

      expect(tracked1.result).toBeBool(true);
      expect(tracked2.result).toBeBool(true);
    });
  });

  // ============================================================================
  // READ-ONLY TESTS
  // ============================================================================

  describe("read-only functions", () => {
    it("is-registered-dao should return true for active DAO", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);

      const result = simnet.callReadOnlyFn(
        factoryContract,
        "is-registered-dao",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("is-registered-dao should return false for unregistered address", () => {
      const result = simnet.callReadOnlyFn(
        factoryContract,
        "is-registered-dao",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("get-dao-by-name should resolve registered DAOs", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);

      const result = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao-by-name",
        [Cl.stringUtf8("StacksDAO")],
        deployer
      );
      expect(result.result).not.toBeNone();
    });

    it("get-dao-by-name should return none for unknown name", () => {
      const result = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao-by-name",
        [Cl.stringUtf8("NonExistent")],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("is-stream-tracked should return false for untracked stream", () => {
      const result = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });

  // ============================================================================
  // BLOCK C — ADDITIONAL FACTORY TESTS (8 tests)
  // ============================================================================

  describe("additional factory tests", () => {
    it("register-dao with exactly 64-character name should succeed", () => {
      const maxName = "A".repeat(64); // 64 chars — exactly at the type limit
      const result = simnet.callPublicFn(
        factoryContract,
        "register-dao",
        [Cl.stringUtf8(maxName)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const dao = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao-by-name",
        [Cl.stringUtf8(maxName)],
        deployer
      );
      expect(dao.result).not.toBeNone();
    });

    it("update-dao-name to an already-registered name should fail with ERR-INVALID-NAME", () => {
      // Register two DAOs with different names
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("FirstDAO")], wallet1);
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("SecondDAO")], wallet3);

      // wallet1 tries to rename to "SecondDAO" (already taken by wallet3)
      const result = simnet.callPublicFn(
        factoryContract,
        "update-dao-name",
        [Cl.stringUtf8("SecondDAO")],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(504)); // ERR-INVALID-NAME
    });

    it("track-stream updates total-deposited correctly for multiple streams", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      const startBlock = getCurrentBlock() + 20;
      const deposit1 = 500_000_000_00;
      const deposit2 = 300_000_000_00;
      createStreamDirect(wallet1, wallet2, deposit1, startBlock, 100);
      createStreamDirect(wallet1, wallet2, deposit2, startBlock, 50);

      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(1)], wallet1);
      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(2)], wallet1);

      const dao = simnet.callReadOnlyFn(
        factoryContract,
        "get-dao",
        [Cl.principal(wallet1)],
        deployer
      );
      const totalDeposited = (dao.result as any).value.value["total-deposited"].value as bigint;
      expect(totalDeposited).toBe(BigInt(deposit1 + deposit2));
    });

    it("deactivate-dao preserves stream-tracking data (streams still show as tracked)", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("TestDAO")], wallet1);

      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, 1_000_000_000_00, startBlock, 100);
      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(1)], wallet1);

      // Deactivate DAO
      simnet.callPublicFn(factoryContract, "deactivate-dao", [], wallet1);

      // Stream tracking data should still be queryable
      const isTracked = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(isTracked.result).toBeBool(true);
    });

    it("is-stream-tracked returns false for stream registered by a different DAO", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO1")], wallet1);
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO3")], wallet3);

      const startBlock = getCurrentBlock() + 10;
      createStreamDirect(wallet1, wallet2, 1_000_000_000_00, startBlock, 100);

      // wallet1 (DAO1) tracks their own stream
      simnet.callPublicFn(factoryContract, "track-stream", [Cl.uint(1)], wallet1);

      // wallet3 (DAO3) should NOT show this stream as tracked under their DAO
      const isTrackedByDAO3 = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet3), Cl.uint(1)],
        deployer
      );
      expect(isTrackedByDAO3.result).toBeBool(false);

      // But wallet1 (DAO1) should show it as tracked
      const isTrackedByDAO1 = simnet.callReadOnlyFn(
        factoryContract,
        "is-stream-tracked",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(isTrackedByDAO1.result).toBeBool(true);
    });

    it("get-dao is-active field is false after deactivate-dao", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);

      const beforeDeactivate = simnet.callReadOnlyFn(
        factoryContract, "get-dao", [Cl.principal(wallet1)], deployer
      );
      const isActiveBefore = (beforeDeactivate.result as any).value.value["is-active"].type;
      expect(isActiveBefore).toBe("true"); // SDK represents bool true as { type: "true" }

      simnet.callPublicFn(factoryContract, "deactivate-dao", [], wallet1);

      const afterDeactivate = simnet.callReadOnlyFn(
        factoryContract, "get-dao", [Cl.principal(wallet1)], deployer
      );
      const isActiveAfter = (afterDeactivate.result as any).value.value["is-active"].type;
      expect(isActiveAfter).toBe("false"); // SDK represents bool false as { type: "false" }
    });

    it("register-dao after deactivate-dao returns ERR-DAO-ALREADY-EXISTS (record persists)", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("StacksDAO")], wallet1);
      simnet.callPublicFn(factoryContract, "deactivate-dao", [], wallet1);

      // Attempt to re-register — the map entry still exists, so this should fail
      const result = simnet.callPublicFn(
        factoryContract,
        "register-dao",
        [Cl.stringUtf8("NewName")],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(502)); // ERR-DAO-ALREADY-EXISTS
    });

    it("get-dao-count does not decrease after deactivate-dao", () => {
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO1")], wallet1);
      simnet.callPublicFn(factoryContract, "register-dao", [Cl.stringUtf8("DAO3")], wallet3);

      const countBefore = simnet.callReadOnlyFn(factoryContract, "get-dao-count", [], deployer);
      expect(countBefore.result).toBeUint(2);

      simnet.callPublicFn(factoryContract, "deactivate-dao", [], wallet1);

      const countAfter = simnet.callReadOnlyFn(factoryContract, "get-dao-count", [], deployer);
      expect(countAfter.result).toBeUint(2); // Count unchanged
    });
  });
});
