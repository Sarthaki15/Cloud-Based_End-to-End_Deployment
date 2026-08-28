/**
 * server.js — Application (logic) tier
 * ---------------------------------------------------------
 * Exposes a REST API consumed by the React frontend.
 * Talks to Cognito (via JWT verification) for auth and to
 * DynamoDB (data tier) for menu + order persistence.
 * ---------------------------------------------------------
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);

// Basic abuse protection — tune per your traffic profile.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Cafe API listening on port ${PORT}`);
});
