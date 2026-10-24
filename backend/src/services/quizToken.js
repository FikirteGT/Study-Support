/**
 * Stateless, tamper-proof quiz sessions. The answer key and explanations are encrypted (AES-256-GCM)
 * into a token the browser can carry but not read or modify. /api/assess and /api/plans decrypt it,
 * so scoring always happens on the server and the key is never visible in DevTools.
 */
const crypto = require("crypto");

const TTL_MS = 30 * 60 * 1000;
const bootSecret = crypto.randomBytes(32).toString("hex");
let warned = false;

function key() {
  if (!process.env.QUIZ_SECRET && !warned) {
    warned = true;
    console.warn("[quiz] QUIZ_SECRET is not set: quizzes will stop working after a server restart. Set it in production.");
  }
  return crypto.createHash("sha256").update(process.env.QUIZ_SECRET || bootSecret).digest();
}

function sealQuiz(quiz) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify({ ...quiz, exp: Date.now() + TTL_MS }), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

function openQuiz(token) {
  try {
    const [iv, tag, data] = String(token).split(".").map((s) => Buffer.from(s, "base64url"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const quiz = JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8"));
    return quiz.exp > Date.now() ? quiz : null;
  } catch {
    return null;
  }
}

module.exports = { sealQuiz, openQuiz };
