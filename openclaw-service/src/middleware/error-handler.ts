import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// M-2 (Godbrand0): never forward raw err.message to clients. Internal errors often
// contain absolute file paths, SDK version strings, upstream API URLs, and other
// details an attacker can systematically harvest. Generate an opaque reference ID,
// log the full error server-side, return only the reference to the client.
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const ref = randomUUID();
  console.error(`[ERROR ${ref}] ${err.stack ?? err.message}`);

  if (err.message.includes("fetch")) {
    res.status(502).json({
      error: "Blockchain API unavailable",
      ref,
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    ref,
  });
}
