const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { runAgentLoop } = require('../src/services/aiService');
const { checkAssessment } = require('../src/tools/checkAssessment');
const db = require('../src/config/db');

async function runTestSuite() {
  console.log("=================================================");
  console.log("EXECUTING 5-CASE HACKATHON TEST SUITE (LIVE NEON)");
  console.log("=================================================\n");

  const results = {};

  // Verify DB connection
  const dbStatus = await db.checkConnection();
  console.log(`Database Status: mode=${dbStatus.mode}, connected=${dbStatus.connected}\n`);

  // -----------------------------------------------------------------
  // TC-01: List mutability and tuples (SEC-PY-101) - Score 3/3 Mastery
  // -----------------------------------------------------------------
  console.log(">>> Running TC-01: 'Python list mutability and tuples'...");
  const t1_start = new Date().toISOString();
  const t1_agent = await runAgentLoop("Python list mutability and tuples", { exposeAnswerKey: true });
  const t1_questions = t1_agent.questions;
  const t1_answers = {
    [t1_questions[0].id]: t1_questions[0].correctAnswer,
    [t1_questions[1].id]: t1_questions[1].correctAnswer,
    [t1_questions[2].id]: t1_questions[2].correctAnswer,
  };
  const t1_eval = checkAssessment(t1_answers, t1_questions);
  const t1_saved = await db.insertPlan({
    student_id: "PY-2026-01",
    student_name: "Jordan Lee",
    topic: "Python list mutability and tuples",
    score: t1_eval.score,
    total_questions: 3,
    activities: t1_eval.proposedActivities,
    section_references: [t1_agent.section.id],
  });

  results.TC01 = {
    timestamp: t1_start,
    sectionId: t1_agent.section.id,
    sectionTitle: t1_agent.section.title,
    questionsCount: t1_questions.length,
    score: `${t1_eval.score}/${t1_eval.total}`,
    passed: t1_eval.passed,
    activities: t1_eval.proposedActivities.map(a => a.title),
    dbPlanId: t1_saved.id,
    dbSavedAt: t1_saved.created_at
  };
  console.log("TC-01 Result:", JSON.stringify(results.TC01, null, 2), "\n");

  // -----------------------------------------------------------------
  // TC-02: Functions and variable scope (SEC-PY-102) - Score 1/3 Remedial
  // -----------------------------------------------------------------
  console.log(">>> Running TC-02: 'Functions and variable scope'...");
  const t2_start = new Date().toISOString();
  const t2_agent = await runAgentLoop("Functions and variable scope", { exposeAnswerKey: true });
  const t2_questions = t2_agent.questions;
  // Answer only first question correctly, deliberately miss question 2 and 3
  const t2_answers = {
    [t2_questions[0].id]: t2_questions[0].correctAnswer,
    [t2_questions[1].id]: (t2_questions[1].correctAnswer + 1) % 4,
    [t2_questions[2].id]: (t2_questions[2].correctAnswer + 1) % 4,
  };
  const t2_eval = checkAssessment(t2_answers, t2_questions);
  const t2_saved = await db.insertPlan({
    student_id: "PY-2026-01",
    student_name: "Jordan Lee",
    topic: "Functions and variable scope",
    score: t2_eval.score,
    total_questions: 3,
    activities: t2_eval.proposedActivities,
    section_references: [t2_agent.section.id],
  });

  results.TC02 = {
    timestamp: t2_start,
    sectionId: t2_agent.section.id,
    sectionTitle: t2_agent.section.title,
    questionsCount: t2_questions.length,
    score: `${t2_eval.score}/${t2_eval.total}`,
    mistakes: t2_eval.mistakes,
    activities: t2_eval.proposedActivities.map(a => a.title),
    sectionRefs: t2_eval.proposedActivities.map(a => a.sectionRef),
    dbPlanId: t2_saved.id,
    dbSavedAt: t2_saved.created_at
  };
  console.log("TC-02 Result:", JSON.stringify(results.TC02, null, 2), "\n");

  // -----------------------------------------------------------------
  // TC-03: OOP classes and inheritance (SEC-PY-103) - Save & Reopen by UUID
  // -----------------------------------------------------------------
  console.log(">>> Running TC-03: 'OOP classes and inheritance' & Reopen...");
  const t3_start = new Date().toISOString();
  const t3_agent = await runAgentLoop("OOP classes and inheritance", { exposeAnswerKey: true });
  const t3_questions = t3_agent.questions;
  const t3_answers = {
    [t3_questions[0].id]: t3_questions[0].correctAnswer,
    [t3_questions[1].id]: t3_questions[1].correctAnswer,
    [t3_questions[2].id]: t3_questions[2].correctAnswer,
  };
  const t3_eval = checkAssessment(t3_answers, t3_questions);
  const t3_saved = await db.insertPlan({
    student_id: "PY-2026-01",
    student_name: "Jordan Lee",
    topic: "OOP classes and inheritance",
    score: t3_eval.score,
    total_questions: 3,
    activities: t3_eval.proposedActivities,
    section_references: [t3_agent.section.id],
  });

  // Reopen by UUID from Neon PostgreSQL
  const t3_reopened = await db.getPlanById(t3_saved.id);

  results.TC03 = {
    timestamp: t3_start,
    sectionId: t3_agent.section.id,
    sectionTitle: t3_agent.section.title,
    score: `${t3_eval.score}/${t3_eval.total}`,
    dbPlanId: t3_saved.id,
    reopenedSuccess: Boolean(t3_reopened && t3_reopened.id === t3_saved.id),
    reopenedStudent: t3_reopened.student_name,
    reopenedTopic: t3_reopened.topic,
    reopenedActivitiesCount: Array.isArray(t3_reopened.activities) ? t3_reopened.activities.length : JSON.parse(t3_reopened.activities).length
  };
  console.log("TC-03 Result:", JSON.stringify(results.TC03, null, 2), "\n");

  // -----------------------------------------------------------------
  // TC-04: Ambiguous Topic - Clarification Request
  // -----------------------------------------------------------------
  console.log(">>> Running TC-04: 'Python' (Broad Query)...");
  const t4_start = new Date().toISOString();
  const t4_agent = await runAgentLoop("Python", { exposeAnswerKey: true });

  results.TC04 = {
    timestamp: t4_start,
    status: t4_agent.status,
    halt: t4_agent.halt,
    message: t4_agent.message,
    optionsCount: t4_agent.options?.length,
    options: t4_agent.options
  };
  console.log("TC-04 Result:", JSON.stringify(results.TC04, null, 2), "\n");

  // -----------------------------------------------------------------
  // TC-05: Out-of-Scope Rejection Guardrail
  // -----------------------------------------------------------------
  console.log(">>> Running TC-05: 'SQL Joins and Relational Keys'...");
  const t5_start = new Date().toISOString();
  const t5_agent = await runAgentLoop("SQL Joins and Relational Keys", { exposeAnswerKey: true });

  results.TC05 = {
    timestamp: t5_start,
    status: t5_agent.status,
    halt: t5_agent.halt,
    message: t5_agent.message
  };
  console.log("TC-05 Result:", JSON.stringify(results.TC05, null, 2), "\n");

  await db.closePool();
  console.log("ALL 5 CASES EXECUTED SUCCESSFULLY.");
  return results;
}

runTestSuite().catch(console.error);
