/**
 * Tool 3: save_study_plan. Nothing is written unless the body contains confirmed === true (FR-5.3).
 * Preferred (UI) mode:   { confirmed: true, studentId, studentName, quizToken, studentAnswers }
 *   -> score, activities and references are recomputed on the server, so the client cannot fake them.
 * Direct mode (curl/tests): { confirmed: true, studentId, studentName, topic, score, totalQuestions?, activities[3], sectionReferences[] }
 */
const db = require("../config/db");
const { HttpError } = require("../middleware/errorHandler");
const { scoreQuiz } = require("../services/quizScoring");

const CONFIRMATION_ERROR = "User confirmation is required before saving study plan.";
const SECTION_FINDER = /SEC-PY-10[1-3]/g;
const bad = (m) => new HttpError(400, m);

function text(v, field, max) {
  if (typeof v !== "string" || !v.trim()) throw bad(`${field} is required.`);
  if (v.trim().length > max) throw bad(`${field} must be at most ${max} characters.`);
  return v.trim();
}

function directPlan(b) {
  const total = b.totalQuestions ?? 3;
  if (!Number.isInteger(total) || total < 1 || total > 10) throw bad("totalQuestions must be a whole number between 1 and 10.");
  if (!Number.isInteger(b.score) || b.score < 0 || b.score > total) throw bad(`score must be a whole number from 0 to ${total}.`);
  if (!Array.isArray(b.activities) || b.activities.length !== 3) throw bad("Exactly 3 study activities are required.");
  b.activities.forEach((a, i) => {
    const ok = (typeof a === "string" && a.trim()) || (a && typeof a === "object" && !Array.isArray(a));
    if (!ok || JSON.stringify(a).length > 2000) throw bad(`Activity ${i + 1} is missing or too long.`);
  });
  const refs = Array.isArray(b.sectionReferences) && b.sectionReferences.length
    ? b.sectionReferences.map((r) => (typeof r === "string" ? r.match(SECTION_FINDER)?.[0] : null))
    : [...new Set(JSON.stringify(b.activities).match(SECTION_FINDER) || [])];
  if (!refs.length || refs.some((r) => !r)) throw bad("At least one valid section reference (SEC-PY-101 to SEC-PY-103) is required.");
  return { topic: text(b.topic, "topic", 120), score: b.score, total_questions: total, activities: b.activities, section_references: [...new Set(refs)] };
}

async function saveStudyPlan(body) {
  const b = body && typeof body === "object" ? body : {};
  if (b.confirmed !== true) throw bad(CONFIRMATION_ERROR); // the gate runs before any validation or database work

  let plan;
  if (b.quizToken) {
    const r = scoreQuiz(b.quizToken, b.studentAnswers);
    plan = { topic: r.topic, score: r.score, total_questions: r.total, activities: r.activities, section_references: r.sectionReferences };
  } else {
    plan = directPlan(b);
  }
  const saved = await db.insertPlan({
    student_id: text(b.studentId, "studentId", 40),
    student_name: text(b.studentName, "studentName", 80),
    ...plan,
  });
  return { success: true, planId: saved.id, message: "Study plan successfully saved.", plan: saved };
}

module.exports = { saveStudyPlan, CONFIRMATION_ERROR };
