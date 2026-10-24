const { saveStudyPlan } = require("../tools/saveStudyPlan");
const { listRecentPlans, getPlan } = require("../services/studyPlanService");
const { HttpError } = require("../middleware/errorHandler");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/plans
exports.savePlan = async (req, res, next) => {
  try {
    res.status(201).json(await saveStudyPlan(req.body));
  } catch (e) { next(e); }
};

// GET /api/plans -> latest 10 plans
exports.listPlans = async (req, res, next) => {
  try {
    res.json({ plans: await listRecentPlans(10) });
  } catch (e) { next(e); }
};

// GET /api/plans/:id -> full plan for reopening
exports.getPlan = async (req, res, next) => {
  try {
    if (!UUID.test(req.params.id)) throw new HttpError(400, "Invalid plan ID format.");
    const plan = await getPlan(req.params.id);
    if (!plan) throw new HttpError(404, "Study plan not found.");
    res.json({ plan });
  } catch (e) { next(e); }
};
