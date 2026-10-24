require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// CORS_ORIGIN=https://your-app.vercel.app (comma-separated). Unset = allow all (local development).
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(",").map((s) => s.trim()) } : undefined));
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (req, res) => {
  try {
    const status = await db.checkConnection();
    res.json({
      status: "ok",
      database: status.mode,
      connected: status.connected,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ""),
      geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });
  } catch (error) {
    res.status(503).json({ status: "error", message: "Database connection failed." });
  }
});

app.use("/api/agent", require("./routes/agentRoutes"));           // Tool 1 + quiz generation
app.use("/api/materials", require("./routes/materialRoutes"));    // GET /search?query=
app.use("/api/assess", require("./routes/assessmentRoutes"));     // Tool 2 scoring
app.use("/api/plans", require("./routes/studyPlanRoutes"));       // Tool 3 + list + reopen
app.use("/api/study-plans", require("./routes/studyPlanRoutes")); // alias

app.get("/api/materials-list", async (req, res, next) => {
  try { res.json(await db.getMaterials()); } catch (error) { next(error); }
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
