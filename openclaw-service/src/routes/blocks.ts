import { Router } from "express";
import { getCurrentBlockHeight } from "../stacks-client";

const router = Router();

// GET /api/blocks/current — current Stacks block height
router.get("/current", async (_req, res, next) => {
  try {
    const height = await getCurrentBlockHeight();
    res.json({ blockHeight: height });
  } catch (err) {
    next(err);
  }
});

export default router;
