const express = require("express");
const router = express.Router();
const { runAgentLoop } = require("../services/aiService");
const { processAssessment } = require("../controllers/assessmentController");

/**
 * POST /api/agent/prompt
 * Main AI Agent decision loop entry point.
 * Receives student input topic, executes bounded tool loop (search_material),
 * and generates grounded 3-question MCQ assessment.
 */
router.post("/prompt", async (req, res, next) => {
  try {
    const input = req.body.prompt || req.body.topic || req.body.query;

    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({
        error: "Prompt or topic is required.",
        status: "invalid_query"
      });
    }

    const outcome = await runAgentLoop(input.trim());

    if (outcome.status === "invalid_query") {
      return res.status(400).json(outcome);
    }

    return res.status(200).json(outcome);
  } catch (error) {
    next(error);
  }
});

// Alias: POST /api/agent also handles prompt submissions
router.post("/", async (req, res, next) => {
  try {
    const input = req.body.prompt || req.body.topic || req.body.query;

    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({
        error: "Prompt or topic is required.",
        status: "invalid_query"
      });
    }

    const outcome = await runAgentLoop(input.trim());
    return res.status(200).json(outcome);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/agent/assess
 * Evaluates student quiz answers deterministically in application code (Tool 2).
 */
router.post("/assess", processAssessment);

module.exports = router;
