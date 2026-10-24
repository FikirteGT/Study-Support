# Free-Service Register

**Project**: CS101 Python AI Study Support Agent  
**Team**: Team 1  
**Verification Date**: 24 October 2026  

---

## 1. Registered Services Table

| Service | Plan / Tier | Official Pricing Link | Main Free Limits (Relevant) | Notes / Role in System |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** | Hobby | [https://vercel.com/pricing](https://vercel.com/pricing) | 100 GB bandwidth/month, unlimited static deployments, free SSL certificate | **Frontend**: Hosts React 18 + Vite SPA with global CDN distribution and zero cold-start delivery. |
| **Render** | Free | [https://render.com/pricing](https://render.com/pricing) | 750 free instance hours/month, 512 MB RAM, spins down after 15 min inactivity | **Backend**: Hosts Express.js REST API server, tool orchestrator, and secrets isolation layer. |
| **Neon.tech** | Free Tier | [https://neon.tech/pricing](https://neon.tech/pricing) | 0.5 GB storage, serverless compute, automated branching | **Database**: Hosted remote PostgreSQL storing confirmed `study_plans` and student records. |
| **Google AI Studio** | Free Tier | [https://ai.google.dev/pricing](https://ai.google.dev/pricing) | 15 RPM (requests per minute), 1M TPM, 1,500 RPD for Gemini 1.5 Flash | **AI Engine**: Dynamic grounded 3-MCQ generation based on matched CS101 course syllabus sections. |
| **Node.js / Express** | Open Source | [https://nodejs.org](https://nodejs.org) / [https://expressjs.com](https://expressjs.com) | MIT License / Unrestricted local & cloud runtime | **Runtime & API**: Server application framework, routing, and pure code scoring evaluation. |
| **React / Vite** | Open Source | [https://react.dev](https://react.dev) / [https://vitejs.dev](https://vitejs.dev) | MIT License / Unrestricted client library | **Frontend Stack**: Single-page application UI, state management, and SVG chart visualization. |
| **Tailwind CSS** | Open Source | [https://tailwindcss.com](https://tailwindcss.com) | MIT License / Unrestricted utility CSS framework | **Design System**: Responsive styling, accessible contrast, mobile drawer overlay. |

---

## 2. Compliance Statement

1. **Zero Financial Cost**: All services used in this project operate strictly within their perpetually free tiers.
2. **No Credit Card Required**: None of the registered services required a credit card, payment method, or post-trial recurring billing activation.
3. **No Promotional / Temporary Credits**: The system does not depend on introductory credits, education grants, or time-limited trial balances.
4. **Secrets Isolation Compliance**: All sensitive credentials (`GEMINI_API_KEY`, `DATABASE_URL`) reside solely within Render backend environment variables; client frontend bundles contain zero secret tokens.
