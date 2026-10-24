# Study Support: frontend (React + Vite)

```
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000 (or your Render URL)
npm run dev              # development
npm run build            # production build (deploy to Vercel; set VITE_API_URL in the Vercel project settings)
```

The UI calls the Express API only (`src/api.js`). No secrets live in the frontend.
