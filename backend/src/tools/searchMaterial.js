/**
 * Tool 1: search_material(query)  (SRS section 3)
 * Pure application code, no AI. Returns one of:
 *   { status: "matched", matches: [...], halt: false }          -> go on to quiz generation with matches[0]
 *   { status: "clarification_needed", message, options, halt }  -> ask the student which section (FR-1.2)
 *   { status: "out_of_scope", message, halt }                   -> reject the topic (FR-1.3)
 *   { status: "invalid_query", message, halt }                  -> bad input (controller answers HTTP 400)
 * `halt: true` tells the agent loop to stop calling tools and return to State 0.
 */
const { demoMaterials, getSectionById } = require("../data/demoMaterials");

const MAX_QUERY_LENGTH = 200;
const MIN_SCORE = 2;

const CLARIFICATION_MESSAGE =
  "Our course covers three core modules: Section 1 (Variables & Data Structures), Section 2 (Control Flow & Functions), " +
  "and Section 3 (Object-Oriented Programming). Which topic would you like to assess?";
const OUT_OF_SCOPE_MESSAGE = "This topic is outside the available Python course material.";

const words = (list) => new Set(list.split(" "));
// Too broad to pick a section on their own.
const GENERIC = words(
  "python coding code programming program programs cs101 course introduction intro basics basic fundamentals " +
    "concepts topic topics general everything all anything data"
);
const STOP = words(
  "a an the and or of on in to for me my about with quiz test assess assessment help study learn learning want would like need " +
    "please i is are how what do does can you us we it this that some more from by at as be understand understanding explain " +
    "review practice question questions vs versus if then"
);
// Clearly non-Python topics: rejected outright (TC-05).
const OUT_OF_SCOPE_TERMS = words(
  "sql mysql postgres postgresql sqlite nosql mongodb react reactjs angular vue javascript typescript java html css " +
    "node nodejs php ruby golang rust swift kotlin cpp"
);

const tokenize = (text) => String(text).toLowerCase().match(/[a-z0-9_]+/g) || [];

function stem(w) {
  if (w.length <= 3) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + "y";
  if (/(ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (/[^s]s$/.test(w)) return w.slice(0, -1);
  return w;
}
const normalize = (text) => tokenize(text).map(stem).join(" ");

// Pre-compute an index per section: single keywords, phrases, and distinctive title words.
const INDEX = demoMaterials.map((s) => {
  const singles = new Set();
  const phrases = new Set();
  for (const k of s.keywords) {
    const n = normalize(k);
    (n.includes(" ") ? phrases : singles).add(n);
  }
  for (const c of s.key_concepts) {
    const n = normalize(c);
    if (n.includes(" ")) phrases.add(n);
  }
  const titleWords = new Set(
    tokenize(s.title).filter((t) => !GENERIC.has(t) && !STOP.has(t)).map(stem)
  );
  return { section: s, singles, phrases, titleWords };
});

const record = (s, score, matchedTerms, matchedBy) => ({
  id: s.id, number: s.number, title: s.title, content: s.content, score, matchedTerms, matchedBy,
});

const result = (status, extra) => ({ status, halt: status !== "matched", matches: [], ...extra });

/** "Section 2", "module 3", "SEC-PY-101", or just "2" (the answer to the clarification question). */
function sectionReference(query) {
  const q = query.toLowerCase();
  const m =
    q.match(/sec-py-(\d{3})/) ||
    q.match(/\b(?:section|sec|module|part|chapter|option|number|topic)\s*#?\s*(\d+)\b/) ||
    q.match(/^\s*#?(\d+)\s*[.)]?\s*$/);
  if (!m) return null;
  const n = m[1].length === 3 ? Number(m[1]) - 100 : Number(m[1]);
  return n;
}

function searchMaterial(query) {
  if (typeof query !== "string" || !query.trim()) {
    return result("invalid_query", { message: "Please enter a course topic to search for." });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return result("invalid_query", { message: `Topic is too long (maximum ${MAX_QUERY_LENGTH} characters).` });
  }
  const tokens = tokenize(query);
  if (!tokens.length) {
    return result("invalid_query", { message: "Please enter a course topic using letters or numbers." });
  }

  // 1. Direct section choice, e.g. the reply to a clarification question.
  const ref = sectionReference(query);
  if (ref !== null) {
    const s = demoMaterials.find((x) => x.number === ref);
    return s
      ? { status: "matched", halt: false, matches: [record(s, 10, [`section ${ref}`], "section_reference")] }
      : result("out_of_scope", { message: OUT_OF_SCOPE_MESSAGE });
  }

  // 2. Known non-Python topics are rejected before scoring.
  if (tokens.some((t) => OUT_OF_SCOPE_TERMS.has(t))) {
    return result("out_of_scope", { message: OUT_OF_SCOPE_MESSAGE });
  }

  // 3. Broad input (only generic or filler words): ask which section.
  const specific = tokens.filter((t) => !/^\d+$/.test(t) && !GENERIC.has(t) && !STOP.has(t));
  if (!specific.length) {
    return result("clarification_needed", {
      message: CLARIFICATION_MESSAGE,
      options: demoMaterials.map((s) => ({ number: s.number, id: s.id, title: s.title })),
    });
  }

  // 4. Keyword scoring against title, keywords and key concepts.
  const stems = [...new Set(specific.map(stem))];
  const padded = ` ${normalize(query)} `;
  const scored = INDEX.map(({ section, singles, phrases, titleWords }) => {
    let score = 0;
    const terms = [];
    for (const t of stems) {
      if (singles.has(t)) { score += 2; terms.push(t); }
      else if (titleWords.has(t)) { score += 1; terms.push(t); }
    }
    for (const p of phrases) {
      if (padded.includes(` ${p} `)) { score += 3; terms.push(p); }
    }
    return { section, score, terms };
  }).filter((r) => r.score >= MIN_SCORE);

  if (!scored.length) return result("out_of_scope", { message: OUT_OF_SCOPE_MESSAGE });

  scored.sort((a, b) => b.score - a.score || a.section.number - b.section.number);
  const top = scored[0].score;
  const matches = scored
    .filter((r) => r.score >= top / 2)
    .map((r) => record(r.section, r.score, r.terms, "keywords"));
  return { status: "matched", halt: false, matches };
}

/** Declaration for the Gemini function-calling list (agent loop, Tool 1). */
const searchMaterialDeclaration = {
  name: "search_material",
  description: "Search the CS101 Python demo syllabus by topic and return the matching section id and content.",
  parameters: { type: "OBJECT", properties: { query: { type: "STRING", description: "The topic the student wants to assess" } }, required: ["query"] },
};

module.exports = { searchMaterial, searchMaterialDeclaration, getSectionById, CLARIFICATION_MESSAGE, OUT_OF_SCOPE_MESSAGE };
