import React, { useState, useEffect } from 'react';
import {
  searchMaterial,
  promptAgent,
  evaluateAssessment,
  saveStudyPlan,
  getStudyPlans,
  getStudyPlanById,
  getMaterials,
  checkBackendHealth,
  API_BASE
} from './services/api';

// Demo Course and Student Profile aligned with SRS
const STUDENT_PROFILE = {
  id: "PY-2026-01",
  name: "Jordan Lee",
  semester: "Fall 2026",
  course: "CS101: Introduction to Python Programming"
};

// Grounded Quiz Question Bank by Section
const QUESTION_BANK = {
  "SEC-PY-101": [
    {
      id: "q1",
      question: "Which syntax defines a mutable sequence in Python?",
      options: ["Square brackets [] (List)", "Parentheses () (Tuple)", "Curly braces {} (Dictionary)", "Single quotes '' (String)"],
      correctAnswer: "Square brackets [] (List)",
      sectionRef: "SEC-PY-101"
    },
    {
      id: "q2",
      question: "What occurs if you attempt to modify or reassign an element in a Python tuple?",
      options: ["The tuple updates in place", "Python raises a TypeError because tuples are immutable", "It automatically converts to a list", "It creates a copy with the change"],
      correctAnswer: "Python raises a TypeError because tuples are immutable",
      sectionRef: "SEC-PY-101"
    },
    {
      id: "q3",
      question: "Which of the following is required for keys stored in a Python dictionary?",
      options: ["Keys must be mutable lists", "Keys must be an immutable type (strings, integers, tuples)", "Keys must be strictly sequential numbers", "Keys must be boolean values"],
      correctAnswer: "Keys must be an immutable type (strings, integers, tuples)",
      sectionRef: "SEC-PY-101"
    }
  ],
  "SEC-PY-102": [
    {
      id: "q1",
      question: "How are code blocks determined in Python control flow?",
      options: ["Strict indentation (typically 4 spaces)", "Curly braces {}", "Begin / End statements", "Semicolons ;"],
      correctAnswer: "Strict indentation (typically 4 spaces)",
      sectionRef: "SEC-PY-102"
    },
    {
      id: "q2",
      question: "What does a Python function implicitly return if no return statement is executed?",
      options: ["0", "False", "None", "undefined"],
      correctAnswer: "None",
      sectionRef: "SEC-PY-102"
    },
    {
      id: "q3",
      question: "Under the LEGB rule, where are variables defined inside a function scoped by default?",
      options: ["Global scope", "Local scope (cannot be accessed outside)", "Enclosing module scope", "Built-in scope"],
      correctAnswer: "Local scope (cannot be accessed outside)",
      sectionRef: "SEC-PY-102"
    }
  ],
  "SEC-PY-103": [
    {
      id: "q1",
      question: "What is the purpose of the __init__ method in a Python class?",
      options: ["It destroys garbage-collected objects", "It serves as the constructor to initialize newly created class instances", "It declares class-level global constants", "It compiles bytecode for methods"],
      correctAnswer: "It serves as the constructor to initialize newly created class instances",
      sectionRef: "SEC-PY-103"
    },
    {
      id: "q2",
      question: "What does the conventional 'self' parameter refer to in an instance method?",
      options: ["The parent base class", "The specific current instance of the class", "The global Python interpreter", "The module file object"],
      correctAnswer: "The specific current instance of the class",
      sectionRef: "SEC-PY-103"
    },
    {
      id: "q3",
      question: "Which function enables a child class to invoke methods from its parent class?",
      options: ["super()", "parent()", "base()", "inherit()"],
      correctAnswer: "super()",
      sectionRef: "SEC-PY-103"
    }
  ]
};

// Grounded Course Sections Metadata
const COURSE_SECTIONS = [
  {
    id: "SEC-PY-101",
    number: 1,
    title: "Variables, Dynamic Typing & Core Data Structures",
    summary: "Covers Python variable assignments, dynamic typing rules, primitive data types, and distinguishing mutable lists from immutable tuples.",
    content: "Python is a dynamically typed language, meaning variable types do not need to be declared explicitly and are determined at runtime. The fundamental primitive data types include integers (int), floating-point numbers (float), strings (str), and booleans (bool). A core distinction in Python memory management is between mutable and immutable data structures. Lists (defined using square brackets `[]`) are mutable sequences that support in-place modifications such as `.append()`, `.pop()`, and item reassignment. Conversely, tuples (defined using parentheses `()`) are immutable sequences whose elements cannot be modified or reassigned after creation. Dictionaries (defined using curly braces `{}`) store key-value pairs where keys must be immutable types like strings or numbers. Understanding mutability is essential to avoiding unintentional side-effects when passing collections into functions.",
    key_concepts: [
      "Dynamic typing: variable types are determined at runtime without explicit declarations.",
      "Lists are mutable and can be modified in place; tuples are immutable once created.",
      "Dictionary keys must be of an immutable type (strings, integers, tuples)."
    ],
    keywords: ["variable", "dynamic typing", "list", "tuple", "mutable", "immutable", "dictionary"]
  },
  {
    id: "SEC-PY-102",
    number: 2,
    title: "Control Flow, Iteration & Functions",
    summary: "Covers conditional branching (if/elif/else), iteration loops (for/while), function declarations, arguments, and variable scoping.",
    content: "Control flow in Python relies strictly on indentation rather than braces to define code blocks. Conditional logic is evaluated using `if`, `elif`, and `else` statements with logical operators (`and`, `or`, `not`). Iteration is commonly handled via `for` loops traversing iterables or generating sequences using `range(start, stop, step)`. The `while` loop executes code as long as a boolean condition remains True, requiring manual loop-variant updates to avoid infinite loops. Functions are declared using the `def` keyword followed by the function name, parameter list, and a colon. Functions return values to the caller using the `return` statement; if no return statement is present, the function implicitly returns `None`. Parameters can have default values, and variable scope follows the LEGB rule (Local, Enclosing, Global, Built-in), meaning variables defined inside a function body cannot be accessed outside unless explicitly declared global.",
    key_concepts: [
      "Python blocks are determined by indentation (typically 4 spaces).",
      "Functions return None by default if no return statement is reached.",
      "Variables defined within a function belong to local scope (LEGB rule)."
    ],
    keywords: ["control flow", "if/elif/else", "for loop", "while loop", "def", "return", "scope", "LEGB"]
  },
  {
    id: "SEC-PY-103",
    number: 3,
    title: "Object-Oriented Programming: Classes & State",
    summary: "Covers classes, object instances, the __init__ constructor, instance methods, self reference, and single inheritance using super().",
    content: "Python supports object-oriented programming via the `class` keyword. A class acts as a blueprint for creating objects with encapsulated state and behavior. The `__init__` method serves as the constructor, automatically invoked upon object instantiation to initialize instance attributes. The first parameter of every instance method is conventionally named `self`, which explicitly references the specific object instance being operated upon, granting access to its attributes and methods. Encapsulation is supported by naming conventions: a single leading underscore indicates an internal protected attribute, while a double leading underscore triggers name mangling to prevent accidental overriding. Inheritance allows child classes to inherit attributes and methods from a parent class, and the `super()` function allows invocation of overridden parent methods.",
    key_concepts: [
      "The __init__ method initializes newly created class instances.",
      "The 'self' parameter refers to the current instance of the class in methods.",
      "The super() function calls parent class methods, allowing clean inheritance."
    ],
    keywords: ["oop", "class", "instance", "__init__", "self", "inheritance", "super()"]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Welcome');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Backend Connection State
  const [backendStatus, setBackendStatus] = useState({ connected: false, checking: true, mode: '' });

  // Topic search state (Tool 1)
  const [topic, setTopic] = useState('Python list mutability and tuples');
  const [matchingSections, setMatchingSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [scopeWarning, setScopeWarning] = useState('');
  const [clarificationPrompt, setClarificationPrompt] = useState('');
  const [clarificationOptions, setClarificationOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Assessment state (Tool 2)
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Dedicated Quizzes Tab State
  const [activePracticeQuiz, setActivePracticeQuiz] = useState(null); // { sectionId, title, questions }
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceResult, setPracticeResult] = useState(null);
  const [isEvaluatingPractice, setIsEvaluatingPractice] = useState(false);
  const [practicePlanSaved, setPracticePlanSaved] = useState(false);
  const [isSavingPracticePlan, setIsSavingPracticePlan] = useState(false);
  const [loadingPracticeQuiz, setLoadingPracticeQuiz] = useState(false);

  // Dedicated Materials Tab State
  const [materialsSearch, setMaterialsSearch] = useState('');
  const [expandedMaterial, setExpandedMaterial] = useState('SEC-PY-101'); // default expanded section

  // Persistence state
  const [savedPlans, setSavedPlans] = useState([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [reopenedPlanModal, setReopenedPlanModal] = useState(null);

  // Course materials
  const [courseMaterials, setCourseMaterials] = useState([]);

  // Check health and load initial data
  useEffect(() => {
    checkHealth();
    fetchMaterials();
    fetchSavedPlans();

    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const data = await checkBackendHealth();
      setBackendStatus({ connected: data.status === 'ok', mode: data.database || 'connected', checking: false });
    } catch {
      setBackendStatus({ connected: false, mode: '', checking: false });
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await getMaterials();
      setCourseMaterials(data);
    } catch (err) {
      console.warn("Could not load materials from backend:", err);
    }
  };

  const fetchSavedPlans = async () => {
    try {
      const data = await getStudyPlans();
      setSavedPlans(data);
    } catch (err) {
      console.warn("Could not load saved plans:", err);
    }
  };

  // TOOL 1 & AI Agent Prompt: Run bounded agent loop with Gemini dynamic 3-MCQ generation
  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    const queryToSearch = customQuery || topic;
    if (!queryToSearch.trim()) return;

    setScopeWarning('');
    setClarificationPrompt('');
    setClarificationOptions([]);
    setExpandedSections({});
    setQuizData(null);
    setScoreResult(null);
    setStudyPlan(null);
    setIsSearching(true);

    try {
      // First attempt: Call AI Agent loop with Gemini-powered dynamic 3-MCQ generation
      const data = await promptAgent(queryToSearch);

      if (data.status === 'clarification_needed') {
        setClarificationPrompt(data.message);
        setClarificationOptions(data.options || []);
        setMatchingSections([]);
      } else if (data.status === 'out_of_scope') {
        setScopeWarning(data.message || `Topic "${queryToSearch}" is outside our Python syllabus.`);
        setMatchingSections([]);
      } else if (data.status === 'matched') {
        const matches = data.matches || (data.section ? [data.section] : []);
        setMatchingSections(matches);
        if (data.questions && data.questions.length > 0) {
          setQuizData(data.questions);
          setUserAnswers({});
        } else {
          buildQuizForSection(data.section?.id || "SEC-PY-101");
        }
      }
    } catch (agentErr) {
      console.warn("Agent prompt failed, attempting direct search_material fallback:", agentErr);
      try {
        const data = await searchMaterial(queryToSearch);

        if (data.status === 'clarification_needed') {
          setClarificationPrompt(data.message);
          setClarificationOptions(data.options || []);
          setMatchingSections([]);
        } else if (data.status === 'out_of_scope') {
          setScopeWarning(data.message || `Topic "${queryToSearch}" is outside our Python syllabus.`);
          setMatchingSections([]);
        } else if (data.status === 'matched') {
          setMatchingSections(data.matches || []);
          const primarySecId = data.matches[0]?.id || "SEC-PY-101";
          buildQuizForSection(primarySecId);
        }
      } catch (err) {
        setScopeWarning(`Error connecting to backend (${API_BASE}): ${err.message}.`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const buildQuizForSection = (sectionId) => {
    const questions = QUESTION_BANK[sectionId] || QUESTION_BANK["SEC-PY-101"];
    setQuizData(questions);
    setUserAnswers({});
  };

  const handleOptionSelect = (qId, optionText) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optionText }));
  };

  const toggleSectionExpand = (secId) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  // TOOL 2: check_assessment via Express backend (Deterministic Scoring)
  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    setIsEvaluating(true);

    const payload = {
      quizId: `quiz_${Date.now()}`,
      topic: topic,
      studentAnswers: userAnswers,
      questions: quizData.map(q => ({
        id: q.id,
        options: q.options,
        correctAnswer: q.correctAnswer,
        sectionRef: q.sectionRef
      }))
    };

    try {
      const data = await evaluateAssessment(payload);

      setScoreResult(data);
      setStudyPlan(data.proposedActivities || []);
    } catch (err) {
      alert("Error evaluating assessment: " + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // TOOL 3: save_study_plan via Express backend (Remote PostgreSQL)
  const handleSavePlan = async () => {
    if (!scoreResult || !studyPlan) return;
    setIsSavingPlan(true);

    const payload = {
      confirmed: true,
      studentId: STUDENT_PROFILE.id,
      studentName: STUDENT_PROFILE.name,
      topic: topic,
      score: scoreResult.score,
      totalQuestions: scoreResult.total,
      activities: studyPlan,
      references: Array.from(new Set(quizData.map(q => q.sectionRef)))
    };

    try {
      const data = await saveStudyPlan(payload);

      alert(`Study Plan Successfully Saved!`);
      fetchSavedPlans();
    } catch (err) {
      alert("Failed to save study plan: " + err.message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Reopen Plan by unique ID
  const handleReopenPlan = async (id) => {
    try {
      const data = await getStudyPlanById(id);
      setReopenedPlanModal(data);
    } catch (err) {
      alert("Error reopening plan: " + err.message);
    }
  };

  // DEDICATED QUIZZES TAB HANDLERS (Stays within Quizzes)
  const handleStartPracticeQuiz = async (sectionId, title) => {
    setLoadingPracticeQuiz(true);
    setPracticeAnswers({});
    setPracticeResult(null);
    setPracticePlanSaved(false);

    try {
      const agentRes = await promptAgent(title);
      if (agentRes && agentRes.questions && agentRes.questions.length > 0) {
        setActivePracticeQuiz({
          sectionId,
          title,
          questions: agentRes.questions
        });
        setLoadingPracticeQuiz(false);
        return;
      }
    } catch (err) {
      console.warn("Dynamic quiz generation fallback for section:", sectionId);
    }

    const fallbackQuestions = QUESTION_BANK[sectionId] || QUESTION_BANK["SEC-PY-101"];
    setActivePracticeQuiz({
      sectionId,
      title,
      questions: fallbackQuestions
    });
    setLoadingPracticeQuiz(false);
  };

  const handlePracticeOptionSelect = (qId, optionText) => {
    setPracticeAnswers(prev => ({ ...prev, [qId]: optionText }));
  };

  const handleSubmitPracticeQuiz = async () => {
    if (!activePracticeQuiz) return;
    setIsEvaluatingPractice(true);

    const payload = {
      quizId: `practice_${Date.now()}`,
      topic: activePracticeQuiz.title,
      studentAnswers: practiceAnswers,
      questions: activePracticeQuiz.questions.map(q => ({
        id: q.id,
        options: q.options,
        correctAnswer: q.correctAnswer,
        sectionRef: q.sectionRef || activePracticeQuiz.sectionId
      }))
    };

    try {
      const data = await evaluateAssessment(payload);
      setPracticeResult(data);
    } catch (err) {
      alert("Error evaluating quiz: " + err.message);
    } finally {
      setIsEvaluatingPractice(false);
    }
  };

  const handleSavePracticePlan = async () => {
    if (!practiceResult || !activePracticeQuiz) return;
    setIsSavingPracticePlan(true);

    const payload = {
      confirmed: true,
      studentId: STUDENT_PROFILE.id,
      studentName: STUDENT_PROFILE.name,
      topic: activePracticeQuiz.title,
      score: practiceResult.score,
      totalQuestions: practiceResult.total || 3,
      activities: practiceResult.proposedActivities || [],
      references: [activePracticeQuiz.sectionId]
    };

    try {
      const data = await saveStudyPlan(payload);
      setPracticePlanSaved(true);
      alert(`Study Plan Successfully Saved!`);
      fetchSavedPlans();
    } catch (err) {
      alert("Failed to save study plan: " + err.message);
    } finally {
      setIsSavingPracticePlan(false);
    }
  };

  const handleResetPracticeQuiz = () => {
    setPracticeAnswers({});
    setPracticeResult(null);
    setPracticePlanSaved(false);
  };

  const navItems = [
    { name: 'Welcome', icon: '✨' },
    { name: 'Dashboard', icon: '📊' },
    { name: 'AI Tutor', icon: '🤖' },
    { name: 'Materials', icon: '📄' },
    { name: 'Quizzes', icon: '📝' },
    { name: 'Study Plans', icon: '🎯' }
  ];

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-100 font-sans text-slate-900 overflow-hidden relative">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shadow-2xl md:shadow-xl shrink-0 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          <div className="flex items-center justify-between px-3 py-4 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl text-base font-bold shadow-sm">🎓</div>
              <div>
                <h1 className="font-extrabold text-xs tracking-wider">STUDY PLATFORM</h1>
                <p className="text-[10px] text-indigo-400 font-medium">CS101 Python Tutor</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg text-lg focus:outline-none"
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === item.name 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Student Profile (No Login Gate) */}
        <div className="space-y-2 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm border-2 border-indigo-500 shrink-0">
              JL
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">{STUDENT_PROFILE.name}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">ID: {STUDENT_PROFILE.id}</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 text-center font-medium py-1">
            Enrolled: <span className="text-emerald-400 font-semibold">{STUDENT_PROFILE.semester}</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 md:px-8 sm:py-4 flex items-center justify-between shadow-xs gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none shrink-0"
              aria-label="Open sidebar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{activeTab}</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">{STUDENT_PROFILE.course}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {backendStatus.connected ? (
              <span className="text-[10px] sm:text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold whitespace-nowrap flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full font-medium whitespace-nowrap flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Connecting...</span>
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">

          {/* WELCOME PAGE */}
          {activeTab === 'Welcome' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 sm:p-8 shadow-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 z-10 w-full md:w-auto">
                  <span className="inline-block bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                    Academic Support Active
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">Hello, {STUDENT_PROFILE.name}!</h3>
                  <p className="text-xs text-indigo-100 max-w-lg leading-relaxed">
                    Your AI Study Support Tutor assesses your understanding of Python programming topics, evaluates quizzes with instant feedback, and formulates tailored study plans.
                  </p>
                  <button 
                    onClick={() => setActiveTab('AI Tutor')}
                    className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-50 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Start Topic Assessment ➔
                  </button>
                </div>
                <div className="w-24 h-24 md:w-36 md:h-36 bg-indigo-700/50 rounded-2xl border border-indigo-400/40 flex items-center justify-center text-4xl shadow-lg shrink-0">
                  🐍
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="text-indigo-600 text-xl font-bold">📄 Course Syllabus</div>
                    <h4 className="font-bold text-sm text-slate-900">Explore Materials</h4>
                    <p className="text-xs text-slate-500">Read Python course modules, review key concepts, and inspect syntax notes.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('Materials')}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-indigo-700 font-semibold py-2 rounded-xl text-xs transition border border-slate-200"
                  >
                    Open Materials ➔
                  </button>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="text-indigo-600 text-xl font-bold">📝 Practice Quizzes</div>
                    <h4 className="font-bold text-sm text-slate-900">Test Understanding</h4>
                    <p className="text-xs text-slate-500">Take 3-question module multiple-choice quizzes with deterministic scoring.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('Quizzes')}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-indigo-700 font-semibold py-2 rounded-xl text-xs transition border border-slate-200"
                  >
                    Start Quizzes ➔
                  </button>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 sm:col-span-2 md:col-span-1">
                  <div className="space-y-2">
                    <div className="text-indigo-600 text-xl font-bold">🎯 Tailored Plans</div>
                    <h4 className="font-bold text-sm text-slate-900">Saved Study Plans</h4>
                    <p className="text-xs text-slate-500">Reopen confirmed mastery or remedial study activities saved to your profile.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('Study Plans')}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-indigo-700 font-semibold py-2 rounded-xl text-xs transition border border-slate-200"
                  >
                    View Saved Plans ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI TUTOR PAGE */}
          {activeTab === 'AI Tutor' && (
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Step 1: Topic Input */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">1. Select Course Topic</h3>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Python list mutability and tuples, Functions, OOP classes" 
                    className="w-full flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-md shrink-0"
                  >
                    {isSearching ? "Searching..." : "Search Topic"}
                  </button>
                </form>

                {/* Clarification prompt for ambiguous topic */}
                {clarificationPrompt && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 space-y-3">
                    <div className="flex items-start space-x-2">
                      <span className="shrink-0 text-base">💡</span>
                      <div>
                        <p className="font-bold mb-1">Clarification Requested:</p>
                        <p>{clarificationPrompt}</p>
                      </div>
                    </div>
                    {clarificationOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {clarificationOptions.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setTopic(opt.title);
                              handleSearch(null, opt.title);
                            }}
                            className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
                          >
                            Section {opt.number}: {opt.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Out of scope warning */}
                {scopeWarning && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4 flex items-start space-x-2">
                    <span className="shrink-0 text-base">⚠️</span>
                    <div>
                      <p className="font-bold mb-1">Topic Outside Syllabus:</p>
                      <p>{scopeWarning}</p>
                    </div>
                  </div>
                )}

                {matchingSections.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {matchingSections.map(sec => {
                      const isExpanded = !!expandedSections[sec.id];
                      const text = sec.content || sec.summary || '';
                      const isLong = text.length > 180;

                      return (
                        <div key={sec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-indigo-700 bg-indigo-100 font-mono font-bold px-2 py-0.5 rounded">{sec.id}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Section {sec.number}</span>
                          </div>
                          <p className="font-bold text-sm text-slate-900">{sec.title}</p>
                          <div className="text-xs text-slate-600 leading-relaxed">
                            {isLong && !isExpanded ? (
                              <p>
                                {text.slice(0, 180)}
                                <button
                                  type="button"
                                  onClick={() => toggleSectionExpand(sec.id)}
                                  className="text-indigo-600 font-bold hover:text-indigo-800 ml-1.5 inline-flex items-center cursor-pointer focus:outline-none"
                                >
                                  ...more
                                </button>
                              </p>
                            ) : (
                              <p>
                                {text}
                                {isLong && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSectionExpand(sec.id)}
                                    className="text-indigo-600 font-bold hover:text-indigo-800 ml-1.5 inline-flex items-center cursor-pointer focus:outline-none text-[11px]"
                                  >
                                    (show less)
                                  </button>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Interactive Quiz */}
              {quizData && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">2. Knowledge Assessment Quiz</h3>
                      <p className="text-xs text-slate-500">3 Multiple Choice Questions Grounded in Syllabus</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quizData.map((q, idx) => (
                      <div key={q.id} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 font-mono">{q.sectionRef}</span>
                            <span className="text-[10px] text-slate-400">Q{idx + 1}</span>
                          </div>
                          <p className="font-semibold text-xs text-slate-900 mb-3">{q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => (
                              <label key={oIdx} className="flex items-start space-x-2.5 text-xs cursor-pointer p-2.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition select-none border border-slate-100 bg-white">
                                <input 
                                  type="radio" 
                                  name={`question_${q.id}`} 
                                  checked={userAnswers[q.id] === opt}
                                  onChange={() => handleOptionSelect(q.id, opt)}
                                  className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-600 shrink-0"
                                />
                                <span className="leading-snug text-slate-800">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleSubmitQuiz} 
                    disabled={isEvaluating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-xl text-sm font-semibold transition shadow-md"
                  >
                    {isEvaluating ? "Evaluating Assessment..." : "Submit Quiz & Calculate Results"}
                  </button>
                </div>
              )}

              {/* Step 3: Recommendations & Study Plan */}
              {scoreResult && studyPlan && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-emerald-200 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">3. Formulated Study Activities</h3>
                      <p className="text-xs text-slate-500">
                        {scoreResult.score === 3 
                          ? "Mastery Level Achieved (Score: 3/3). Advanced deep-dive activities proposed." 
                          : `Remedial Plan for Missed Sections (Score: ${scoreResult.score}/${scoreResult.total}).`}
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-left sm:text-right w-full sm:w-auto">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Calculated Score</p>
                      <p className="text-base sm:text-lg font-extrabold text-emerald-800">
                        {scoreResult.score} / {scoreResult.total} ({Math.round((scoreResult.score / scoreResult.total) * 100)}%)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {studyPlan.map((act, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                            Ref: {act.sectionRef}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-900">{act.title}</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{act.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Confirmation Gate before DB write */}
                  <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs text-slate-600">
                      Save this tailored study plan to your profile to track your academic progress.
                    </p>
                    <button 
                      onClick={handleSavePlan} 
                      disabled={isSavingPlan}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md shrink-0"
                    >
                      {isSavingPlan ? "Saving Study Plan..." : "Save Study Plan ➔"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl text-2xl shrink-0">📚</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Enrolled Course</p>
                    <p className="text-sm font-bold text-slate-900 truncate">CS101 Python</p>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl text-2xl shrink-0">🎯</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Latest Quiz Score</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">
                      {practiceResult ? `${practiceResult.score}/${practiceResult.total}` : (scoreResult ? `${scoreResult.score}/${scoreResult.total}` : (savedPlans[0] ? `${savedPlans[0].score}/${savedPlans[0].total_questions || 3}` : 'Ready to start'))}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs sm:col-span-2 md:col-span-1">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl text-2xl shrink-0">💾</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Saved Study Plans</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">{savedPlans.length} Plans</p>
                  </div>
                </div>
              </div>

              {/* Dedicated Task Navigation */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Learning Portals & Tools</h3>
                  <p className="text-xs text-slate-500">Select any section to launch its dedicated workflow.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => setActiveTab('AI Tutor')} 
                    className="p-4 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 rounded-2xl text-left transition space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xl">🤖</span>
                      <p className="font-bold text-xs text-indigo-950 mt-1">AI Study Tutor</p>
                      <p className="text-[11px] text-slate-600 leading-snug">Ask any Python topic and generate custom quizzes.</p>
                    </div>
                    <span className="text-[11px] text-indigo-600 font-bold">Open Tutor ➔</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('Quizzes')} 
                    className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 rounded-2xl text-left transition space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xl">📝</span>
                      <p className="font-bold text-xs text-emerald-950 mt-1">Practice Quizzes</p>
                      <p className="text-[11px] text-slate-600 leading-snug">Take 3-question MCQ assessments right in Quizzes.</p>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold">Take Quiz ➔</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('Materials')} 
                    className="p-4 bg-sky-50/70 hover:bg-sky-100/70 border border-sky-100 rounded-2xl text-left transition space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xl">📚</span>
                      <p className="font-bold text-xs text-sky-950 mt-1">Course Syllabus</p>
                      <p className="text-[11px] text-slate-600 leading-snug">Read lecture notes, concepts, and keywords.</p>
                    </div>
                    <span className="text-[11px] text-sky-700 font-bold">Browse Notes ➔</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('Study Plans')} 
                    className="p-4 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 rounded-2xl text-left transition space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xl">🎯</span>
                      <p className="font-bold text-xs text-amber-950 mt-1">Saved Plans</p>
                      <p className="text-[11px] text-slate-600 leading-snug">Reopen confirmed mastery and remedial plans.</p>
                    </div>
                    <span className="text-[11px] text-amber-800 font-bold">Review Plans ➔</span>
                  </button>
                </div>
              </div>

              {/* Recent Saved Plans Preview */}
              {savedPlans.length > 0 && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recently Saved Plans</h4>
                    <button onClick={() => setActiveTab('Study Plans')} className="text-xs text-indigo-600 font-semibold hover:underline">
                      View All ({savedPlans.length})
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedPlans.slice(0, 2).map((plan) => (
                      <div key={plan.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate">{plan.topic}</p>
                          <p className="text-[11px] text-slate-500">Score: {plan.score}/{plan.total_questions || 3} • {new Date(plan.created_at).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={() => handleReopenPlan(plan.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                        >
                          Reopen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MATERIALS */}
          {activeTab === 'Materials' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Python Programming Course Syllabus (CS101)</h3>
                  <p className="text-xs text-slate-500">Read core lecture materials, review key concepts, and inspect syntax notes.</p>
                </div>
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    value={materialsSearch}
                    onChange={(e) => setMaterialsSearch(e.target.value)}
                    placeholder="Search topics, keywords..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {COURSE_SECTIONS.filter(sec => 
                  !materialsSearch.trim() || 
                  sec.title.toLowerCase().includes(materialsSearch.toLowerCase()) || 
                  sec.content.toLowerCase().includes(materialsSearch.toLowerCase()) ||
                  sec.keywords.some(k => k.toLowerCase().includes(materialsSearch.toLowerCase()))
                ).map((sec) => {
                  const isExpanded = expandedMaterial === sec.id;
                  return (
                    <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-3 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">{sec.id}</span>
                          <span className="text-xs text-slate-400 font-mono">Module {sec.number}</span>
                          <h4 className="font-bold text-sm text-slate-900">{sec.title}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setExpandedMaterial(isExpanded ? null : sec.id)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            {isExpanded ? "Hide Details ▲" : "Read Full Material ▼"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('Quizzes');
                              handleStartPracticeQuiz(sec.id, sec.title);
                            }}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Practice Quiz ➔
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{sec.summary}</p>

                      {isExpanded && (
                        <div className="space-y-4 pt-3 border-t border-slate-100 text-xs">
                          <div>
                            <h5 className="font-bold text-slate-900 mb-1">Detailed Syllabus Reading:</h5>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">{sec.content}</p>
                          </div>

                          <div>
                            <h5 className="font-bold text-slate-900 mb-2">Key Takeaways & Learning Objectives:</h5>
                            <ul className="space-y-1.5 pl-1">
                              {sec.key_concepts.map((concept, cIdx) => (
                                <li key={cIdx} className="flex items-start space-x-2 text-slate-700">
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span>{concept}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-bold text-slate-900 mb-2">Core Topic Keywords:</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {sec.keywords.map((kw, kIdx) => (
                                <span key={kIdx} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-mono">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUIZZES (Self-Contained Portal) */}
          {activeTab === 'Quizzes' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* View 1: Quiz Selection Menu */}
              {!activePracticeQuiz && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">Python Practice Quizzes</h3>
                    <p className="text-xs text-slate-500">Select a course module below to test your understanding right here.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {COURSE_SECTIONS.map((sec) => (
                      <div key={sec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{sec.id}</span>
                            <span className="text-xs text-slate-400 font-mono">Section {sec.number}</span>
                          </div>
                          <p className="font-bold text-xs sm:text-sm text-slate-900">{sec.title}</p>
                          <p className="text-xs text-slate-500">{sec.summary}</p>
                        </div>
                        <button 
                          onClick={() => handleStartPracticeQuiz(sec.id, sec.title)}
                          disabled={loadingPracticeQuiz}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition shadow-sm"
                        >
                          {loadingPracticeQuiz ? "Preparing Quiz..." : "Start Quiz ➔"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 2: Active Quiz Questions */}
              {activePracticeQuiz && !practiceResult && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">{activePracticeQuiz.sectionId}</span>
                        <span className="text-xs text-slate-400 font-mono">Practice Assessment</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{activePracticeQuiz.title}</h3>
                    </div>
                    <button 
                      onClick={() => setActivePracticeQuiz(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
                    >
                      ✕ Exit Quiz
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activePracticeQuiz.questions.map((q, idx) => (
                      <div key={q.id || idx} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 font-mono">Q{idx + 1}</span>
                            <span className="text-[10px] text-slate-400">{q.sectionRef || activePracticeQuiz.sectionId}</span>
                          </div>
                          <p className="font-semibold text-xs text-slate-900 mb-3 leading-snug">{q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => (
                              <label key={oIdx} className="flex items-start space-x-2.5 text-xs cursor-pointer p-2.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition select-none border border-slate-100 bg-white">
                                <input 
                                  type="radio" 
                                  name={`practice_q_${q.id || idx}`} 
                                  checked={practiceAnswers[q.id || (idx + 1)] === opt}
                                  onChange={() => handlePracticeOptionSelect(q.id || (idx + 1), opt)}
                                  className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-600 shrink-0"
                                />
                                <span className="leading-snug text-slate-800">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={handleSubmitPracticeQuiz} 
                      disabled={isEvaluatingPractice}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-xl text-sm font-semibold transition shadow-md"
                    >
                      {isEvaluatingPractice ? "Calculating Score in Application Code..." : "Submit Quiz & View Results"}
                    </button>
                    <button 
                      onClick={() => setActivePracticeQuiz(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* View 3: Quiz Results & Study Plan (Within Quizzes Tab) */}
              {activePracticeQuiz && practiceResult && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-emerald-200 shadow-lg space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Assessment Completed</span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{activePracticeQuiz.title}</h3>
                      <p className="text-xs text-slate-500">
                        {practiceResult.score === 3 
                          ? "Perfect score! 3 advanced mastery activities formulated."
                          : `Score: ${practiceResult.score}/${practiceResult.total}. Remedial activities formulated for missed concepts.`}
                      </p>
                    </div>
                    <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left sm:text-right">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Calculated Score</p>
                      <p className="text-xl sm:text-2xl font-extrabold text-emerald-800">
                        {practiceResult.score} / {practiceResult.total} ({Math.round((practiceResult.score / practiceResult.total) * 100)}%)
                      </p>
                    </div>
                  </div>

                  {/* Formulated Activities */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Tailored Study Activities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(practiceResult.proposedActivities || []).map((act, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                            Ref: {act.sectionRef}
                          </span>
                          <p className="font-bold text-xs text-slate-900">{act.title}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quizzes Tab Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs text-slate-600">
                      {practicePlanSaved ? "✓ Study plan successfully saved to your profile!" : "Save these activities to your profile to track your progress."}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {!practicePlanSaved ? (
                        <button 
                          onClick={handleSavePracticePlan} 
                          disabled={isSavingPracticePlan}
                          className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
                        >
                          {isSavingPracticePlan ? "Saving Plan..." : "Save Study Plan ➔"}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold px-3 py-2 bg-emerald-100 rounded-lg">
                          Plan Saved ✓
                        </span>
                      )}
                      <button 
                        onClick={handleResetPracticeQuiz} 
                        className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition"
                      >
                        Retake Quiz
                      </button>
                      <button 
                        onClick={() => {
                          setActivePracticeQuiz(null);
                          setPracticeResult(null);
                        }} 
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition"
                      >
                        All Quizzes
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STUDY PLANS */}
          {activeTab === 'Study Plans' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Saved Study Plans</h3>
                  <p className="text-xs text-slate-500">Reopen and review your personalized study plans.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={fetchSavedPlans} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-md font-semibold text-slate-700">
                    ↻ Refresh
                  </button>
                  <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md font-bold">{savedPlans.length} Total</span>
                </div>
              </div>

              {savedPlans.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl text-xs space-y-2">
                  <p>No study plans saved yet.</p>
                  <p>Go to <strong className="text-indigo-600 cursor-pointer" onClick={() => setActiveTab('AI Tutor')}>AI Tutor</strong> to complete an assessment and save a study plan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlans.map((plan) => (
                    <div key={plan.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-indigo-600 font-mono truncate max-w-xs">{plan.id}</span>
                          <span className="text-[10px] text-slate-400">● {new Date(plan.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">Topic: {plan.topic} | Student: {plan.student_name}</p>
                        <p className="text-xs text-emerald-700 font-bold">Score: {plan.score}/{plan.total_questions || 3}</p>
                        <p className="text-[11px] text-slate-500">
                          References: {Array.isArray(plan.section_references) ? plan.section_references.join(', ') : JSON.stringify(plan.section_references)}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleReopenPlan(plan.id)} 
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition"
                      >
                        Reopen Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* REOPENED PLAN MODAL */}
      {reopenedPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 z-50">
          <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Saved Study Plan</h3>
                <p className="text-xs text-slate-400 font-mono">Plan ID: {reopenedPlanModal.id}</p>
              </div>
              <button onClick={() => setReopenedPlanModal(null)} className="text-slate-400 hover:text-slate-800 text-xl font-bold p-1">&times;</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><strong>Student:</strong> {reopenedPlanModal.student_name} ({reopenedPlanModal.student_id})</p>
              <p><strong>Topic:</strong> {reopenedPlanModal.topic}</p>
              <p><strong>Assessment Score:</strong> {reopenedPlanModal.score} / {reopenedPlanModal.total_questions || 3}</p>
              <p><strong>Saved At:</strong> {new Date(reopenedPlanModal.created_at).toLocaleString()}</p>
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-2">Preserved Study Activities:</h4>
              <div className="space-y-2">
                {(Array.isArray(reopenedPlanModal.activities) ? reopenedPlanModal.activities : []).map((act, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                      {act.sectionRef || act.sectionId || "General"}
                    </span>
                    <p className="font-bold text-xs text-slate-900">{act.title}</p>
                    <p className="text-xs text-slate-600">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setReopenedPlanModal(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
