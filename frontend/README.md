<<<<<<< HEAD
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
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
>>>>>>> 897d4c5 (feat(frontend): implement core academic support platform with tool inspector and modular views)
