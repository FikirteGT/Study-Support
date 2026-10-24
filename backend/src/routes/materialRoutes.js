const express = require("express");
const { searchMaterials } = require("../controllers/materialController");

const router = express.Router();
router.get("/search", searchMaterials);

module.exports = router;
// In your Express app (server.js / app.js):
//   app.use("/api/materials", require("./routes/materialRoutes"));
