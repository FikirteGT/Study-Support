const { searchMaterial } = require("../tools/searchMaterial");

/** GET /api/materials/search?query=... */
function searchMaterials(req, res) {
  try {
    const result = searchMaterial(req.query.query); // arrays/objects (?query=a&query=b) are rejected as invalid
    if (result.status === "invalid_query") return res.status(400).json({ error: result.message, ...result });
    // matched / clarification_needed / out_of_scope are normal outcomes: 200, and the client branches on `status`
    return res.status(200).json(result);
  } catch (err) {
    console.error("[GET /api/materials/search]", err);
    return res.status(500).json({ error: "Could not search the course material. Please try again." });
  }
}

module.exports = { searchMaterials };
