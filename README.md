# Study Support AI Agent (Academic Support Tutor)

## Hackathon Documentation & Specifications
- 📘 **[Software Requirements Specification (SRS) & Design Note](./SRS.md)**
- 🧪 **[Five-Case Test Report](./TEST_REPORT.md)**
- 🐍 **[Course Syllabus Demo Data](./backend/src/data/demoMaterials.js)**

---

## Project Structure
- `backend/`: Express.js API backend containing the 3 AI agent tools & PostgreSQL integration.
  - `src/tools/searchMaterial.js`: **Tool 1** (Keyword search across Python syllabus)
  - `src/tools/checkAssessment.js`: **Tool 2** (Pure code evaluation & scoring)
  - `src/tools/saveStudyPlan.js`: **Tool 3** (User confirmation & remote PostgreSQL save)
- `frontend/`: React (Vite) client interface for interactive student testing and plan reopening.
- `database/`: Hosted PostgreSQL schema (`study_plans` table) and seed scripts.
