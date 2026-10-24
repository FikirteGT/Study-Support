import React, { useState, useEffect } from 'react';
import { api } from './api';

// --- COURSE SECTIONS (match backend/src/data/demoMaterials.js) ---
const STUDENT = { id: 'PY-2026-01', name: 'Jordan Lee' };
const DEMO_TEACHING_MATERIAL = [
  {
    id: "SEC-PY-101",
    title: "1. Variables, Dynamic Typing & Core Data Structures",
    content: "Dynamic typing, lists vs tuples (mutable vs immutable) and dictionaries as key-value pairs.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "SEC-PY-102",
    title: "2. Control Flow, Loops & Functions",
    content: "Indentation, if/elif/else, for and while loops, defining functions, return values and LEGB scope.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "SEC-PY-103",
    title: "3. Object-Oriented Programming (OOP) in Python",
    content: "Classes and instances, __init__, self, inheritance and super().",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60"
  }
];

export default function App() {
  const [authStage, setAuthStage] = useState('login');
  const [studentIdInput, setStudentIdInput] = useState('PY-2026-01');
  const [passwordInput, setPasswordInput] = useState('••••••••');
  
  const [activeTab, setActiveTab] = useState('Welcome');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [topic, setTopic] = useState('');
  const [matchingSections, setMatchingSections] = useState([]);
  const [scopeWarning, setScopeWarning] = useState('');
  const [clarificationPrompt, setClarificationPrompt] = useState('');
  
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  
  const [inspectorLogs, setInspectorLogs] = useState([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Backend-driven state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [clarificationOptions, setClarificationOptions] = useState([]);
  const [quizToken, setQuizToken] = useState(null);
  const [quizSource, setQuizSource] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [openPlan, setOpenPlan] = useState(null);
  const [serverState, setServerState] = useState('checking');

  const loadPlans = async () => {
    try {
      const data = await api.listPlans();
      setSavedPlans(data.plans || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    let finished = false;
    const timer = setTimeout(() => { if (!finished) setServerState('waking'); }, 2500);
    api.health()
      .then(() => setServerState('ready'))
      .catch(() => setServerState('down'))
      .finally(() => { finished = true; clearTimeout(timer); });
    loadPlans();
  }, []);

  useEffect(() => {
    if (activeTab === 'Study Plans' || activeTab === 'Dashboard') loadPlans();
  }, [activeTab]);

  const logInspector = (toolName, payload, response) => {
    setInspectorLogs(prev => [
      { toolName, payload, response, time: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthStage('app');
    setActiveTab('Welcome');
    logInspector('student_login', { studentId: studentIdInput }, { status: 'Authenticated' });
  };

  const studentAnswersPayload = () =>
    Object.fromEntries(quizData.map((q, i) => [q.id, userAnswers[i]]));

  // TOOL 1 + quiz generation: POST /api/agent/prompt (the agent searches the syllabus, then writes 3 MCQs)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(''); setNotice(''); setScopeWarning(''); setClarificationPrompt(''); setClarificationOptions([]);
    setQuizData(null); setScoreResult(null); setStudyPlan(null); setQuizToken(null); setMatchingSections([]);

    const q = topic.trim();
    if (!q) { setError('Please enter a course topic.'); return; }

    setLoading(true);
    try {
      const out = await api.prompt(q);
      (out.toolCalls || []).forEach(c => logInspector(c.tool, c.input, c.output));

      if (out.status === 'clarification_needed') {
        setClarificationPrompt(out.message);
        setClarificationOptions(out.options || []);
      } else if (out.status === 'out_of_scope') {
        setScopeWarning(out.message);
      } else if (out.status === 'matched') {
        const image = DEMO_TEACHING_MATERIAL.find(m => m.id === out.section.id)?.image;
        setMatchingSections([{ ...out.section, image }]);
        setQuizData(out.questions);
        setQuizToken(out.quizToken);
        setQuizSource(out.source);
        setUserAnswers({});
        logInspector('generate_quiz', { sectionId: out.section.id }, { questions: out.questions.length, source: out.source });
      } else {
        setError(out.message || 'Unexpected response from the agent.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chooseSection = (option) => {
    setTopic(`Section ${option.number}`);
    setTimeout(() => document.getElementById('topic-form')?.requestSubmit(), 0);
  };

  const handleOptionSelect = (qIdx, oIdx) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  // TOOL 2: POST /api/assess (scored on the server; the browser never sees the answer key)
  const handleSubmitQuiz = async () => {
    if (!quizData || loading) return;
    if (quizData.some((_, i) => userAnswers[i] === undefined)) {
      setError('Answer all 3 questions before submitting.');
      return;
    }
    setError(''); setLoading(true);
    try {
      const studentAnswers = studentAnswersPayload();
      const r = await api.assess(quizToken, studentAnswers);
      setScoreResult({ ...r, percentage: `${Math.round((r.score / r.total) * 100)}%` });
      setStudyPlan(r.activities);
      logInspector('check_assessment', { studentAnswers }, { score: r.score, total: r.total, mistakes: r.mistakes });
      logInspector('propose_study_plan', { score: `${r.score}/${r.total}` }, { activities: r.activities.length });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // TOOL 3: POST /api/plans (only after the student presses Confirm in the modal)
  const handleConfirmSave = async () => {
    setSaving(true); setError('');
    try {
      const r = await api.savePlan({
        confirmed: true,
        studentId: STUDENT.id,
        studentName: STUDENT.name,
        quizToken,
        studentAnswers: studentAnswersPayload(),
      });
      logInspector('save_study_plan', { confirmed: true }, { planId: r.planId });
      setShowConfirm(false);
      setNotice(`Study plan saved to the remote database. Plan ID: ${r.planId}`);
      await loadPlans();
    } catch (err) {
      setShowConfirm(false);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async (id) => {
    try {
      const data = await api.getPlan(id);
      setOpenPlan(data.plan);
      logInspector('reopen_plan', { id }, { score: data.plan.score });
    } catch (err) {
      setError(err.message);
    }
  };

  const navItems = [
    { name: 'Welcome', icon: '✨' },
    { name: 'Dashboard', icon: '📊' },
    { name: 'AI Tutor', icon: '🤖' },
    { name: 'Materials', icon: '📄' },
    { name: 'Quizzes', icon: '📝' },
    { name: 'Progress', icon: '📈' },
    { name: 'Study Plans', icon: '🎯' }
  ];

  // LOGIN PAGE
  if (authStage === 'login') {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-indigo-600 text-white p-3 rounded-2xl text-2xl font-bold shadow-lg shadow-indigo-500/30">🎓</div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">ACADEMIC SUPPORT PORTAL</h1>
            <p className="text-xs text-slate-400">Sign in to your student workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID / Email</label>
              <input 
                type="text" 
                value={studentIdInput} 
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                required 
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition shadow-lg">
              Secure Sign In
            </button>
          </form>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 text-center">
            Demo Student Profile: <span className="text-indigo-400 font-mono">Jordan Lee (PY-2026-01)</span>
          </div>
        </div>
      </div>
    );
  }

  // MAIN PORTAL
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

      {/* SIDEBAR NAVIGATION (Desktop static, Mobile slide-over drawer) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shadow-2xl md:shadow-xl shrink-0 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          <div className="flex items-center justify-between px-3 py-4 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl text-base font-bold shadow-sm">🎓</div>
              <div>
                <h1 className="font-extrabold text-xs tracking-wider">STUDY PLATFORM</h1>
                <p className="text-[10px] text-indigo-400 font-medium">Academic Support Agent</p>
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

        <div className="space-y-2 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center space-x-3">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
              alt="Student Avatar" 
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500 shrink-0"
            />
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">Jordan Lee</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">ID: PY-2026-01</p>
            </div>
          </div>
          <button 
            onClick={() => setAuthStage('login')} 
            className="w-full text-center text-xs text-slate-400 hover:text-red-400 py-1.5 transition font-medium"
          >
            Sign Out
          </button>
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
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">Professional Academic Support Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button 
              onClick={() => setIsInspectorOpen(true)}
              className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-semibold hover:bg-indigo-100 transition flex items-center space-x-1 sm:space-x-1.5"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Backend Tool </span>
              <span>Inspector</span>
            </button>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold whitespace-nowrap">● Connected</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">

          {/* WELCOME PAGE */}
          {activeTab === 'Welcome' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 sm:p-8 shadow-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 z-10 w-full md:w-auto">
                  <span className="inline-block bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                    Welcome to Your Portal
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">Hello, Jordan Lee!</h3>
                  <p className="text-xs text-indigo-100 max-w-lg leading-relaxed">
                    Your AI Academic Support Agent is ready to evaluate your knowledge on course topics, generate targeted quizzes, and build personalized study plans based on team demo materials.
                  </p>
                  <button 
                    onClick={() => setActiveTab('AI Tutor')}
                    className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-50 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Start AI Assessment ➔
                  </button>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80" 
                  alt="Welcome Hero" 
                  className="w-full max-w-xs md:w-48 h-36 object-cover rounded-xl shadow-lg border border-indigo-400/30 z-10 shrink-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-indigo-600 text-xl font-bold">📄 01</div>
                  <h4 className="font-bold text-sm text-slate-900">Material Search</h4>
                  <p className="text-xs text-slate-500">Scan verified demo sections with intelligent scope boundary enforcement.</p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-indigo-600 text-xl font-bold">📝 02</div>
                  <h4 className="font-bold text-sm text-slate-900">Assessment & Scoring</h4>
                  <p className="text-xs text-slate-500">Take 3-question MCQ quizzes with instant app-code grading logic.</p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 sm:col-span-2 md:col-span-1">
                  <div className="text-indigo-600 text-xl font-bold">🎯 03</div>
                  <h4 className="font-bold text-sm text-slate-900">Study Plans</h4>
                  <p className="text-xs text-slate-500">Generate, confirm, and securely persist customized study plans.</p>
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
                  <span className="text-xs text-slate-400 font-mono">search_material</span>
                </div>

                <form id="topic-form" onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Python list mutability and tuples" 
                    className="w-full flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                  <button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-md shrink-0">
                    Search Topic
                  </button>
                </form>

                {serverState === 'waking' && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 mb-4">Waking up the server (free hosting sleeps when idle). This can take up to a minute.</div>
                )}
                {serverState === 'down' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">The API is not reachable. Check VITE_API_URL and that the backend is running.</div>
                )}
                {loading && <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-4">Working…</div>}
                {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">{error}</div>}
                {notice && <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4">{notice}</div>}
                {clarificationOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {clarificationOptions.map(o => (
                      <button key={o.id} type="button" onClick={() => chooseSection(o)} className="px-3 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50">
                        Section {o.number}: {o.title}
                      </button>
                    ))}
                  </div>
                )}
                {/* Clarification prompt for ambiguous topic */}
                {clarificationPrompt && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-start space-x-2">
                    <span className="shrink-0 text-base">💡</span>
                    <div>
                      <p className="font-bold mb-1">Clarification Requested by AI Tutor:</p>
                      <p>{clarificationPrompt}</p>
                    </div>
                  </div>
                )}

                {/* Out of scope warning */}
                {scopeWarning && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4 flex items-start space-x-2">
                    <span className="shrink-0 text-base">⚠️</span>
                    <div>
                      <p className="font-bold mb-1">Topic Outside Demo Material:</p>
                      <p>{scopeWarning}</p>
                    </div>
                  </div>
                )}

                {matchingSections.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {matchingSections.map(sec => (
                      <div key={sec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex space-x-3 items-center">
                        <img src={sec.image} alt={sec.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="overflow-hidden min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{sec.title}</p>
                          <span className="text-[10px] text-indigo-600 font-mono font-semibold">{sec.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Interactive Quiz */}
              {quizData && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">2. Knowledge Assessment Quiz</h3>
                    <span className="text-xs text-slate-400 font-mono">check_assessment{quizSource === 'fallback' ? ' · offline question bank' : quizSource === 'gemini' ? ' · generated by Gemini' : ''}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quizData.map((q, idx) => (
                      <div key={q.id} className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 mb-2">{idx + 1}. {q.question}</p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, oIdx) => (
                              <label key={oIdx} className="flex items-center space-x-2.5 text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition select-none">
                                <input 
                                  type="radio" 
                                  name={`q${idx}`} 
                                  checked={userAnswers[idx] === oIdx}
                                  onChange={() => handleOptionSelect(idx, oIdx)}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-600 shrink-0"
                                />
                                <span className="leading-snug">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleSubmitQuiz} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold transition shadow-md">
                    Submit Quiz & Get Recommendations
                  </button>
                </div>
              )}

              {/* Step 3: Recommendations & Study Plan (Appears AFTER Quiz Submission) */}
              {scoreResult && studyPlan && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-emerald-200 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">3. Recommended Study Plan & Next Steps</h3>
                      <p className="text-xs text-slate-500">Tailored activities based on your assessment results.</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-left sm:text-right w-full sm:w-auto">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Score Achieved</p>
                      <p className="text-base sm:text-lg font-extrabold text-emerald-800">{scoreResult.score} / {scoreResult.total} ({scoreResult.percentage})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {studyPlan.map((act, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono font-bold">Ref: {act.sectionRef}</span>
                        </div>
                        <p className="font-bold text-xs text-slate-900">{act.title}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{act.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {scoreResult.results.map((r, i) => (
                      <div key={r.id} className={`p-3 rounded-xl border text-xs ${r.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                        <p className="font-semibold">{r.correct ? '✓ Correct' : '✗ Incorrect'}: {i + 1}. {r.question}</p>
                        {!r.correct && <p className="mt-1">Your answer: {r.options[r.chosenIndex]} · Correct: {r.options[r.correctIndex]}</p>}
                        <p className="mt-1 opacity-80">{r.explanation} <span className="font-mono">[{r.sectionRef}]</span></p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button onClick={() => setShowConfirm(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md">
                      Confirm & Save Study Plan
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
                    <p className="text-xs text-slate-500 font-medium">Active Topic</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 truncate">Python Basics</p>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl text-2xl shrink-0">🎯</div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Last Quiz Score</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">{scoreResult ? scoreResult.percentage : '-'}</p>
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
            </div>
          )}

          {/* MATERIALS */}
          {activeTab === 'Materials' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {DEMO_TEACHING_MATERIAL.map((mat) => (
                <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col">
                  <img src={mat.image} alt={mat.title} className="w-full h-36 object-cover" />
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{mat.id}</span>
                      <h4 className="font-bold text-sm text-slate-900 mt-2 mb-1">{mat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{mat.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* QUIZZES */}
          {activeTab === 'Quizzes' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Available Quizzes</h3>
              <p className="text-xs text-slate-500 font-medium">Take quizzes directly generated from team demo materials.</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-xs text-slate-900">Python Data Structures Quiz (3 Questions)</p>
                  <p className="text-[11px] text-slate-500">Covers SEC-PY-101, SEC-PY-102, SEC-PY-103</p>
                </div>
                <button onClick={() => setActiveTab('AI Tutor')} className="w-full sm:w-auto bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* PROGRESS */}
          {activeTab === 'Progress' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Student Progress Metrics</h3>
              <p className="text-xs text-slate-500 font-medium">Student: Jordan Lee (PY-2026-01)</p>
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
                ✅ Completed topic assessment on <strong>Python Basics</strong>.
              </div>
            </div>
          )}

          {/* STUDY PLANS */}
          {activeTab === 'Study Plans' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Saved Study Plans</h3>
                  <p className="text-xs text-slate-500">Latest plans stored in the remote database. Reopen one to load it from the database.</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md font-bold">{savedPlans.length} Total</span>
              </div>
              {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}
              {savedPlans.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl text-xs">
                  No plans saved yet. Go to <strong className="text-indigo-600 cursor-pointer" onClick={() => setActiveTab('AI Tutor')}>AI Tutor</strong> to take an assessment and save your plan.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlans.map((plan) => (
                    <div key={plan.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{plan.topic}</p>
                        <p className="text-[11px] text-slate-500">Score {plan.score}/{plan.total_questions} · {plan.student_name} · {new Date(plan.created_at).toLocaleString()}</p>
                        <p className="font-mono text-[10px] text-indigo-600">{plan.id}</p>
                      </div>
                      <button onClick={() => handleReopen(plan.id)} className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">
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

      {/* CONFIRMATION MODAL (FR-5: nothing is saved until the student confirms) */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Confirm save">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Save this study plan?</h3>
            <p className="text-xs text-slate-600">Score {scoreResult?.score}/{scoreResult?.total} and the 3 recommended activities will be stored in the remote database for {STUDENT.name} ({STUDENT.id}).</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} disabled={saving} className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700">Cancel</button>
              <button onClick={handleConfirmSave} disabled={saving} className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white disabled:opacity-60">{saving ? 'Saving…' : 'Confirm & Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* REOPENED PLAN MODAL */}
      {openPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Saved study plan">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{openPlan.topic}</h3>
                <p className="text-xs text-slate-500">Score {openPlan.score}/{openPlan.total_questions} · saved {new Date(openPlan.created_at).toLocaleString()} · <span className="font-mono">{openPlan.id}</span></p>
              </div>
              <button onClick={() => setOpenPlan(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold" aria-label="Close">&times;</button>
            </div>
            <p className="text-[11px] text-slate-500">References: {(openPlan.section_references || []).join(', ')}</p>
            <div className="space-y-3">
              {(openPlan.activities || []).map((a, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-xs text-slate-900">{a.title}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{a.description}</p>
                  {a.sectionRef && <span className="inline-block mt-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono font-bold">Ref: {a.sectionRef}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INSPECTOR MODAL */}
      {isInspectorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 z-50">
          <div className="bg-slate-900 text-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 shrink-0">
              <h3 className="font-mono text-sm font-bold text-indigo-400 flex items-center space-x-1.5">
                <span>⚙️</span>
                <span>Tool Call Inspector</span>
              </h3>
              <button onClick={() => setIsInspectorOpen(false)} className="text-slate-400 hover:text-white font-bold text-xl p-1 focus:outline-none">&times;</button>
            </div>
            <div className="font-mono text-[11px] sm:text-xs space-y-2 max-h-[60vh] overflow-y-auto bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 break-words whitespace-pre-wrap">
              {inspectorLogs.length === 0 ? (
                <p className="text-slate-500">// System ready. Interact with AI Tutor to test tool calls...</p>
              ) : (
                inspectorLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900 pb-2">
                    <span className="text-emerald-400">[{log.time}] [TOOL CALL]</span> <strong className="text-white">{log.toolName}</strong><br />
                    <span className="text-slate-400">Input:</span> {JSON.stringify(log.payload)}<br />
                    <span className="text-indigo-300">Output:</span> {JSON.stringify(log.response)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
