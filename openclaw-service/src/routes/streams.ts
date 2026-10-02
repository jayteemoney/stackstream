import { Router } from "express";
import {
  getStream,
  getStreamStatus,
  getClaimableBalance,
  getStreamedAmount,
  getRemainingBalance,
  getRefundableAmount,
  getSenderStreams,
  getRecipientStreams,
  getStreamNonce,
  getCurrentBlockHeight,
  getTokenDecimals,
  getTokenSymbol,
  tokenDisplayLabel,
} from "../stacks-client";
import { getStreamStatusLabel, formatTokenAmount, getStreamProgress } from "../utils";
import { validateParams, streamIdParam, addressParam } from "../middleware/validate";

const router = Router();

// GET /api/streams/nonce — total streams created
router.get("/nonce", async (_req, res, next) => {
  try {
    const nonce = await getStreamNonce();
    res.json({ totalStreams: nonce });
  } catch (err) {
    next(err);
  }
});

// GET /api/streams/sender/:address — streams where address is sender
router.get(
  "/sender/:address",
  validateParams(addressParam),
  async (req, res, next) => {
    try {
      const addr = req.params.address as string;
      const ids = await getSenderStreams(addr);
      res.json({ address: addr, streamIds: ids, count: ids.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/streams/recipient/:address — streams where address is recipient
router.get(
  "/recipient/:address",
  validateParams(addressParam),
  async (req, res, next) => {
    try {
      const addr = req.params.address as string;
      const ids = await getRecipientStreams(addr);
      res.json({ address: addr, streamIds: ids, count: ids.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/streams/:id — full stream data with computed fields
router.get("/:id", validateParams(streamIdParam), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stream = await getStream(id);
    if (!stream) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }

    const [
      claimable,
      streamed,
      remaining,
      refundable,
      currentBlock,
      decimals,
      symbol,
    ] = await Promise.all([
      getClaimableBalance(id),
      getStreamedAmount(id),
      getRemainingBalance(id),
      getRefundableAmount(id),
      getCurrentBlockHeight(),
      // Read the token's own decimals. Assuming 8 is what made a 1.2 USDA
      // deposit report as "0.012".
      getTokenDecimals(stream.token),
      getTokenSymbol(stream.token),
    ]);

    const progress = getStreamProgress(
      stream.startBlock,
      stream.endBlock,
      currentBlock,
      stream.totalPausedDuration
    );

    res.json({
      streamId: id,
      ...stream,
      statusLabel: getStreamStatusLabel(stream.status),
      claimable,
      streamed,
      remaining,
      refundable,
      currentBlock,
      progress: Math.round(progress * 100) / 100,
      tokenDecimals: decimals,
      // Always a string, and always this token's own label.
      tokenLabel: tokenDisplayLabel(stream.token, symbol),
      tokenSymbol: symbol,
      // null rather than a guess when decimals are unavailable. A consumer that
      // formats these itself has tokenDecimals to work from.
      depositFormatted:
        decimals !== null
          ? formatTokenAmount(stream.depositAmount, decimals)
          : null,
      claimableFormatted:
        decimals !== null && claimable !== null
          ? formatTokenAmount(claimable, decimals)
          : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/streams/:id/status — stream status code + label
router.get(
  "/:id/status",
  validateParams(streamIdParam),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const status = await getStreamStatus(id);
      if (status === null) {
        res.status(404).json({ error: "Stream not found" });
        return;
      }
      res.json({ streamId: id, status, statusLabel: getStreamStatusLabel(status) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
