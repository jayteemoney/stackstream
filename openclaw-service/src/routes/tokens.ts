import { Router } from "express";
import { getTokenBalance, getTokenDecimals } from "../stacks-client";
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
      // Scale from the token's own decimals, and publish tokenDecimals so a
      // consumer can verify the scale rather than trust it.
      const decimals = await getTokenDecimals(contract);
      res.json({
        address: addr,
        tokenContract: contract,
        tokenDecimals: decimals,
        balance,
        balanceFormatted:
          decimals !== null ? formatTokenAmount(balance, decimals) : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
