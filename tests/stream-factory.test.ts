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
});
