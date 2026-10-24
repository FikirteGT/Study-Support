/**
 * Tool 2: check_assessment & Activity Plan Engine
 * Evaluates student assessment deterministically in pure application code (no LLM).
 */

/**
 * Predefined syllabus topic metadata for tailored remedial activities.
 */
const sectionTopics = {
  'SEC-PY-101': {
    review: 'Review mutable list methods and dynamic typing in [SEC-PY-101]',
    practice: 'Practice mutability, indexing, and tuple immutability exercises in [SEC-PY-101]',
    quiz: 'Complete self-assessment quiz on data structures in [SEC-PY-101]'
  },
  'SEC-PY-102': {
    review: 'Review control flow, iteration loops, and function scoping in [SEC-PY-102]',
    practice: 'Practice implementing loops, conditional branching, and return statements in [SEC-PY-102]',
    quiz: 'Complete self-assessment quiz on LEGB scope and functions in [SEC-PY-102]'
  },
  'SEC-PY-103': {
    review: 'Review classes, __init__ constructor, self reference, and super() inheritance in [SEC-PY-103]',
    practice: 'Practice class instantiation and method overriding exercises in [SEC-PY-103]',
    quiz: 'Complete self-assessment quiz on OOP principles in [SEC-PY-103]'
  }
};

/**
 * Formats a section reference string ensuring bracket enclosure (e.g., "[SEC-PY-101]").
 *
 * @param {string} sectionRef
 * @returns {string} Formatted section tag
 */
function formatSectionTag(sectionRef) {
  if (!sectionRef) return '[General]';
  const trimmed = String(sectionRef).trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed;
  }
  return `[${trimmed}]`;
}

/**
 * Generates 3 advanced mastery activities when the student achieves score === 3.
 *
 * @returns {Array<{ title: string, description: string, sectionRef: string }>} Exactly 3 mastery activities
 */
function generateMasteryActivities() {
  return [
    {
      title: 'Advanced Conceptual Review & Deep Dive',
      description: 'Explore advanced language mechanics, internal runtime models, and architectural best practices.',
      sectionRef: 'General'
    },
    {
      title: 'Complex Practical Implementation Project',
      description: 'Implement end-to-end practical coding scenarios and mini-projects applying idiomatic patterns.',
      sectionRef: 'General'
    },
    {
      title: 'System Optimization & Code Synthesis',
      description: 'Analyze algorithmic performance trade-offs, refactor bottlenecks, and conduct rigorous code reviews.',
      sectionRef: 'General'
    }
  ];
}

/**
 * Generates 3 remedial activities citing the exact section tags of missed questions.
 *
 * @param {string[]} uniqueSections - Distinct sectionRefs of missed questions
 * @returns {Array<{ title: string, description: string, sectionRef: string }>} Exactly 3 remedial activities
 */
function generateRemedialActivities(uniqueSections) {
  const getTopicMeta = (sec) => {
    const tag = formatSectionTag(sec);
    if (sectionTopics[sec]) {
      return sectionTopics[sec];
    }
    return {
      review: `Review core concepts and methods in ${tag}`,
      practice: `Practice targeted problem sets and exercises in ${tag}`,
      quiz: `Complete mastery self-assessment quiz in ${tag}`
    };
  };

  if (uniqueSections.length === 1) {
    const sec = uniqueSections[0];
    const tag = formatSectionTag(sec);
    const meta = getTopicMeta(sec);

    return [
      {
        title: meta.review,
        description: `Review foundational theory, lecture notes, and documentation for ${tag} to address the missed question.`,
        sectionRef: sec
      },
      {
        title: meta.practice,
        description: `Work through step-by-step coding exercises and practical examples focused on ${tag}.`,
        sectionRef: sec
      },
      {
        title: meta.quiz,
        description: `Complete a targeted review quiz and self-assessment specifically focused on ${tag} to verify retention.`,
        sectionRef: sec
      }
    ];
  }

  if (uniqueSections.length === 2) {
    const [sec1, sec2] = uniqueSections;
    const tag1 = formatSectionTag(sec1);
    const tag2 = formatSectionTag(sec2);
    const meta1 = getTopicMeta(sec1);
    const meta2 = getTopicMeta(sec2);

    return [
      {
        title: meta1.review,
        description: `Review study materials and core documentation in ${tag1} to fix identified misconceptions.`,
        sectionRef: sec1
      },
      {
        title: meta2.review,
        description: `Review study materials and core documentation in ${tag2} to fix identified misconceptions.`,
        sectionRef: sec2
      },
      {
        title: `Targeted Practice: ${tag1} & ${tag2}`,
        description: `Complete integrated practice problems combining key takeaways from ${tag1} and ${tag2}.`,
        sectionRef: sec1
      }
    ];
  }

  // 3 or more unique sections
  return [
    {
      title: getTopicMeta(uniqueSections[0]).review,
      description: `Revisit foundational materials and lecture notes covering ${formatSectionTag(uniqueSections[0])}.`,
      sectionRef: uniqueSections[0]
    },
    {
      title: getTopicMeta(uniqueSections[1]).review,
      description: `Revisit foundational materials and lecture notes covering ${formatSectionTag(uniqueSections[1])}.`,
      sectionRef: uniqueSections[1]
    },
    {
      title: getTopicMeta(uniqueSections[2]).review,
      description: `Revisit foundational materials and lecture notes covering ${formatSectionTag(uniqueSections[2])}.`,
      sectionRef: uniqueSections[2]
    }
  ];
}

/**
 * Checks student answers against questions and generates tailored study activities.
 *
 * @param {Object} studentAnswers - Object mapping question IDs to submitted answers.
 * @param {Array<{ id: string|number, correctAnswer: any, sectionRef: string }>} questions - Array of question objects.
 * @returns {{ score: number, total: number, passed: boolean, mistakes: Array<string|number>, proposedActivities: Array<{ title: string, description: string, sectionRef: string }> }}
 */
function checkAssessment(studentAnswers = {}, questions = []) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeAnswers = studentAnswers && typeof studentAnswers === 'object' ? studentAnswers : {};

  let score = 0;
  const mistakes = [];
  const missedSections = [];

  for (const q of safeQuestions) {
    const studentAns = safeAnswers[q.id];
    const isCorrect =
      studentAns !== undefined &&
      studentAns !== null &&
      (studentAns === q.correctAnswer ||
        (typeof studentAns === 'string' &&
          typeof q.correctAnswer === 'string' &&
          studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()));

    if (isCorrect) {
      score++;
    } else {
      mistakes.push(q.id);
      if (q.sectionRef) {
        missedSections.push(q.sectionRef);
      }
    }
  }

  const total = safeQuestions.length;
  const passed = score >= 2;

  let proposedActivities;
  if (score === 3) {
    proposedActivities = generateMasteryActivities();
  } else {
    const uniqueSections = Array.from(new Set(missedSections.filter(Boolean)));
    if (uniqueSections.length === 0) {
      uniqueSections.push('General');
    }
    proposedActivities = generateRemedialActivities(uniqueSections);
  }

  return {
    score,
    total,
    passed,
    mistakes,
    proposedActivities
  };
}

module.exports = checkAssessment;
module.exports.checkAssessment = checkAssessment;
