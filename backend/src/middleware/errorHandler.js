class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

// Central error handler: clear messages for expected errors, nothing internal leaks to the client.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Request body must be valid JSON." });
  if (err.code === "23503") return res.status(400).json({ error: "Unknown student ID." });
  console.error("[Server Error]", err);
  return res.status(500).json({ error: "An unexpected server error occurred. Please try again." });
}

module.exports = { HttpError, notFound, errorHandler };
