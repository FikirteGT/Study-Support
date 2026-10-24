/**
 * AI Agent Service: Gemini API Integration & Grounded Quiz Generation
 * SRS Requirements: §1.2 (AI Studio Free Tier), §3 (Tools), §4 (FR-2.1-2.3), §5 (NFR-4 Bounded Loop)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { searchMaterial, searchMaterialDeclaration, CLARIFICATION_MESSAGE, OUT_OF_SCOPE_MESSAGE } = require("../tools/searchMaterial");
const { demoSections, getSectionById } = require("../data/demoMaterials");

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

/**
 * Initializes Google Generative AI client if GEMINI_API_KEY is present in environment.
 * @returns {GoogleGenerativeAI|null}
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey.trim());
}

/**
 * Generates 3 MCQs grounded exclusively in the matched section using Gemini inference.
 * Falls back deterministically to grounded syllabus question bank if API call fails or quota is exceeded.
 *
 * @param {object} section - The matched syllabus section
 * @returns {Promise<Array>} Array of 3 MCQ questions
 */
async function generateGroundedQuiz(section) {
  const client = getGeminiClient();

  if (!client) {
    console.log(`[AI Agent] No GEMINI_API_KEY provided; using grounded syllabus bank for ${section.id}`);
    return GROUNDED_FALLBACK_QUESTIONS[section.id] || GROUNDED_FALLBACK_QUESTIONS["SEC-PY-101"];
  }

  const prompt = `You are an Academic Support Tutor for CS101: Introduction to Python Programming.
Generate exactly 3 multiple-choice questions (MCQs) grounded EXCLUSIVELY in the following syllabus section.
Do not introduce outside programming concepts or information not covered in this section text.

SECTION ID: ${section.id}
SECTION TITLE: ${section.title}
SECTION CONTENT:
${section.content}

STRICT REQUIREMENTS:
1. Generate exactly 3 questions (no more, no less).
2. Each question must provide exactly 4 options.
3. Include the 0-based integer index of the correct answer (0, 1, 2, or 3).
4. Provide a 1-sentence explanation citing the section content.
5. Set "sectionRef" to "${section.id}".
6. Output ONLY a valid JSON object matching the following structure without any markdown backticks:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
      "correctAnswer": 0,
      "explanation": "Why this is correct based on the section text.",
      "sectionRef": "${section.id}"
    }
  ]
}`;

  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ].filter(Boolean);

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === 3) {
        return parsed.questions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
          explanation: q.explanation || `Grounded in ${section.id}`,
          sectionRef: section.id
        }));
      }
    } catch (error) {
      lastError = error;
      // Continue to next candidate model if available
    }
  }

  console.warn(`[AI Agent] Gemini generation failed (${lastError ? lastError.message : "unknown error"}); falling back to grounded question bank`);
  return GROUNDED_FALLBACK_QUESTIONS[section.id] || GROUNDED_FALLBACK_QUESTIONS["SEC-PY-101"];
}

/**
 * Bounded Agent Decision Loop (SRS §7, NFR-4).
 * Executes at most MAX_TOOL_CALLS (3) tool invocations.
 *
 * @param {string} userPrompt - Student topic or clarification answer
 * @returns {Promise<object>} Agent outcome: { status, matches, questions, message, options, toolCalls }
 */
async function runAgentLoop(userPrompt) {
  const toolCalls = [];
  let toolCallCount = 0;

  if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
    return {
      status: "invalid_query",
      halt: true,
      message: "Please enter a course topic to search for.",
      toolCalls
    };
  }

  // Step 1: Tool 1 - search_material
  if (toolCallCount >= MAX_TOOL_CALLS) {
    return {
      status: "halted_quota",
      halt: true,
      message: "Agent tool invocation limit reached (bounded loop protection).",
      toolCalls
    };
  }

  toolCallCount++;
  const searchResult = searchMaterial(userPrompt.trim());
  toolCalls.push({
    tool: "search_material",
    input: { query: userPrompt.trim() },
    output: { status: searchResult.status, matchesCount: searchResult.matches ? searchResult.matches.length : 0 },
    timestamp: new Date().toISOString()
  });

  // State 1A: Prompt Clarification (FR-1.2, TC-04)
  if (searchResult.status === "clarification_needed") {
    return {
      status: "clarification_needed",
      halt: true,
      message: searchResult.message || CLARIFICATION_MESSAGE,
      options: searchResult.options || [
        { number: 1, id: "SEC-PY-101", title: "Variables & Data Structures" },
        { number: 2, id: "SEC-PY-102", title: "Control Flow & Functions" },
        { number: 3, id: "SEC-PY-103", title: "Object-Oriented Programming" }
      ],
      toolCalls
    };
  }

  // State 1B: Out of Scope Guardrail (FR-1.3, TC-05)
  if (searchResult.status === "out_of_scope" || !searchResult.matches || searchResult.matches.length === 0) {
    return {
      status: "out_of_scope",
      halt: true,
      message: searchResult.message || OUT_OF_SCOPE_MESSAGE,
      toolCalls
    };
  }

  // State 2: Generate Grounded 3-MCQ Quiz (FR-2.1-2.3, TC-01 to TC-03)
  const matchedSection = searchResult.matches[0];
  const questions = await generateGroundedQuiz(matchedSection);

  return {
    status: "matched",
    halt: false,
    matches: searchResult.matches,
    section: {
      id: matchedSection.id,
      number: matchedSection.number,
      title: matchedSection.title,
      content: matchedSection.content,
      summary: matchedSection.content ? matchedSection.content.slice(0, 150) + "..." : ""
    },
    questions,
    toolCalls
  };
}

module.exports = {
  runAgentLoop,
  generateGroundedQuiz,
  MAX_TOOL_CALLS,
  GROUNDED_FALLBACK_QUESTIONS
};
