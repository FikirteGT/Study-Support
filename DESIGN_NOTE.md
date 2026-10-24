# Final Design Note

**Project**: CS101 Python AI Study Support Agent  
**Team**: Team 1  
**Role**: Academic Support Tutor  
**Date**: 24 October 2026  
**Live Frontend**: [https://study-support-vertex.vercel.app/](https://study-support-vertex.vercel.app/)  
**Live Backend API**: [https://study-support-1.onrender.com](https://study-support-1.onrender.com)  

---

## 1. Main Workflow
1. **Topic Input & Bounded Search**: The student submits a topic (e.g., *"Python list mutability and tuples"*). The agent invokes **`search_material`** against the 3 course syllabus modules.
   * *Broad / Ambiguous query* (e.g., *"Python"* or *"Coding"*): Halts generation and presents a clarification prompt with selectable module chips.
   * *Out-of-Scope query* (e.g., *"SQL"* or *"React"*): Displays a polite rejection guardrail message and halts without database mutations or LLM waste.
2. **Dynamic MCQ Generation**: For matched sections, Google Gemini (Free Tier) generates exactly 3 multiple-choice questions (MCQs) strictly grounded in the matched section's syllabus reading.
3. **Deterministic Application Scoring**: When the student submits answers, the backend executes **`check_assessment`** in pure application code (Node.js/JavaScript), calculating an exact integer score (0–3), identifying missed concepts, and formulating 3 tailored study activities with syllabus references. Zero LLM score hallucination.
4. **Previous-Attempt Comparative Analysis**: The system compares the current score against past attempts for the same topic, calculating the score delta (e.g., `+1 Score Gain (+33%) 📈`), trajectory, and mastery tier (`Mastered ⭐`, `Proficient 📈`, `Needs Practice 🔄`).
5. **Confirmation Guard & Remote Persistence**: Before writing to persistent storage, an explicit confirmation gate verifies student intent. Upon confirmation, **`save_study_plan`** inserts the plan into a hosted remote PostgreSQL database on Neon.
6. **Reopening, Progress Tracking & Completion**: Students can reopen any saved plan by UUID, view interactive score progression SVG charts on the Dashboard, track section mastery progress bars, and check off completed study activities via `PATCH /api/study-plans/:id/activities`.

---

## 2. System Architecture & Secrets Isolation

```text
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (Vercel)                  │
│  - React 18 + Vite SPA (Public HTTPS, Tailwind CSS)         │
│  - Topic Input, Interactive Quiz UI, Confirmation Gate      │
│  - Previous-Attempt Analysis & SVG Progress Trend Charts    │
│  - Activity Completion Checklists & Plan Reopen Modal       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Express API (Render)               │
│  - Node.js / Express Server                                 │
│  - Bounded Tool Orchestration Loop (Max 3 turns)            │
│  - Pure Application-Code Deterministic Scoring (/api/assess)│
│  - Study Plan CRUD & Activity Completion Patching           │
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
                                      │  (Neon.tech Free Tier) │
                                      │  - Table: study_plans  │
                                      └────────────────────────┘
```

* **Zero-Credential Frontend**: The browser client bundle contains no API keys or database connection strings.
* **Strict Backend Isolation**: `GEMINI_API_KEY` and `DATABASE_URL` are configured exclusively as environment variables on the Render backend server.

---

## 3. The Three Required Tools

| Tool | Type | Purpose & Behavior |
| :--- | :--- | :--- |
| **`search_material`** | Retrieval / Guardrail | Scans the 3 CS101 syllabus modules (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`) for keywords and concepts. Triggers clarification for ambiguous inputs and rejects out-of-scope topics. |
| **`check_assessment`** | Application Logic | Pure algorithmic evaluation executed entirely in server JavaScript. Compares student answers against `correctAnswer`, computes exact score (0–3), pinpoints mistakes, and builds 3 tailored study activities citing section IDs. |
| **`save_study_plan`** | Remote Persistence | Validates explicit user confirmation, verifies student ID/topic/score integrity, and executes an SQL `INSERT` into the remote PostgreSQL `study_plans` table on Neon. |

---

## 4. Storage & Schema Design

* **Provider**: Neon.tech Serverless PostgreSQL (Free Tier, AWS us-east-2).
* **Table**: `study_plans`
  * `id`: UUID Primary Key (`gen_random_uuid()`)
  * `student_id`: `VARCHAR(64)` referencing `students(id)`
  * `student_name`: `VARCHAR(255)`
  * `topic`: `VARCHAR(255)`
  * `score`: `INT` (0 to 3)
  * `total_questions`: `INT` (default 3)
  * `activities`: `JSONB` array of structured activity objects `[{ title, description, sectionRef, completed }]`
  * `section_references`: `JSONB` array of referenced module IDs (e.g., `["SEC-PY-101"]`)
  * `created_at`: `TIMESTAMPTZ` (default `NOW()`)

---

## 5. Free Services Register Summary

* **Frontend**: Vercel Hobby Free Tier (Global CDN, automated Git CI/CD, SSL).
* **Backend**: Render Web Service Free Tier (750 free instance hours/month).
* **Database**: Neon.tech Serverless PostgreSQL Free Tier (0.5 GB storage, compute branching).
* **AI Engine**: Google AI Studio Free Tier (`gemini-1.5-flash`, free RPM/TPM quota).
* **Stack**: Node.js, Express, React, Vite, Tailwind CSS (100% open-source).
* *Compliance Statement*: 100% genuine free tier. Zero paid plans, zero credit-card-required trials, and zero promotional credits used.

---

## 6. Member Responsibilities

* **Member A (Frontend Lead)**: React SPA architecture, interactive quiz UI, confirmation gate modal, responsive layout, and mobile navigation drawer.
* **Member B (Backend & Agent Orchestrator)**: Express REST API, bounded tool execution loop, Gemini 1.5 Flash client integration, error handling.
* **Member C (Syllabus & Retrieval Specialist)**: CS101 course syllabus curation (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`), `search_material` keyword matching, clarification & guardrail logic.
* **Member D (Assessment & Analytics Engineer)**: Deterministic scoring algorithm in `check_assessment`, tailored study activity generator, previous-attempt comparative analytics engine, SVG score progression chart.
* **Member E (Database, DevOps & QA Lead)**: Neon PostgreSQL schema, database connection pooling, Render & Vercel deployment pipelines, test report execution (TC-01 to TC-05), and submission documentation.
