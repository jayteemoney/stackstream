import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { PORT } from "./config";
import { bigIntReplacer } from "./utils";
import { errorHandler } from "./middleware/error-handler";

import streamsRouter from "./routes/streams";
import daosRouter from "./routes/daos";
import blocksRouter from "./routes/blocks";
import tokensRouter from "./routes/tokens";
import transactionsRouter from "./routes/transactions";

const app = express();

// Railway terminates TLS at a proxy in front of us, so trust the first hop.
// Without this, express-rate-limit can't read the real client IP from
// X-Forwarded-For and would bucket every request under the proxy's address.
app.set("trust proxy", 1);

// BigInt JSON serialization
app.set("json replacer", bigIntReplacer);

app.use(cors());
app.use(express.json());

// Health check — kept outside the rate limiter so Railway's probe is never throttled
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "stackstream-openclaw" });
});

// Rate limit the API. Every endpoint proxies to Hiro read-only calls, so an
// unthrottled client could burn our upstream quota. 60 requests/min per IP is
// comfortably above normal widget usage while capping abuse.
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
  })
);

// Routes
app.use("/api/streams", streamsRouter);
app.use("/api/daos", daosRouter);
app.use("/api/blocks", blocksRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/tx", transactionsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`StackStream OpenClaw service running on http://localhost:${PORT}`);
});
