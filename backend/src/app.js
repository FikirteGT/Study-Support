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

// Assessment scoring route (Tool 2: /api/assess and /api/assessment)
app.use("/api/assess", assessmentRoutes);
app.use("/api/assessment", assessmentRoutes);

// Course materials listing
app.get("/api/materials", async (req, res, next) => {
  try {
    const materials = await db.getMaterials();
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

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
};

const handleGetAllStudyPlans = async (req, res, next) => {
  try {
    const plans = await db.getAllPlans();
    res.json(plans);
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

const handleUpdatePlanActivities = async (req, res, next) => {
  try {
    const { activities } = req.body;
    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: "Activities must be an array." });
    }
    const updated = await db.updatePlanActivities(req.params.id, activities);
    if (!updated) {
      return res.status(404).json({ error: "Study plan not found." });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

app.post("/api/study-plans", handleSaveStudyPlan);
app.get("/api/study-plans", handleGetAllStudyPlans);
app.get("/api/study-plans/:id", handleGetStudyPlanById);
app.patch("/api/study-plans/:id/activities", handleUpdatePlanActivities);

app.post("/api/plans", handleSaveStudyPlan);
app.get("/api/plans", handleGetAllStudyPlans);
app.get("/api/plans/:id", handleGetStudyPlanById);
app.patch("/api/plans/:id/activities", handleUpdatePlanActivities);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({
    error: "An unexpected server error occurred.",
  });
});

module.exports = app;
