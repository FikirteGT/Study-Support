const { checkAssessment } = require("../tools/checkAssessment"); // Tool 2: pure application code
const { openQuiz } = require("./quizToken");
const { HttpError } = require("../middleware/errorHandler");

/** Scores a student's answers against the server-held key. Shared by /api/assess and /api/plans. */
function scoreQuiz(quizToken, studentAnswers) {
  const quiz = typeof quizToken === "string" ? openQuiz(quizToken) : null;
  if (!quiz) throw new HttpError(400, "Quiz session is invalid or has expired. Please start a new quiz.");
  if (!studentAnswers || typeof studentAnswers !== "object" || Array.isArray(studentAnswers)) {
    throw new HttpError(400, "studentAnswers must be an object keyed by question id.");
  }
  const answers = {};
  for (const q of quiz.questions) {
    const v = studentAnswers[q.id];
    if (!Number.isInteger(v) || v < 0 || v > 3) {
      throw new HttpError(400, "Answer every question (choose option 0-3) before submitting.");
    }
    answers[q.id] = v;
  }
  const out = checkAssessment(answers, quiz.questions);
  const results = quiz.questions.map((q) => ({
    id: q.id, question: q.question, options: q.options, chosenIndex: answers[q.id], correctIndex: q.correctAnswer,
    correct: answers[q.id] === q.correctAnswer, explanation: q.explanation, sectionRef: q.sectionRef,
  }));
  // Mastery activities are generic ("General"); tie them to the quizzed section so every activity cites a syllabus ID.
  const activities = out.proposedActivities.map((a) => ({ ...a, sectionRef: a.sectionRef === "General" ? quiz.section.id : a.sectionRef }));
  return {
    topic: quiz.topic, section: quiz.section, score: out.score, total: out.total, passed: out.passed,
    mistakes: out.mistakes, activities, results, sectionReferences: [quiz.section.id],
  };
}

module.exports = { scoreQuiz };
