/**
 * AI Agent Service: Gemini API Integration & Grounded Quiz Generation
 * SRS Requirements: §1.2 (AI Studio Free Tier), §3 (Tools), §4 (FR-2.1-2.3), §5 (NFR-4 Bounded Loop)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { searchMaterial, searchMaterialDeclaration, CLARIFICATION_MESSAGE, OUT_OF_SCOPE_MESSAGE } = require("../tools/searchMaterial");
const { sealQuiz } = require("./quizToken");

// Enforce maximum 3 tool calls per execution to eliminate runaway loops (NFR-4)
const MAX_TOOL_CALLS = 3;

// Grounded fallback MCQs strictly derived from demoSections for offline/quota resilience
const GROUNDED_FALLBACK_QUESTIONS = {
  "SEC-PY-101": [
    {
      id: 1,
      question: "Which characteristic correctly distinguishes Python Lists from Tuples?",
      options: [
        "Lists are immutable, while tuples can be modified in-place.",
        "Lists are defined with parentheses (), while tuples use square brackets [].",
        "Lists are mutable sequences, while tuples are immutable once created.",
        "Tuples support .append() and in-place item reassignment, lists do not."
      ],
      correctAnswer: 2,
      explanation: "Lists are mutable sequences supporting in-place modifications like .append(), while tuples are immutable sequences.",
      sectionRef: "SEC-PY-101"
    },
    {
      id: 2,
      question: "What does it mean that Python is a dynamically typed language?",
      options: [
        "Variable types must be declared explicitly before assignment.",
        "Variable types do not need explicit declaration and are determined at runtime.",
        "Variables can only hold primitive numbers and strings.",
        "Variables are permanently locked to their initial data type."
      ],
      correctAnswer: 1,
      explanation: "Dynamic typing means variable types do not need explicit declaration and can be reassigned at runtime.",
      sectionRef: "SEC-PY-101"
    },
    {
      id: 3,
      question: "Which data structure in Python stores key-value pairs where keys must be immutable?",
      options: [
        "Lists ([])",
        "Tuples (())",
        "Dictionaries ({})",
        "Sets (set())"
      ],
      correctAnswer: 2,
      explanation: "Dictionaries store key-value pairs using curly braces {}, and keys must be immutable types like strings or numbers.",
      sectionRef: "SEC-PY-101"
    }
  ],
  "SEC-PY-102": [
    {
      id: 1,
      question: "How are code blocks determined for conditional logic and loops in Python?",
      options: [
        "Enclosing curly braces {}",
        "Strict indentation rather than braces",
        "Explicit begin/end block keywords",
        "Semicolons terminating each line"
      ],
      correctAnswer: 1,
      explanation: "Control flow in Python relies strictly on indentation rather than braces to define code blocks.",
      sectionRef: "SEC-PY-102"
    },
    {
      id: 2,
      question: "What value is returned by a Python function if no return statement is executed?",
      options: [
        "0",
        "False",
        "None",
        "undefined"
      ],
      correctAnswer: 2,
      explanation: "If no return statement is reached, Python functions implicitly return None to the caller.",
      sectionRef: "SEC-PY-102"
    },
    {
      id: 3,
      question: "According to the LEGB rule, where does a variable defined inside a function body belong?",
      options: [
        "Global scope",
        "Built-in scope",
        "Local scope",
        "Module enclosing scope only"
      ],
      correctAnswer: 2,
      explanation: "Variables defined within a function belong to local scope and cannot be accessed outside unless explicitly declared global.",
      sectionRef: "SEC-PY-102"
    }
  ],
  "SEC-PY-103": [
    {
      id: 1,
      question: "Which method serves as the class constructor in Python when instantiating an object?",
      options: [
        "__create__()",
        "__init__()",
        "__new__()",
        "__construct__()"
      ],
      correctAnswer: 1,
      explanation: "The __init__ method serves as the class constructor and is automatically invoked when a new instance is created.",
      sectionRef: "SEC-PY-103"
    },
    {
      id: 2,
      question: "What does the first parameter conventionally named 'self' represent in Python class methods?",
      options: [
        "The parent class definition",
        "The specific instance of the class being operated on",
        "The global module namespace",
        "A static reference to the class constructor"
      ],
      correctAnswer: 1,
      explanation: "The 'self' parameter represents the specific instance being operated on and allows access to instance attributes.",
      sectionRef: "SEC-PY-103"
    },
    {
      id: 3,
      question: "How can a Python child class invoke initialization logic from its parent class?",
      options: [
        "parent.__init__()",
        "super().__init__()",
        "this.base.__init__()",
        "inherit.__init__()"
      ],
      correctAnswer: 1,
      explanation: "The super() function allows child classes to invoke methods from the parent class without duplicating code.",
      sectionRef: "SEC-PY-103"
    }
  ]
};

const getModelName = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

const QUIZ_SYSTEM = `You are an Academic Support Tutor for CS101: Introduction to Python Programming.
1. When the student names a topic, call the search_material tool with it. Never answer from your own knowledge.
2. If the tool result status is not "matched", reply with the single word DONE.
3. If matched, use ONLY the returned section content to write exactly 3 multiple-choice questions with exactly 4 options each, exactly one correct.
Reply with JSON only (no markdown): {"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"one sentence citing the section"}]}`;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") return null;
  return new GoogleGenerativeAI(apiKey.trim());
}

function parseJson(text) {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("Model reply contained no JSON object");
  return JSON.parse(text.slice(a, b + 1));
}

/** Strict validation: no silent repairs. Throws if the model output is not exactly 3 well-formed MCQs. */
function validateQuestions(parsed, sectionId) {
  const qs = parsed && parsed.questions;
  if (!Array.isArray(qs) || qs.length !== 3) throw new Error("Expected exactly 3 questions");
  return qs.map((q, i) => {
    const opts = q && q.options;
    if (!q || typeof q.question !== "string" || !q.question.trim()) throw new Error(`Question ${i + 1} has no text`);
    if (!Array.isArray(opts) || opts.length !== 4 || !opts.every((o) => typeof o === "string" && o.trim())) throw new Error(`Question ${i + 1} needs 4 text options`);
    if (new Set(opts.map((o) => o.trim().toLowerCase())).size !== 4) throw new Error(`Question ${i + 1} has duplicate options`);
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3) throw new Error(`Question ${i + 1} has an invalid correctAnswer`);
    if (typeof q.explanation !== "string" || !q.explanation.trim()) throw new Error(`Question ${i + 1} has no explanation`);
    return { id: i + 1, question: q.question.trim(), options: opts.map((o) => o.trim()), correctAnswer: q.correctAnswer, explanation: q.explanation.trim(), sectionRef: sectionId };
  });
}

/**
 * Model-driven tool use: Gemini decides to call search_material. If the tool does not return "matched"
 * the loop halts IN CODE (no more model turns), so guardrails cannot be talked around (NFR-4).
 */
async function geminiToolLoop(client, userPrompt, state) {
  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: QUIZ_SYSTEM,
    tools: [{ functionDeclarations: [searchMaterialDeclaration] }],
    generationConfig: { temperature: 0.2 },
  });
  const chat = model.startChat();
  let result = await chat.sendMessage(userPrompt);
  for (let step = 0; step < MAX_TOOL_CALLS; step++) {
    const calls = result.response.functionCalls();
    if (!calls || calls.length === 0) break;
    const replies = [];
    for (const call of calls) {
      if (call.name !== "search_material" || state.toolCalls.length >= MAX_TOOL_CALLS) {
        replies.push({ functionResponse: { name: call.name, response: { error: "Tool unavailable" } } });
        continue;
      }
      const query = String((call.args && call.args.query) || userPrompt);
      const out = searchMaterial(query);
      state.searchResult = out;
      state.toolCalls.push({ tool: "search_material", input: { query }, output: { status: out.status, matchesCount: out.matches.length }, timestamp: new Date().toISOString(), chosenBy: "model" });
      if (out.status !== "matched") return null; // halt
      const m = out.matches[0];
      replies.push({ functionResponse: { name: "search_material", response: { status: "matched", id: m.id, title: m.title, content: m.content } } });
    }
    result = await chat.sendMessage(replies);
  }
  return result.response.text();
}

/** Plain JSON generation for a section (used when the model skipped the tool or the tool loop failed). Retries once. */
async function generateQuizJson(client, section) {
  const prompt = `You are an Academic Support Tutor for CS101: Introduction to Python Programming.
Write exactly 3 multiple-choice questions grounded ONLY in this section. Exactly 4 options each, exactly one correct.
SECTION ${section.id}: ${section.title}\n${section.content}
Reply with JSON only: {"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"one sentence citing the section"}]}`;
  const model = client.getGenerativeModel({ model: getModelName(), generationConfig: { responseMimeType: "application/json", temperature: 0.2 } });
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await model.generateContent(prompt);
      return validateQuestions(parseJson(r.response.text()), section.id);
    } catch (e) { lastError = e; }
  }
  throw lastError;
}

const publicQuestions = (qs) => qs.map(({ id, question, options, sectionRef }) => ({ id, question, options, sectionRef }));

/**
 * Bounded agent loop (max 3 tool calls). The answer key never leaves the server: the response carries an
 * encrypted `quizToken`; pass { exposeAnswerKey: true } only from local test scripts.
 */
async function runAgentLoop(userPrompt, options = {}) {
  const state = { toolCalls: [], searchResult: null };
  const toolCalls = state.toolCalls;

  if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
    return { status: "invalid_query", halt: true, message: "Please enter a course topic to search for.", toolCalls };
  }
  const prompt = userPrompt.trim().slice(0, 200);

  let questions = null;
  let source = "fallback";
  const client = getGeminiClient();

  if (client) {
    try {
      const text = await geminiToolLoop(client, prompt, state);
      if (text && state.searchResult && state.searchResult.status === "matched") {
        questions = validateQuestions(parseJson(text), state.searchResult.matches[0].id);
        source = "gemini";
      }
    } catch (error) {
      console.warn(`[AI Agent] Gemini tool loop failed (${error.message})`);
    }
  }

  // Model skipped or failed before using the tool: enforce Tool 1 in code so the guardrails always run.
  if (!state.searchResult) {
    state.searchResult = searchMaterial(prompt);
    toolCalls.push({ tool: "search_material", input: { query: prompt }, output: { status: state.searchResult.status, matchesCount: state.searchResult.matches.length }, timestamp: new Date().toISOString(), chosenBy: "code" });
  }
  const searchResult = state.searchResult;

  if (searchResult.status === "clarification_needed") {
    return {
      status: "clarification_needed", halt: true, message: searchResult.message || CLARIFICATION_MESSAGE,
      options: searchResult.options || [], toolCalls,
    };
  }
  if (searchResult.status !== "matched" || searchResult.matches.length === 0) {
    return { status: "out_of_scope", halt: true, message: searchResult.message || OUT_OF_SCOPE_MESSAGE, toolCalls };
  }

  const section = searchResult.matches[0];
  if (!questions) {
    try {
      if (!client) throw new Error("no GEMINI_API_KEY");
      questions = await generateQuizJson(client, section);
      source = "gemini";
    } catch (error) {
      console.warn(`[AI Agent] Using grounded question bank for ${section.id} (${error.message})`);
      questions = GROUNDED_FALLBACK_QUESTIONS[section.id];
      source = "fallback";
    }
  }

  const topic = section.matchedBy === "section_reference" ? section.title : prompt;
  const sectionInfo = { id: section.id, number: section.number, title: section.title };
  const response = {
    status: "matched",
    halt: false,
    section: { ...sectionInfo, summary: section.content ? section.content.slice(0, 150) + "..." : "" },
    questions: options.exposeAnswerKey ? questions : publicQuestions(questions),
    quizToken: sealQuiz({ topic, section: sectionInfo, questions }),
    source,
    toolCalls,
  };
  return response;
}

module.exports = { runAgentLoop, validateQuestions, MAX_TOOL_CALLS, GROUNDED_FALLBACK_QUESTIONS };
