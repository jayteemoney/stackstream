import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// ============================================================================
// Shared schemas
// ============================================================================

const stxAddress = z
  .string()
  .regex(/^S[A-Z0-9]{38,40}$/, "Invalid Stacks address");

const contractId = z
  .string()
  .regex(/^S[A-Z0-9]{38,40}\.\S+$/, "Invalid contract identifier");

const streamId = z.coerce.number().int().min(0);

const positiveAmount = z
  .string()
  .regex(/^\d+$/, "Amount must be a non-negative integer string")
  .transform((v) => BigInt(v))
  .refine((v) => v > 0n, "Amount must be greater than 0");

// ============================================================================
// Route param schemas
// ============================================================================

export const streamIdParam = z.object({ id: streamId });
export const addressParam = z.object({ address: stxAddress });
export const adminParam = z.object({ admin: stxAddress });
export const tokenBalanceParams = z.object({
  contract: contractId,
  address: stxAddress,
});

// ============================================================================
// Transaction body schemas
// ============================================================================

export const createStreamBody = z.object({
  recipient: stxAddress,
  tokenContract: contractId,
  depositAmount: positiveAmount,
  startBlock: z.number().int().min(0),
  durationBlocks: z.number().int().min(1),
  memo: z.string().max(256).optional(),
  senderAddress: stxAddress,
});

export const claimBody = z.object({
  streamId: z.number().int().min(0),
  tokenContract: contractId,
  amount: positiveAmount,
});

export const claimAllBody = z.object({
  streamId: z.number().int().min(0),
  tokenContract: contractId,
});

export const pauseResumeBody = z.object({
  streamId: z.number().int().min(0),
});

export const cancelBody = z.object({
  streamId: z.number().int().min(0),
  tokenContract: contractId,
});

export const topUpBody = z.object({
  streamId: z.number().int().min(0),
  tokenContract: contractId,
  amount: positiveAmount,
  senderAddress: stxAddress,
});

export const registerDaoBody = z.object({
  name: z.string().min(1).max(50),
});

// ============================================================================
// Validation middleware factory
// ============================================================================

export function validateParams<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid parameters",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.params = result.data;
    next();
  };
}

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
