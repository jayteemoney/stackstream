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

    const [claimable, streamed, remaining, refundable, currentBlock] =
      await Promise.all([
        getClaimableBalance(id),
        getStreamedAmount(id),
        getRemainingBalance(id),
        getRefundableAmount(id),
        getCurrentBlockHeight(),
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
      depositFormatted: formatTokenAmount(stream.depositAmount),
      claimableFormatted: claimable !== null ? formatTokenAmount(claimable) : null,
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
