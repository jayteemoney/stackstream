import { Router } from "express";
import { getDao, getDaoCount } from "../stacks-client";
import { validateParams, adminParam } from "../middleware/validate";

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
      // No `totalDepositedFormatted`.
      //
      // stream-factory increments `total-deposited` by the raw deposit of every
      // tracked stream regardless of token, and the `daos` map has no token key.
      // Summing 1e8-scale sBTC raw units with 1e6-scale USDA raw units yields a
      // number that is not an amount of anything, so there is no correct single
      // rendering. This route previously emitted one at 8 decimals, which was
      // confidently wrong. Fixing it properly needs a contract change; until
      // then consumers get the raw integer plus this flag.
      totalDepositedIsCrossTokenAggregate: true,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
