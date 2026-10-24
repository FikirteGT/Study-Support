const { scoreQuiz } = require("../services/quizScoring");

/** POST /api/assess  body: { quizToken, studentAnswers: { [questionId]: optionIndex } } */
const processAssessment = (req, res, next) => {
  try {
    const { quizToken, studentAnswers } = req.body || {};
    res.status(200).json(scoreQuiz(quizToken, studentAnswers));
  } catch (error) {
    next(error);
  }
};

module.exports = { processAssessment };
