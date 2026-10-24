const express = require("express");
const { savePlan, listPlans, getPlan } = require("../controllers/studyPlanController");

const router = express.Router();
router.post("/", savePlan);
router.get("/", listPlans);
router.get("/:id", getPlan);

module.exports = router;
