# Software Requirements Specification (SRS)
## Project 1: AI Study Support Agent (Python Academic Support Tutor)

**Document Version**: 1.0  
**Event**: AI Agent Hackathon  
**Team**: Team 1  
**Project Title**: CS101 Python AI Study Support Agent  
**Role**: Academic Support Tutor  
**Target Syllabus**: Introduction to Python Programming (`CS101`)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional, architectural, and operational requirements for the **AI Study Support Agent**. The system operates as an interactive academic tutor that assesses an undergraduate student on Python programming topics, evaluates their knowledge using a grounded 3-question assessment, calculates results deterministically in application code, formulates a personalized study plan citing syllabus sections, and securely persists the confirmed plan to a remote PostgreSQL database.

### 1.2 Hackathon Constraints & Compliance
* **100% Genuine Free Services**: Zero usage of paid APIs, trials requiring credit cards, or trial credits.
  * **Hosting**: Vercel Hobby Free Tier (Public HTTPS domain, zero cold start).
  * **AI Inference**: Google Gemini API via Google AI Studio (`gemini-1.5-flash`, Free Tier).
  * **Remote Database**: Neon.tech / Supabase (Hosted PostgreSQL, Free Tier).
* **Mandatory Architecture**:
  * Hosted remote database (browser-only localStorage does not qualify).
  * Backend API secrets protection (API keys and database credentials strictly isolated from client bundle).
  * Public HTTPS accessibility testable on any browser or judge device.

---

## 2. Overall Description & Scope Boundary

### 2.1 User Persona
* **Student Profile**: Jordan Lee (`PY-2026-01`), an undergraduate student enrolled in *CS101: Introduction to Python Programming*.
* **Need**: Target self-assessment on specific syllabus concepts, pinpoint misunderstandings, and receive an actionable study plan citing exact course materials.

### 2.2 System Scope
* **In-Scope**:
  * Synthetic demo syllabus containing 3 numbered sections:
    1. `SEC-PY-101`: Variables, Dynamic Typing & Core Data Structures (Lists vs Tuples).
    2. `SEC-PY-102`: Control Flow, Loops & Functions.
    3. `SEC-PY-103`: Object-Oriented Programming (OOP) in Python (`__init__`, `self`, `super()`).
  * Bounded agent decision loop with keyword search over syllabus sections.
  * Interactive clarification loop for broad/ambiguous inputs (e.g. `"Python"` or `"Coding"`).
  * Out-of-scope rejection for non-course topics (e.g. `"SQL"` or `"React"`).
  * Generation of 3 multiple-choice questions (MCQs) grounded exclusively in the matched section.
  * Application-code assessment scoring (pure algorithmic evaluation, zero AI score hallucination).
  * Formulation of 3 actionable study activities referencing relevant section IDs.
  * Explicit user confirmation gate before database insertion.
  * Reopening and viewing previously saved study plans by unique ID from PostgreSQL.
* **Out-of-Scope**:
  * Multi-agent coordination, autonomous background schedulers, or vector databases.
  * User registration and authentication workflows.
  * Integration with external Learning Management Systems (LMS).

---

## 3. The 3 Mandatory Tools Specification

### Tool 1: `search_material`
* **Type**: Information Retrieval / Check
* **Input**: `query: string`
* **Behavior**:
  * Scans demo material against `title`, `keywords`, and `key_concepts`.
  * Returns matched section records including `id`, `number`, `title`, and `content`.
  * If the query is ambiguous, flags `status = "clarification_needed"`.
  * If 0 matches occur, flags `status = "out_of_scope"`.

### Tool 2: `check_assessment`
* **Type**: Pure Application-Code Evaluation
* **Input**: `quizId: string`, `studentAnswers: Record<string, string>`, `questions: QuizQuestion[]`
* **Behavior**:
  * Deterministically loops through submitted answers comparing with `correctAnswer` in JavaScript/TypeScript.
  * Calculates exact integer score ($0$ to $3$) and percentage.
  * Identifies incorrectly answered questions and extracts their corresponding `sectionRef`.
  * Formulates 3 tailored study activities with explicit references to the required syllabus sections.

### Tool 3: `save_study_plan`
* **Type**: Data Persistence / Remote Mutation
* **Input**: `confirmed: boolean`, `studentId: string`, `studentName: string`, `topic: string`, `score: number`, `activities: Activity[]`, `references: string[]`
* **Behavior**:
  * **Confirmation Guard**: Validates `confirmed === true`. If false or missing, throws HTTP 400.
  * Inserts the complete study plan record into remote PostgreSQL (`study_plans` table).
  * Returns `{ success: true, planId: UUID, timestamp: ISOString }`.

---

## 4. Functional Requirements (FR)

### FR-1: Topic Submission & Clarification Loop
* **FR-1.1**: The user shall enter a course topic in the web interface.
* **FR-1.2**: If the user submits a broad topic (e.g., `"Python"` or `"Programming"`), the system must halt quiz generation and request clarification:
  > *"Our course covers three core modules: Section 1 (Variables & Data Structures), Section 2 (Control Flow & Functions), and Section 3 (Object-Oriented Programming). Which topic would you like to assess?"*
* **FR-1.3**: If the user submits an out-of-scope topic (e.g., `"React"` or `"SQL"`), the system must reject the topic and display:
  > *"This topic is outside the available Python course material."*

### FR-2: Material-Grounded Quiz Generation
* **FR-2.1**: When a topic matches one or more course sections, the agent shall generate exactly 3 multiple-choice questions.
* **FR-2.2**: Each question must feature 4 options (`A`, `B`, `C`, `D`), a single correct answer key, and an explicit reference to the matched section ID (`SEC-PY-101`, `SEC-PY-102`, or `SEC-PY-103`).
* **FR-2.3**: Questions and options must be strictly derived from the provided section content.

### FR-3: Deterministic Assessment & Scoring
* **FR-3.1**: The student shall select their answers using interactive radio buttons and submit the quiz.
* **FR-3.2**: Scoring must be calculated strictly in application code. The AI model must NOT be used to generate or guess the score.
* **FR-3.3**: The tool must identify whether the student made errors in specific sections.

### FR-4: Tailored Study Plan Formulation
* **FR-4.1**: The system shall propose exactly three study activities based on the quiz score:
  * **Remedial (Score < 3)**: Prioritize activities addressing the specific missed questions with citations to the relevant sections (e.g., `[Ref: SEC-PY-102]`).
  * **Mastery (Score = 3)**: Propose advanced coding exercises and best practice deep-dives for the matched topic.
* **FR-4.2**: Each activity must contain a title, concise actionable description, and section citation.

### FR-5: User Review & Confirmation Gate
* **FR-5.1**: Before any data is committed to the database, the user must be presented with an interactive Review & Confirmation modal.
* **FR-5.2**: The modal must display the calculated score, the 3 proposed study activities with section reference tags, and an explicit **"Approve & Save Study Plan"** button.
* **FR-5.3**: No database write shall occur without explicit user confirmation (`confirmed === true`).

### FR-6: Persistence & Reopening Saved Records
* **FR-6.1**: Confirmed study plans shall be written to the remote PostgreSQL database.
* **FR-6.2**: The interface must feature a **"Reopen Saved Plans"** feature allowing judges and students to:
  * View a list of recently saved study plans.
  * Load and reopen any study plan by its unique ID.
* **FR-6.3**: Reopening a plan must accurately display the stored student details, topic, score, and the 3 cited activities.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-1 (Zero Cost / Free Services Compliance)**: All operational components must utilize verified zero-cost free plans without credit card enrollment.
* **NFR-2 (Deployment & High Availability)**: The application must be deployed with a public HTTPS link, ensuring zero cold-start delay during judge evaluation.
* **NFR-3 (Security & Secrets Management)**: API keys (`GEMINI_API_KEY`) and database credentials (`DATABASE_URL`) must remain in backend server-side environment variables and never be exposed in client-side code.
* **NFR-4 (Bounded Execution & Safety)**: The agent loop must be strictly bounded to 3 tool calls maximum to eliminate infinite loops and preserve API quota.
* **NFR-5 (Resilience & State Retention)**: If a network or API failure occurs, the user's current topic and selected answers must remain in interface state without requiring total re-entry.

---

## 6. System Architecture & Database Schema

### 6.1 Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│     (Topic Input, Quiz UI, Confirmation Modal, Reopen)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Express API                     │
│   ├── /api/agent        (Clarification, Search, Quiz Gen)   │
│   ├── /api/assess       (Application Code Scoring)          │
│   └── /api/plans        (Confirmation Guard & DB Save)      │
│   └── /api/plans/:id    (Reopen Saved Plans by ID)          │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Tool 1:      │       │ Google       │       │ Tool 3:      │
│ search_      │       │ Gemini API   │       │ save_        │
│ material     │       │ (AI Studio   │       │ study_plan   │
│ (Local JSON) │       │  Free Tier)  │       │ (Remote DB)  │
└──────────────┘       └──────────────┘       └──────┬───────┘
                                                     │
                                                     ▼
                                      ┌────────────────────────┐
                                      │   Remote PostgreSQL    │
                                      │   (Neon / Supabase)    │
                                      └────────────────────────┘
```

### 6.2 PostgreSQL Schema Definition
```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 3,
    activities JSONB NOT NULL,
    section_references JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. Bounded Agent State Machine

```
State 0: IDLE
   │
   ▼
[User Submits Topic]
   │
   ▼
State 1: TOOL 1 (search_material)
   ├── Query is broad ("Python") ──────────► State 1A: Prompt Clarification ──► Return to State 0
   ├── Query is out of scope ("SQL") ──────► State 1B: Return Out of Scope   ──► Return to State 0
   └── Query matches (e.g., SEC-PY-101) ───► State 2: Generate 3 MCQs
                                                        │
                                                        ▼
State 3: Awaiting Student Quiz Submission
   │
   ▼
[Student Submits Answers]
   │
   ▼
State 4: TOOL 2 (check_assessment)
   └── Application code computes score & generates 3 cited activities
                                                        │
                                                        ▼
State 5: Review & Confirmation Modal
   ├── User Cancels ───────────────────────► State 5A: Retain State
   └── User Clicks "Approve & Save" ───────► State 6: TOOL 3 (save_study_plan)
                                                        │
                                                        ▼
                                             State 7: Plan Saved in Postgres
                                             (Available to Reopen by ID)
```

---

## 8. Verification & 5-Case Test Protocol

| Test Case | Category | Input Scenario | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Normal 1** | `"Python list mutability and tuples"` | Matches `SEC-PY-101`. Generates 3 MCQs. User answers 3/3. System generates review activities citing `SEC-PY-101`. Plan confirmed and saved to PostgreSQL. | Pass |
| **TC-02** | **Normal 2** | `"Functions and variable scope"` | Matches `SEC-PY-102`. Generates 3 MCQs. User gets 1/3 correct. Code evaluates score $1/3$ and outputs 3 remedial study activities targeting `SEC-PY-102`. Confirmed and saved. | Pass |
| **TC-03** | **Normal 3 & Reopen** | `"OOP classes and inheritance"` | Matches `SEC-PY-103`. Generates 3 MCQs on `__init__`, `self`, and `super()`. User gets 2/3; confirms plan. User clicks "Reopen Plan" $\rightarrow$ record retrieved by ID from PostgreSQL. | Pass |
| **TC-04** | **Clarification** | `"Python"` *(or "Coding")* | Agent detects broad input; halts quiz generation; prompts: *"Our course has 3 modules: Section 1 (Variables & Data Structures), Section 2 (Functions & Loops), and Section 3 (OOP). Which topic would you like to assess?"* | Pass |
| **TC-05** | **Out of Scope** | `"SQL Joins and Relational Keys"` | Tool 1 finds 0 matches in Python syllabus. Agent outputs: *"This topic is outside the available Python course material."* Halts tool loop cleanly. | Pass |

---

## 9. Hackathon Scoring Rubric Mapping

| Criterion | Points | SRS Section Addressing It |
| :--- | :--- | :--- |
| **Assigned workflow and required features** | 30 | Section 2.2, Section 4 (FR-1 through FR-6) |
| **Agent decisions, tools, and evidence** | 25 | Section 3 (3 Tools), Section 7 (State Machine) |
| **Input validation, confirmation & error handling** | 20 | Section 4 (FR-1.2, FR-1.3, FR-5), Section 5 (NFR-4) |
| **Usability and deployed operation** | 10 | Section 1.2 (Public HTTPS), Section 6.1 (Architecture) |
| **Evaluation and fresh judge input** | 10 | Section 8 (5 Verification Test Cases) |
| **Design explanation and team understanding** | 5 | Section 1.1, Section 6.2 (Postgres Schema), Section 7 |
| **Total Points Available** | **100** | Full Compliance |
