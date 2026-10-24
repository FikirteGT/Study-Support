const express = require('express');
const router = express.Router();
const { processAssessment } = require('../controllers/assessmentController');

// POST /evaluate -> triggers assessment processing
router.post('/evaluate', processAssessment);

// Also handle POST / to ensure flexibility when mounted at /api/assessment or /api/assess
router.post('/', processAssessment);

module.exports = router;
