# CS101 Python AI Study Support Agent

**Live frontend:** https://study-support-vertex.vercel.app/
**Live backend API:** https://study-support-1.onrender.com (`GET /health`)

An AI agent that takes a course topic, searches the demo syllabus, writes a 3-question quiz, scores it in application code, proposes 3 study activities that cite syllabus sections, and (only after the student confirms) saves the plan to a remote PostgreSQL database where it can be reopened.

## Architecture

```text
Browser (React + Vite, Vercel)
   |  HTTPS / JSON  (VITE_API_URL)
   v
Express API (Render)
   |- POST /api/agent/prompt  Tool 1 search_material + Gemini quiz generation (bounded: max 3 tool calls)
   |- POST /api/assess        Tool 2 check_assessment (pure code, answer key stays on the server)
   |- POST /api/plans         Tool 3 save_study_plan (requires confirmed: true)
   |- GET  /api/plans         latest 10 saved plans
   |- GET  /api/plans/:id     reopen one plan from the database
   |- GET  /api/materials/search?query=...
   v
Google Gemini (AI Studio free tier)      Neon PostgreSQL (free tier)
```

Secrets (`GEMINI_API_KEY`, `DATABASE_URL`, `QUIZ_SECRET`) exist only in the Render environment, never in the frontend bundle.

### How the safeguards work
- **Answer key never reaches the browser.** The quiz response carries an encrypted `quizToken` (AES-256-GCM, keyed by `QUIZ_SECRET`). `/api/assess` and `/api/plans` decrypt it, score on the server and recompute the plan, so a client cannot fake a score.
- **Confirmation gate.** `POST /api/plans` without `confirmed: true` returns 400: "User confirmation is required before saving study plan."
- **Guardrails halt in code.** Broad topics return `clarification_needed`, off-syllabus topics return `out_of_scope`; neither triggers more model calls.
- **Visible fallback.** If Gemini fails or returns malformed quiz JSON twice, a grounded question bank is used and the UI says so (`source: "fallback"`).

## Run locally
```bash
cd backend && cp .env.example .env && npm install && npm run dev     # http://localhost:5000
cd frontend && cp .env.example .env && npm install && npm run dev    # http://localhost:5173
```
Without `DATABASE_URL` the API uses temporary in-memory storage. Run `database/schema.sql` then `database/seed.sql` on your Neon database for the real thing.

## Deploy
1. **Neon:** create a free project, run `schema.sql` and `seed.sql`, copy the connection string.
2. **Render (backend):** root directory `backend`, build `npm install`, start `npm start`. Set `NODE_ENV=production`, `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `QUIZ_SECRET`, `CORS_ORIGIN=https://study-support-vertex.vercel.app`.
3. **Vercel (frontend):** root directory `frontend`, set `VITE_API_URL=https://study-support-1.onrender.com`.

## Tests
`node backend/scripts/run_test_suite.js` runs the five cases against the backend. Re-run them through the live UI and attach screenshots to `TEST_REPORT.md`.

## Known limitations
Free hosting sleeps when idle (first request can take about a minute). Login is a demo screen with no real authentication. Quiz sessions expire after 30 minutes.
