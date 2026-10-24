const db = require("../config/db");

const summary = (r) => ({
  id: r.id, student_name: r.student_name, topic: r.topic, score: r.score, total_questions: r.total_questions, created_at: r.created_at,
});

async function listRecentPlans(limit = 10) {
  return (await db.listRecentPlans(limit)).map(summary);
}

const getPlan = (id) => db.getPlanById(id);

module.exports = { listRecentPlans, getPlan };
