
require("dotenv").config();

const app = require("./app");
const db = require("./config/db");

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required in production (plans must persist in the remote database).");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await db.closePool();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
