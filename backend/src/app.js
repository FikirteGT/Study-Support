require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");

// Routes
const agentRoutes = require("./routes/agentRoutes");
const materialRoutes = require("./routes/materialRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check endpoint
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

// AI Agent routes (Tool 1 & Quiz Generation: /api/agent/prompt, /api/agent/assess)
app.use("/api/agent", agentRoutes);

// Material search and syllabus routes (Tool 1: /api/materials/search?query=...)
app.use("/api/materials", materialRoutes);

// Assessment scoring route (Tool 2: /api/assess)
app.use("/api/assess", assessmentRoutes);

// Fallback listing for materials
app.get("/api/materials-list", async (req, res, next) => {
  try {
    const materials = await db.getMaterials();
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

// Tool 3: Study plans persistence (supports both /api/study-plans and /api/plans as per SRS §6.1)
const handleSaveStudyPlan = async (req, res, next) => {
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

const handleGetStudyPlanById = async (req, res, next) => {
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

// Central error handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.message);

  res.status(500).json({
    error: "An unexpected server error occurred.",
    details: err.message
  });
});

module.exports = app;
