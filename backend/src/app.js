require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const assessmentRoutes = require("./routes/assessmentRoutes");
const materialRoutes = require("./routes/materialRoutes");

// Routes
const agentRoutes = require("./routes/agentRoutes");
const materialRoutes = require("./routes/materialRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

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
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "")
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

    // Strict Confirmation Guard (FR-5.3, Tool 3)
    if (confirmed !== true) {
      return res.status(400).json({
        error: "Confirmation is required before saving the study plan.",
      });
    }

    const plan = await db.insertPlan({
      student_id: studentId || "PY-2026-01",
      student_name: studentName || "Jordan Lee",
      topic: topic || "Python Syllabus Assessment",
      score: typeof score === "number" ? score : 0,
      total_questions: totalQuestions,
      activities: activities || [],
      section_references: references || [],
    });

    res.status(201).json({
      message: "Study plan saved successfully.",
      planId: plan.id,
      timestamp: plan.created_at || new Date().toISOString(),
      plan,
    });
  } catch (error) {
    next(error);
  }
};

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
};

app.post("/api/study-plans", handleSaveStudyPlan);
app.get("/api/study-plans/:id", handleGetStudyPlanById);

app.post("/api/plans", handleSaveStudyPlan);
app.get("/api/plans/:id", handleGetStudyPlanById);

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
  console.error("[Server Error]", err.message);

  res.status(500).json({
    error: "An unexpected server error occurred.",
    details: err.message
  });
});

module.exports = app;
