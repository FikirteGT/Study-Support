
const net = require("net");
if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}

const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    })
  : null;

// In-memory fallback for local testing without Neon.
// Data here is temporary and disappears when the server restarts.
const memoryPlans = new Map();

async function query(text, params = []) {
  if (!pool) {
    throw new Error("Remote database is not configured.");
  }

  return pool.query(text, params);
}

async function getMaterials() {
  if (!pool) {
    return [
      {
        id: "SEC_PY_01",
        section_number: 1,
        title: "Python Lists & Mutability",
        content: "Lists are ordered, mutable collections.",
      },
      {
        id: "SEC_PY_02",
        section_number: 2,
        title: "Python Tuples & Immutability",
        content: "Tuples are ordered, immutable collections.",
      },
      {
        id: "SEC_PY_03",
        section_number: 3,
        title: "Python Dictionaries",
        content: "Dictionaries store key-value pairs.",
      },
    ];
  }

  const result = await query(
    `SELECT id, section_number, title, content, image_url
     FROM materials
     ORDER BY section_number`
  );

  return result.rows;
}

async function insertPlan(planData) {
  const {
    student_id,
    student_name,
    topic,
    score,
    total_questions = 3,
    activities,
    section_references,
  } = planData;

  if (!student_id || !student_name || !topic) {
    throw new Error("Student ID, name, and topic are required.");
  }

  if (
    !Number.isInteger(score) ||
    !Number.isInteger(total_questions) ||
    total_questions < 1 ||
    score < 0 ||
    score > total_questions
  ) {
    throw new Error("Invalid assessment score.");
  }

  if (!Array.isArray(activities) || !Array.isArray(section_references)) {
    throw new Error("Activities and section references must be arrays.");
  }

  if (!pool) {
    const id = require("crypto").randomUUID();

    const plan = {
      id,
      ...planData,
      total_questions,
      created_at: new Date().toISOString(),
    };

    memoryPlans.set(id, plan);
    return plan;
  }

  // Ensure student exists in students table to satisfy foreign key constraint
  await query(
    `INSERT INTO students (id, name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [student_id, student_name]
  ).catch(() => {});

  const result = await query(
    `INSERT INTO study_plans
       (student_id, student_name, topic, score, total_questions,
        activities, section_references)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
     RETURNING *`,
    [
      student_id,
      student_name,
      topic,
      score,
      total_questions,
      JSON.stringify(activities),
      JSON.stringify(section_references),
    ]
  );

  return result.rows[0];
}

async function getPlanById(id) {
  if (!pool) {
    return memoryPlans.get(id) || null;
  }

  const result = await query(
    "SELECT * FROM study_plans WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

async function getAllPlans() {
  if (!pool) {
    return Array.from(memoryPlans.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }

  const result = await query(
    "SELECT * FROM study_plans ORDER BY created_at DESC LIMIT 50"
  );

  return result.rows;
}

async function checkConnection() {
  if (!pool) {
    console.log("Database is not configured.");
    return { connected: false, mode: "memory" };
  }

  try {
    await query("SELECT 1");

    console.log("Database connected successfully!");

    return { connected: true, mode: "neon" };
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  query,
  getMaterials,
  insertPlan,
  getPlanById,
  getAllPlans,
  checkConnection,
  closePool,
};
