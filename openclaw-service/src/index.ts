import express from "express";
import cors from "cors";
import { PORT } from "./config";
import { bigIntReplacer } from "./utils";
import { errorHandler } from "./middleware/error-handler";

import streamsRouter from "./routes/streams";
import daosRouter from "./routes/daos";
import blocksRouter from "./routes/blocks";
import tokensRouter from "./routes/tokens";
import transactionsRouter from "./routes/transactions";

const app = express();

// BigInt JSON serialization
app.set("json replacer", bigIntReplacer);

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "stackstream-openclaw" });
});

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
