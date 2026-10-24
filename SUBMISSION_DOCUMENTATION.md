# AI Study Support Agent — Comprehensive Submission Documentation

**Project Title**: CS101 Python AI Study Support Agent  
**Role**: Academic Support Tutor  
**Team**: Team 1  
**Submission Date**: 24 October 2026  
**Live Frontend Application**: [https://study-support-vertex.vercel.app/](https://study-support-vertex.vercel.app/)  
**Live Backend API**: [https://study-support-1.onrender.com](https://study-support-1.onrender.com)  
**Target Syllabus**: CS101 Introduction to Python Programming (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`)  

---

## Table of Contents
1. [One- / Two-Page Final Design Note](#1-one---two-page-final-design-note)
2. [Free-Service Register](#2-free-service-register)
3. [Contribution Note](#3-contribution-note)
4. [Five-Case Test Report & Verification Summary](#4-five-case-test-report--verification-summary)
5. [Known Limitations](#5-known-limitations)

---

## 1. One- / Two-Page Final Design Note

### 1.1 Project Overview & Purpose
The **CS101 Python AI Study Support Agent** is an interactive, browser-accessible academic tutor designed for undergraduate students taking introductory computer science. It conducts targeted diagnostic evaluations on course syllabus modules, administers grounded multiple-choice assessments, evaluates results deterministically in server application code, formulates personalized study activities citing specific lecture sections, tracks student progress over time, and persists confirmed study plans to a remote PostgreSQL database.

### 1.2 Core Workflow
1. **Topic Input & Intent Retrieval**: The student inputs a Python topic (e.g., *"Python list mutability and tuples"*). The backend agent executes **`search_material`** against the 3 demo syllabus modules.
   * *Broad / Ambiguous Query* (e.g., *"Python"* or *"Coding"*): Halts generation and prompts the student to clarify with module chips.
   * *Out-of-Scope Query* (e.g., *"SQL"* or *"React"*): Displays a guardrail rejection message and halts without database mutations or LLM waste.
2. **Grounded MCQ Generation**: For matched sections, Google Gemini 1.5 Flash (Free Tier) generates exactly 3 multiple-choice questions grounded strictly in the matched course section.
3. **Deterministic Application Scoring**: Upon quiz submission, the backend executes **`check_assessment`** in pure application code (JavaScript). Scores are calculated mathematically (0–3), missed concepts are identified, and 3 tailored study activities are produced with syllabus citations. Zero LLM score hallucination.
4. **Previous-Attempt Comparative Analysis**: The system compares the current score against past attempts for the same topic, calculating the score delta (e.g., `+1 Score Gain (+33%) 📈`), trajectory, and mastery tier (`Mastered ⭐`, `Proficient 📈`, `Needs Practice 🔄`).
5. **Confirmation Guard & Persistence**: An explicit confirmation gate verifies student intent. Upon confirmation, **`save_study_plan`** inserts the plan into a hosted remote PostgreSQL database on Neon.
6. **Reopening & Activity Tracking**: Students can reopen saved plans by UUID, view interactive score progression SVG charts on the Dashboard, track section mastery progress bars, and check off completed study activities via `PATCH /api/study-plans/:id/activities`.

### 1.3 System Architecture & Secrets Isolation

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

* **Zero-Credential Frontend**: The client bundle contains zero API keys or database connection strings.
* **Backend Secrets Isolation**: `GEMINI_API_KEY` and `DATABASE_URL` are stored exclusively in Render backend environment variables.

### 1.4 The Three Mandatory Tools

| Tool | Type | Purpose & Behavior |
| :--- | :--- | :--- |
| **`search_material`** | Retrieval / Guardrail | Scans the 3 CS101 syllabus modules (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`) for keywords and concepts. Triggers clarification for ambiguous inputs and rejects out-of-scope topics. |
| **`check_assessment`** | Application Logic | Pure algorithmic evaluation executed entirely in server JavaScript. Compares student answers against `correctAnswer`, computes exact score (0–3), pinpoints mistakes, and builds 3 tailored study activities citing section IDs. |
| **`save_study_plan`** | Remote Persistence | Validates explicit user confirmation, verifies student ID/topic/score integrity, and executes an SQL `INSERT` into the remote PostgreSQL `study_plans` table on Neon. |

### 1.5 Remote Database Schema (`study_plans`)
* Hosted on **Neon.tech Serverless PostgreSQL** (Free Tier):
  * `id`: UUID Primary Key (`gen_random_uuid()`)
  * `student_id`: `VARCHAR(64)` referencing `students(id)`
  * `student_name`: `VARCHAR(255)`
  * `topic`: `VARCHAR(255)`
  * `score`: `INT` (0 to 3)
  * `total_questions`: `INT` (default 3)
  * `activities`: `JSONB` array of activity objects `[{ title, description, sectionRef, completed }]`
  * `section_references`: `JSONB` array of section IDs (e.g., `["SEC-PY-101"]`)
  * `created_at`: `TIMESTAMPTZ` (default `NOW()`)

---

## 2. Free-Service Register

| Service | Plan / Tier | Official Pricing Link | Main Free Limits (Relevant) | Notes / Role in System |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** | Hobby | [https://vercel.com/pricing](https://vercel.com/pricing) | 100 GB bandwidth/month, unlimited static deployments, free SSL certificate | **Frontend**: Hosts React 18 + Vite SPA with global CDN distribution and zero cold-start delivery. |
| **Render** | Free | [https://render.com/pricing](https://render.com/pricing) | 750 free instance hours/month, 512 MB RAM, spins down after 15 min inactivity | **Backend**: Hosts Express.js REST API server, tool orchestrator, and secrets isolation layer. |
| **Neon.tech** | Free Tier | [https://neon.tech/pricing](https://neon.tech/pricing) | 0.5 GB storage, serverless compute, automated branching | **Database**: Hosted remote PostgreSQL storing confirmed `study_plans` and student records. |
| **Google AI Studio** | Free Tier | [https://ai.google.dev/pricing](https://ai.google.dev/pricing) | 15 RPM (requests per minute), 1M TPM, 1,500 RPD for Gemini 1.5 Flash | **AI Engine**: Dynamic grounded 3-MCQ generation based on matched CS101 course syllabus sections. |
| **Node.js / Express** | Open Source | [https://nodejs.org](https://nodejs.org) / [https://expressjs.com](https://expressjs.com) | MIT License / Unrestricted local & cloud runtime | **Runtime & API**: Server application framework, routing, and pure code scoring evaluation. |
| **React / Vite** | Open Source | [https://react.dev](https://react.dev) / [https://vitejs.dev](https://vitejs.dev) | MIT License / Unrestricted client library | **Frontend Stack**: Single-page application UI, state management, and SVG chart visualization. |
| **Tailwind CSS** | Open Source | [https://tailwindcss.com](https://tailwindcss.com) | MIT License / Unrestricted utility CSS framework | **Design System**: Responsive styling, accessible contrast, mobile drawer overlay. |

> **Compliance Guarantee**: No paid plans, no credit-card-required trials, and no promotional credits were used. The architecture runs completely on genuine free tiers.

---

## 3. Contribution Note

* **Team Collaboration**: All team members actively participated in planning, architecture design, coding, testing, and documentation.
* **Division of Responsibilities**:
  * **Member A**: React SPA UI, quiz view, confirmation gate modal, responsive layout, mobile navigation drawer.
  * **Member B**: Express backend routes, bounded agent loop, Gemini client integration, secrets isolation.
  * **Member C**: CS101 course syllabus curation (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`), keyword retrieval in `search_material`, clarification & guardrail rejection.
  * **Member D**: Deterministic scoring engine in `check_assessment`, tailored study activity generator, previous-attempt comparative analytics, SVG score progression chart.
  * **Member E**: Neon PostgreSQL schema, database connection pooling, Render & Vercel deployment pipelines, test report execution (TC-01 to TC-05), and submission documentation.
* **Transparent AI Coding Tool Usage**: Free-tier AI coding assistants (free-tier Cursor, GitHub Copilot Free, and ChatGPT Free) were used only for boilerplate components, initial SQL schema suggestions, and documentation drafting. Final tool logic, deterministic scoring algorithms, confirmation guards, and all database writes were authored and verified directly by team members.
* **Code Competency**: Every team member can explain their code and the complete agent decision loop line-by-line during judging.

---

## 4. Five-Case Test Report & Verification Summary

| Test ID | Scenario Type | Input Topic / User Action | Expected Behavior | Observed Result (Live Deployment) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Normal Case 1** | Topic: `"Python list mutability and tuples"` | Matches `SEC-PY-101`, generates 3 MCQs on mutability and typing. Application code scores 3/3; builds 3 mastery activities. User confirms and saves plan to remote Postgres. | Matched `SEC-PY-101`. Generated 3 grounded MCQs. Pure code evaluated score 3/3 (100%). Generated 3 mastery activities. Confirmed & persisted to Neon (`id: 2d2146b9-35da-4bd0-983f-b40b602d0fa8`). | **PASS** |
| **TC-02** | **Normal Case 2** | Topic: `"Functions and variable scope"` | Matches `SEC-PY-102`, generates 3 MCQs on `def` and local scope. Student misses 2 questions. `check_assessment` calculates score `1/3` in code and produces remedial plan. | Matched `SEC-PY-102`. Generated 3 MCQs. Evaluated score 1/3 (33%), detected mistakes on questions 2 & 3. Formulated 3 tailored remedial activities explicitly citing `[SEC-PY-102]`. Saved to Neon (`id: b544cf2a-1ec5-4352-bd50-0f8642e22508`). | **PASS** |
| **TC-03** | **Normal Case 3 & Reopen** | Topic: `"OOP classes and inheritance"` | Matches `SEC-PY-103`, generates 3 MCQs on `class`, `self`, and `super()`. User gets 3/3, confirms, and reopens saved plan by UUID from remote Postgres. | Matched `SEC-PY-103`. Generated 3 MCQs. Evaluated score 3/3. Plan saved to Neon (`id: e5434518-5aa9-4813-9bad-8db6bbec6744`). User reopened by UUID: successfully retrieved matching student `Jordan Lee`, topic, and all 3 activities. | **PASS** |
| **TC-04** | **Ambiguous / Incomplete** | Topic: `"Python"` *(or "Coding")* | Agent detects query is overly broad. It halts quiz generation and asks clarification with 3 module options. | Tool 1 flagged `clarification_needed`. Halts quiz generation (0 MCQs). Returned standard clarification prompt with 3 module options. Prevents runaway tool loop. | **PASS** |
| **TC-05** | **Out of Scope / Guardrail** | Topic: `"SQL Joins and Relational Keys"` | Agent invokes `search_material`, finds 0 matches in Python syllabus. Agent halts gracefully and displays out-of-scope message. | Tool 1 flagged `out_of_scope`. 0 syllabus matches found. Agent returned rejection message: *"This topic is outside the available Python course material."* Halts tool loop cleanly without DB writes. | **PASS** |

---

## 5. Known Limitations

* **Render Free-Tier Cold Starts**: On the Render free instance, inactive backend services spin down after 15 minutes of inactivity; the initial wake-up request can take 15–30 seconds.
* **Shared Gemini Free-Tier Quota**: Gemini 1.5 Flash free tier operates under shared project rate limits (15 RPM / 1M TPM); rapid consecutive queries may encounter temporary rate limit throttling.
* **Focused Demo Syllabus Scope**: The course curriculum is intentionally constrained to 3 foundational CS101 Python modules (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`) to ensure high factual precision and predictable retrieval.
* **Single Student Profile Baseline**: The system demonstrates user tracking and persistence using a designated student profile (`Jordan Lee`, ID `PY-2026-01`) without an external authentication provider.
* **LLM Question Generation Dynamic Variance**: While assessment questions are strictly grounded in course sections, minor variations in question phrasing depend on LLM generation; scoring remains 100% deterministic in application code.
