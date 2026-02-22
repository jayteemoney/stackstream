import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[ERROR] ${err.message}`);

  if (err.message.includes("fetch")) {
    res.status(502).json({
      error: "Blockchain API unavailable",
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
}
