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
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-indigo-600 text-xl font-bold">📄 Topic Search</div>
                  <h4 className="font-bold text-sm text-slate-900">Explore Syllabus</h4>
                  <p className="text-xs text-slate-500">Search Python course modules and identify key concepts to assess.</p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-indigo-600 text-xl font-bold">📝 Knowledge Quizzes</div>
                  <h4 className="font-bold text-sm text-slate-900">Test Understanding</h4>
                  <p className="text-xs text-slate-500">Answer 3 grounded multiple-choice questions with instant scoring.</p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 sm:col-span-2 md:col-span-1">
                  <div className="text-indigo-600 text-xl font-bold">🎯 Tailored Study Plan</div>
                  <h4 className="font-bold text-sm text-slate-900">Master Concepts</h4>
                  <p className="text-xs text-slate-500">Receive customized remedial or mastery activities to level up your Python skills.</p>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl text-2xl shrink-0">📚</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Course</p>
                    <p className="text-sm font-bold text-slate-900 truncate">CS101 Python</p>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl text-2xl shrink-0">🎯</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Last Quiz Score</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">{scoreResult ? `${scoreResult.score}/${scoreResult.total}` : 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs sm:col-span-2 md:col-span-1">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl text-2xl shrink-0">💾</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">PostgreSQL Saved Plans</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">{savedPlans.length} Plans</p>
                  </div>
                </div>
              </div>

              {/* Quick Launch */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Recommended Next Steps</h3>
                <div className="flex gap-3">
                  <button onClick={() => setActiveTab('AI Tutor')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition">
                    Run Knowledge Assessment
                  </button>
                  <button onClick={() => setActiveTab('Study Plans')} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-200 transition">
                    View Saved Plans in PostgreSQL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MATERIALS */}
          {activeTab === 'Materials' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Python Programming Course Syllabus (CS101)</h3>
                <span className="text-xs text-slate-400 font-mono">3 Core Modules</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {(courseMaterials.length > 0 ? courseMaterials : [
                  { id: "SEC-PY-101", title: "Variables, Dynamic Typing & Core Data Structures", content: "Lists are mutable collections. Tuples are immutable sequences." },
                  { id: "SEC-PY-102", title: "Control Flow, Loops & Functions", content: "Indentation-based scoping, loops, and LEGB variable scoping rules." },
                  { id: "SEC-PY-103", title: "Object-Oriented Programming (OOP) in Python", content: "Classes, instances, the __init__ constructor, self reference, and super()." }
                ]).map((mat) => (
                  <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col p-5 space-y-2">
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded w-fit">{mat.id}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-2 mb-1">{mat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{mat.content}</p>
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          setTopic(mat.title);
                          setActiveTab('AI Tutor');
                          handleSearch(null, mat.title);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Assess Topic ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUIZZES */}
          {activeTab === 'Quizzes' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Available Practice Quizzes</h3>
              <p className="text-xs text-slate-500 font-medium">3-Question MCQs Grounded Exclusively in Course Material.</p>
              
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-xs text-slate-900">Section 1: Variables & Data Structures Quiz</p>
                    <p className="text-[11px] text-slate-500">Covers SEC-PY-101 (Lists vs Tuples, Dict Mutability)</p>
                  </div>
                  <button 
                    onClick={() => {
                      setTopic("Python list mutability and tuples");
                      setActiveTab('AI Tutor');
                      handleSearch(null, "Python list mutability and tuples");
                    }} 
                    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
                  >
                    Start Quiz
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-xs text-slate-900">Section 2: Control Flow & Functions Quiz</p>
                    <p className="text-[11px] text-slate-500">Covers SEC-PY-102 (Loops, def, return, LEGB scope)</p>
                  </div>
                  <button 
                    onClick={() => {
                      setTopic("Functions and variable scope");
                      setActiveTab('AI Tutor');
                      handleSearch(null, "Functions and variable scope");
                    }} 
                    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
                  >
                    Start Quiz
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-xs text-slate-900">Section 3: Object-Oriented Programming Quiz</p>
                    <p className="text-[11px] text-slate-500">Covers SEC-PY-103 (Classes, self, __init__, super)</p>
                  </div>
                  <button 
                    onClick={() => {
                      setTopic("OOP classes and inheritance");
                      setActiveTab('AI Tutor');
                      handleSearch(null, "OOP classes and inheritance");
                    }} 
                    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
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
