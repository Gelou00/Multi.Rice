import express from "express";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
import cors from "cors";
import cookieParser from "cookie-parser";

import { dbConnection } from "./config/db_access.js";
import deviceRouter from "./routers/device.router.js";
import userRouter from "./routers/user.router.js";
import eventRouter from "./routers/event.router.js";
import checkOfflineDevices from "./functions/checkOfflineDevices.js";

/* =========================
   LOAD ENV FIRST (IMPORTANT)
========================= */
const secretPath = fs.existsSync("/etc/secrets/.env")
  ? "/etc/secrets/.env"
  : "./.env";

dotenvConfig({ path: secretPath });

/* =========================
   APP INIT
========================= */
const app = express();

app.use(express.json());
app.use(cookieParser());

/* =========================
   CORS FIX (RENDER SAFE)
========================= */
app.use(
  cors({
    origin: true, // allow all origins (safe for API)
    credentials: true,
  })
);

/* =========================
   ROUTES
========================= */
app.use("/api/device", deviceRouter);
app.use("/api/user", userRouter);
app.use("/api/event", eventRouter);

/* =========================
   HEALTH CHECK (REQUIRED)
========================= */
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is working!" });
});

/* =========================
   BACKGROUND TASK
========================= */
setInterval(checkOfflineDevices, 30000);

/* =========================
   START SERVER (RENDER)
========================= */
const PORT = process.env.PORT || 10000;

dbConnection();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});