# CS101 Python AI Study Support Agent

**Live Frontend Application:** [https://study-support-vertex.vercel.app/]
**Live Backend API:** [https://study-support-1.onrender.com]

## System Architecture & Secrets Isolation
Our deployment architecture strictly complies with the zero-cost and secrets-isolation requirements. All database credentials and API keys (`GEMINI_API_KEY`, `DATABASE_URL`) are isolated on the Render backend environment variables and are completely inaccessible from the client bundle.

```text
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