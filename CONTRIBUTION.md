# Contribution Note – Team 1

**Project**: CS101 Python AI Study Support Agent  
**Event**: AI Agent Hackathon  
**Date**: 24 October 2026  

---

## 1. Team Collaboration & Division of Work

All team members actively participated in the planning, system design, implementation, testing, and documentation of the AI Study Support Agent.

| Member | Primary Responsibilities | Artifacts / Modules Delivered |
| :--- | :--- | :--- |
| **Member A** | Frontend UI & Interactive Workflows | Single-page application in React 18 / Vite, responsive sidebar navigation, mobile overlay drawer, interactive 3-MCQ quiz interface, confirmation guard modal, and study activity completion checklist. |
| **Member B** | Backend Architecture & Agent Loop | Express.js API routes (`/api/agent/prompt`, `/api/assess`, `/api/study-plans`), bounded agent orchestration loop (max 3 iterations), Google Gemini API client integration, and CORS / environment configuration. |
| **Member C** | Syllabus Data & Retrieval Engineering | Curation of CS101 Python course modules (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`), retrieval engine implementation in `search_material`, keyword matching, broad-topic clarification detection, and out-of-scope guardrail rejection. |
| **Member D** | Deterministic Evaluation & Analytics | Pure application-code assessment scoring in `check_assessment`, tailored study activity generator with section citations, previous-attempt comparative analytics engine, and SVG score trajectory visualization. |
| **Member E** | Database Schema, DevOps & Quality Assurance | Neon PostgreSQL schema and connection pooling (`db.js`), Vercel & Render cloud deployments, execution and logging of the 5-case test suite (`TEST_REPORT.md`), and compliance documentation. |

---

## 2. Transparent AI Coding Assistant Usage

In accordance with the hackathon rules and guidelines:

* **Assistance Scope**: Free-tier AI coding assistants (free-tier Cursor, GitHub Copilot Free, and ChatGPT Free) were utilized exclusively for:
  * Scaffolding initial React components and Express route boilerplates.
  * Suggesting PostgreSQL table constraints and syntax formatting.
  * Drafting initial error messages and proofreading technical documentation.
* **Core Logic Authorship**:
  * The three core tools (`search_material`, `check_assessment`, `save_study_plan`) were implemented, integrated, and verified directly by team members.
  * The deterministic scoring engine was intentionally written in pure application JavaScript (zero LLM scoring involvement) to guarantee 100% mathematical accuracy.
  * The confirmation guard before database mutations and the UUID plan reopening logic were engineered and verified by the team.
* **Team Competency**: Every team member fully understands the codebase, can explain their assigned modules line-by-line, and can walk through the complete agent decision loop during judging.
