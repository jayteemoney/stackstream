import { Router } from "express";
import {
  buildCreateStreamTx,
  buildClaimTx,
  buildClaimAllTx,
  buildPauseStreamTx,
  buildResumeStreamTx,
  buildCancelStreamTx,
  buildTopUpStreamTx,
  buildRegisterDaoTx,
} from "../stacks-client";
import {
  validateBody,
  createStreamBody,
  claimBody,
  claimAllBody,
  pauseResumeBody,
  cancelBody,
  topUpBody,
  registerDaoBody,
} from "../middleware/validate";

const router = Router();

// POST /api/tx/create-stream
router.post(
  "/create-stream",
  validateBody(createStreamBody),
  (req, res) => {
    const tx = buildCreateStreamTx(req.body);
    res.json(tx);
  }
);

// POST /api/tx/claim
router.post("/claim", validateBody(claimBody), (req, res) => {
  const tx = buildClaimTx(req.body);
  res.json(tx);
});

// POST /api/tx/claim-all
router.post("/claim-all", validateBody(claimAllBody), (req, res) => {
  const tx = buildClaimAllTx(req.body);
  res.json(tx);
});

// POST /api/tx/pause
router.post("/pause", validateBody(pauseResumeBody), (req, res) => {
  const tx = buildPauseStreamTx(req.body.streamId);
  res.json(tx);
});

// POST /api/tx/resume
router.post("/resume", validateBody(pauseResumeBody), (req, res) => {
  const tx = buildResumeStreamTx(req.body.streamId);
  res.json(tx);
});

// POST /api/tx/cancel
router.post("/cancel", validateBody(cancelBody), (req, res) => {
  const tx = buildCancelStreamTx(req.body);
  res.json(tx);
});

// POST /api/tx/top-up
router.post("/top-up", validateBody(topUpBody), (req, res) => {
  const tx = buildTopUpStreamTx(req.body);
  res.json(tx);
});

// POST /api/tx/register-dao
router.post("/register-dao", validateBody(registerDaoBody), (req, res) => {
  const tx = buildRegisterDaoTx(req.body.name);
  res.json(tx);
});

export default router;
