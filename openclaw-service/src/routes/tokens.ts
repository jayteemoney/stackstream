import { Router } from "express";
import { getTokenBalance } from "../stacks-client";
import { validateParams, tokenBalanceParams } from "../middleware/validate";
import { formatTokenAmount } from "../utils";

const router = Router();

// GET /api/tokens/:contract/balance/:address — token balance for address
router.get(
  "/:contract/balance/:address",
  validateParams(tokenBalanceParams),
  async (req, res, next) => {
    try {
      const addr = req.params.address as string;
      const contract = req.params.contract as string;
      const balance = await getTokenBalance(addr, contract);
      res.json({
        address: addr,
        tokenContract: contract,
        balance,
        balanceFormatted: formatTokenAmount(balance),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
