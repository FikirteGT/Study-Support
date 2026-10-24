const { checkAssessment } = require('../tools/checkAssessment');

/**
 * Controller to process assessment evaluation submissions.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const processAssessment = (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Request body is required.'
      });
    }

    const { quizId, topic, studentAnswers, questions } = req.body;

    // Validation: return 400 error if inputs are missing or invalid
    if (
      quizId === undefined ||
      quizId === null ||
      quizId === '' ||
      !topic ||
      (typeof topic === 'string' && !topic.trim()) ||
      studentAnswers === undefined ||
      studentAnswers === null ||
      typeof studentAnswers !== 'object' ||
      Array.isArray(studentAnswers) ||
      !questions ||
      !Array.isArray(questions)
    ) {
      return res.status(400).json({
        error: 'Missing required inputs: quizId, topic, studentAnswers, and questions are required.'
      });
    }

    // Pass data into the deterministic checkAssessment tool
    const toolOutput = checkAssessment(studentAnswers, questions);

    // Return 200 JSON response merging tool's exact output with the request IDs
    return res.status(200).json({
      quizId,
      topic,
      ...toolOutput
    });
  } catch (error) {
    return res.status(500).json({
      error: 'An internal error occurred while processing the assessment.',
      details: error.message
    });
  }
};

module.exports = {
  processAssessment
};
