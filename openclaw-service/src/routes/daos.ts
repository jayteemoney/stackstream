import { Router } from "express";
import { getDao, getDaoCount } from "../stacks-client";
import { validateParams, adminParam } from "../middleware/validate";
import { formatTokenAmount } from "../utils";

const router = Router();

// GET /api/daos/count — total registered DAOs
router.get("/count", async (_req, res, next) => {
  try {
    const count = await getDaoCount();
    res.json({ totalDaos: count });
  } catch (err) {
    next(err);
  }
});

// GET /api/daos/:admin — DAO info by admin address
router.get("/:admin", validateParams(adminParam), async (req, res, next) => {
  try {
    const dao = await getDao(req.params.admin as string);
    if (!dao) {
      res.status(404).json({ error: "DAO not found" });
      return;
    }
    res.json({
      ...dao,
      totalDepositedFormatted: formatTokenAmount(dao.totalDeposited),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
