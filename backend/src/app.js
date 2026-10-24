
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

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

app.get("/api/materials", async (req, res, next) => {
  try {
    const materials = await db.getMaterials();
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

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

// Central error handler.
app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({
    error: "An unexpected server error occurred.",
  });
});

module.exports = app;
