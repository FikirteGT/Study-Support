require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const assessmentRoutes = require("./routes/assessmentRoutes");
const materialRoutes = require("./routes/materialRoutes");
const agentRoutes = require("./routes/agentRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", async (req, res) => {
  try {
    const status = await db.checkConnection();

    res.json({
      status: "ok",
      database: status.mode,
      connected: status.connected,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database connection failed.",
    });
  }
});

// Tool 1: Material search & Course Materials
app.use("/api/materials", materialRoutes);

// AI Agent Prompt loop & Dynamic Assessment Generation
app.use("/api/agent", agentRoutes);

app.get("/api/materials", async (req, res, next) => {
  try {
    const materials = await db.getMaterials();
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

// Tool 2: check_assessment evaluation routes
app.use("/api/assessment", assessmentRoutes);
app.use("/api/assess", assessmentRoutes);

// Tool 3: Study Plans (save, retrieve by ID, list all)
app.post("/api/study-plans", async (req, res, next) => {
  try {
    const {
      confirmed,
      studentId,
      studentName,
      topic,
      score,
      totalQuestions = 3,
      activities,
      references,
    } = req.body;

    // Never save a proposed plan without explicit confirmation.
    if (confirmed !== true) {
      return res.status(400).json({
        error: "Confirmation is required before saving the study plan.",
      });
    }

    const plan = await db.insertPlan({
      student_id: studentId,
      student_name: studentName,
      topic,
      score,
      total_questions: totalQuestions,
      activities,
      section_references: references,
    });

    res.status(201).json({
      message: "Study plan saved successfully.",
      plan,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/study-plans", async (req, res, next) => {
  try {
    const plans = await db.getAllPlans();
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

app.get("/api/study-plans/:id", async (req, res, next) => {
  try {
    const plan = await db.getPlanById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        error: "Study plan not found.",
      });
    }

    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// SRS alias compatibility (/api/plans)
app.post("/api/plans", (req, res, next) => {
  req.url = "/api/study-plans";
  app.handle(req, res, next);
});
app.get("/api/plans", (req, res, next) => {
  req.url = "/api/study-plans";
  app.handle(req, res, next);
});
app.get("/api/plans/:id", (req, res, next) => {
  req.url = `/api/study-plans/${req.params.id}`;
  app.handle(req, res, next);
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({
    error: "An unexpected server error occurred.",
  });
});

module.exports = app;
