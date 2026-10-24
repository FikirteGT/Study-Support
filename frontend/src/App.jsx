import React, { useState } from 'react';

// --- TEAM DEMO DATA ---
const DEMO_TEACHING_MATERIAL = [
  { 
    id: "SEC_PY_01", 
    title: "1. Python Lists & Mutability", 
    content: "Lists in Python are ordered, mutable collections defined with square brackets []. Elements can be modified in-place.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60"
  },
  { 
    id: "SEC_PY_02", 
    title: "2. Python Tuples & Immutability", 
    content: "Tuples are ordered, immutable sequences enclosed in parentheses (). Once created, their elements cannot be changed.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60"
  },
  { 
    id: "SEC_PY_03", 
    title: "3. Python Dictionaries", 
    content: "Dictionaries store data in unordered key-value pairs using curly braces {}. Keys must be unique and immutable.",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60"
  }
];

const savedPlansDB = [];

export default function App() {
  const [authStage, setAuthStage] = useState('login');
  const [studentIdInput, setStudentIdInput] = useState('STU_101');
  const [passwordInput, setPasswordInput] = useState('••••••••');
  
  const [activeTab, setActiveTab] = useState('Welcome');
  
  const [topic, setTopic] = useState('Python Lists');
  const [matchingSections, setMatchingSections] = useState([DEMO_TEACHING_MATERIAL[0]]);
  const [scopeWarning, setScopeWarning] = useState('');
  const [clarificationPrompt, setClarificationPrompt] = useState('');
  
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  
  const [inspectorLogs, setInspectorLogs] = useState([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

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

  // TOOL 1: search_material with Ambiguity & Out-of-Scope Checks
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setScopeWarning('');
    setClarificationPrompt('');
    setQuizData(null);
    setScoreResult(null);
    setStudyPlan(null);

    const q = topic.toLowerCase().trim();

    // 1. Check for ambiguous / vague topics
    const vagueKeywords = ['python', 'data', 'structure', 'code', 'basics'];
    if (vagueKeywords.includes(q)) {
      const msg = "Your request is too broad. Please clarify your topic: Are you interested in Python Lists, Tuples, or Dictionaries?";
      setClarificationPrompt(msg);
      logInspector('search_material', { topic }, { status: 'Needs Clarification', message: msg });
      return;
    }

    // 2. Search demo material
    const results = DEMO_TEACHING_MATERIAL.filter(sec => 
      sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q)
    );

    logInspector('search_material', { topic }, { matchesCount: results.length });

    // 3. Handle out-of-scope topics
    if (results.length === 0) {
      setScopeWarning(`Topic "${topic}" falls outside our team demo material. Available topics: Python Lists, Tuples, Dictionaries.`);
      setMatchingSections([]);
      return;
    }

    setMatchingSections(results);
    generateQuiz();
  };

  // Generate 3-question MCQ Quiz based on material
  const generateQuiz = () => {
    const generated = [
      { id: 1, question: "Which syntax defines a mutable sequence in Python?", options: ["Square brackets []", "Parentheses ()", "Curly braces {}", "Angle brackets <>"], answerIndex: 0, sectionId: "SEC_PY_01" },
      { id: 2, question: "Which property distinguishes Tuples from Lists?", options: ["Ordering", "Immutability", "Indexing support", "Length restriction"], answerIndex: 1, sectionId: "SEC_PY_02" },
      { id: 3, question: "What data pairing format is used by Dictionaries?", options: ["Value-Index", "Key-Value", "Tuple-Set", "Header-Body"], answerIndex: 1, sectionId: "SEC_PY_03" }
    ];
    setQuizData(generated);
    setUserAnswers({});
    logInspector('generate_quiz', { topic }, { quizLength: generated.length });
  };

  const handleOptionSelect = (qIdx, oIdx) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  // TOOL 2: check_assessment (Calculated strictly in app code) & Generate Study Plan
  const handleSubmitQuiz = () => {
    if (!quizData) return;

    const answerKey = quizData.map(q => q.answerIndex);
    const formattedAnswers = quizData.map((_, idx) => userAnswers[idx] ?? -1);

    let score = 0;
    const breakdown = formattedAnswers.map((ans, idx) => {
      const isCorrect = ans === answerKey[idx];
      if (isCorrect) score++;
      return { questionIndex: idx + 1, userAnswer: ans, correctAnswer: answerKey[idx], passed: isCorrect };
    });

    const percentage = Math.round((score / answerKey.length) * 100);
    const scoreData = { score, total: answerKey.length, percentage: `${percentage}%`, breakdown };
    
    setScoreResult(scoreData);
    logInspector('check_assessment', { userAnswers: formattedAnswers, answerKey }, scoreData);

    // Generate recommendations/study plan based on results
    const activities = [
      { title: "1. Review List Mutability", sectionId: "SEC_PY_01", description: "Practice modifying elements inside square brackets []." },
      { title: "2. Master Tuple Safety", sectionId: "SEC_PY_02", description: "Learn when to use immutable tuples () to protect states." },
      { title: "3. Dictionary Key-Value Mapping", sectionId: "SEC_PY_03", description: "Build structured lookups using curly braces {}." }
    ];
    setStudyPlan(activities);
    logInspector('propose_study_plan', { score: scoreData.percentage }, { activities });
  };

  // TOOL 3: save_study_plan
  const handleSavePlan = () => {
    const newPlan = {
      planId: `PLAN_${Date.now().toString().slice(-4)}`,
      studentId: "STU_101",
      studentName: "Alex Kim",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: scoreResult.percentage,
      rawScore: `${scoreResult.score}/${scoreResult.total}`,
      activities: studyPlan,
      sourceReferences: quizData.map(q => q.sectionId)
    };
    savedPlansDB.unshift(newPlan);
    logInspector('save_study_plan', { score: scoreResult.percentage }, newPlan);
    alert(`Study Plan Successfully Saved!\nPlan ID: ${newPlan.planId}`);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-indigo-600 text-white p-3 rounded-2xl text-2xl font-bold shadow-lg shadow-indigo-500/30">🎓</div>
            <h1 className="text-xl font-bold text-white tracking-wide">ACADEMIC SUPPORT PORTAL</h1>
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
            Demo Student Profile: <span className="text-indigo-400 font-mono">Alex Kim (STU_101)</span>
          </div>
        </div>
      </div>
    );
  }

  // MAIN PORTAL
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shadow-xl shrink-0">
        <div>
          <div className="flex items-center space-x-3 px-3 py-4 mb-4 border-b border-slate-800">
            <div className="bg-indigo-600 text-white p-2 rounded-xl text-base font-bold">🎓</div>
            <div>
              <h1 className="font-extrabold text-xs tracking-wider">STUDY PLATFORM</h1>
              <p className="text-[10px] text-indigo-400 font-medium">Academic Support Agent</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
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

        <div className="space-y-2">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center space-x-3">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
              alt="Student Avatar" 
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Alex Kim</p>
              <p className="text-[10px] text-slate-400 font-mono">ID: STU_101</p>
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
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{activeTab}</h2>
            <p className="text-xs text-slate-500">Professional Academic Support Portal</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsInspectorOpen(true)}
              className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl font-semibold hover:bg-indigo-100 transition flex items-center space-x-1.5"
            >
              <span>🔍</span>
              <span>Backend Tool Call Inspector</span>
            </button>
            <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">● Connected</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">

          {/* WELCOME PAGE */}
          {activeTab === 'Welcome' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-8 shadow-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 z-10">
                  <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                    Welcome to Your Portal
                  </span>
                  <h3 className="text-2xl font-black">Hello, Alex Kim!</h3>
                  <p className="text-xs text-indigo-100 max-w-lg leading-relaxed">
                    Your AI Academic Support Agent is ready to evaluate your knowledge on course topics, generate targeted quizzes, and build personalized study plans based on team demo materials.
                  </p>
                  <button 
                    onClick={() => setActiveTab('AI Tutor')}
                    className="bg-white text-indigo-900 hover:bg-indigo-50 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Start AI Assessment ➔
                  </button>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80" 
                  alt="Welcome Hero" 
                  className="w-48 h-36 object-cover rounded-xl shadow-lg border border-indigo-400/30 z-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-indigo-600 text-xl font-bold">📄 01</div>
                  <h4 className="font-bold text-sm text-slate-900">Material Search</h4>
                  <p className="text-xs text-slate-500">Scan verified demo sections with intelligent scope boundary enforcement.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-indigo-600 text-xl font-bold">📝 02</div>
                  <h4 className="font-bold text-sm text-slate-900">Assessment & Scoring</h4>
                  <p className="text-xs text-slate-500">Take 3-question MCQ quizzes with instant app-code grading logic.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
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
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900">1. Select Course Topic</h3>
                  <span className="text-xs text-slate-400 font-mono">search_material</span>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Python Lists, Tuples, Dictionaries" 
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-md">
                    Search Topic
                  </button>
                </form>

                {/* Clarification prompt for ambiguous topic */}
                {clarificationPrompt && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-start space-x-2">
                    <span>💡</span>
                    <div>
                      <p className="font-bold mb-1">Clarification Requested by AI Tutor:</p>
                      <p>{clarificationPrompt}</p>
                    </div>
                  </div>
                )}

                {/* Out of scope warning */}
                {scopeWarning && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4 flex items-start space-x-2">
                    <span>⚠️</span>
                    <div>
                      <p className="font-bold mb-1">Topic Outside Demo Material:</p>
                      <p>{scopeWarning}</p>
                    </div>
                  </div>
                )}

                {matchingSections.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {matchingSections.map(sec => (
                      <div key={sec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex space-x-3 items-center">
                        <img src={sec.image} alt={sec.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="overflow-hidden">
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
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">2. Knowledge Assessment Quiz</h3>
                    <span className="text-xs text-slate-400 font-mono">check_assessment</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quizData.map((q, idx) => (
                      <div key={q.id} className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 mb-2">{idx + 1}. {q.question}</p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, oIdx) => (
                              <label key={oIdx} className="flex items-center space-x-2 text-xs cursor-pointer p-1.5 rounded hover:bg-slate-100">
                                <input 
                                  type="radio" 
                                  name={`q${idx}`} 
                                  checked={userAnswers[idx] === oIdx}
                                  onChange={() => handleOptionSelect(idx, oIdx)}
                                  className="text-indigo-600 focus:ring-indigo-600"
                                />
                                <span>{opt}</span>
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
                <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">3. Recommended Study Plan & Next Steps</h3>
                      <p className="text-xs text-slate-500">Tailored activities based on your assessment results.</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Score Achieved</p>
                      <p className="text-lg font-extrabold text-emerald-800">{scoreResult.score} / {scoreResult.total} ({scoreResult.percentage})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {studyPlan.map((act, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono font-bold">Ref: {act.sectionId}</span>
                        </div>
                        <p className="font-bold text-xs text-slate-900">{act.title}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{act.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button onClick={handleSavePlan} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl text-2xl">📚</div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Active Topic</p>
                    <p className="text-lg font-bold text-slate-900">Python Basics</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl text-2xl">🎯</div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Last Quiz Score</p>
                    <p className="text-lg font-bold text-slate-900">{scoreResult ? scoreResult.percentage : '66%'}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl text-2xl">💾</div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Saved Study Plans</p>
                    <p className="text-lg font-bold text-slate-900">{savedPlansDB.length} Plans</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MATERIALS */}
          {activeTab === 'Materials' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEMO_TEACHING_MATERIAL.map((mat) => (
                <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition">
                  <img src={mat.image} alt={mat.title} className="w-full h-36 object-cover" />
                  <div className="p-5">
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{mat.id}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-2 mb-1">{mat.title}</h4>
                    <p className="text-xs text-slate-500">{mat.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* QUIZZES */}
          {activeTab === 'Quizzes' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Available Quizzes</h3>
              <p className="text-xs text-slate-500 font-medium">Take quizzes directly generated from team demo materials.</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-slate-900">Python Data Structures Quiz (3 Questions)</p>
                  <p className="text-[11px] text-slate-500">Covers SEC_PY_01, SEC_PY_02, SEC_PY_03</p>
                </div>
                <button onClick={() => setActiveTab('AI Tutor')} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* PROGRESS */}
          {activeTab === 'Progress' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Student Progress Metrics</h3>
              <p className="text-xs text-slate-500 font-medium">Student: Alex Kim (STU_101)</p>
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
                ✅ Completed topic assessment on <strong>Python Basics</strong>.
              </div>
            </div>
          )}

          {/* STUDY PLANS */}
          {activeTab === 'Study Plans' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Saved Study Plans</h3>
                  <p className="text-xs text-slate-500">Reopen confirmed plans saved via save_study_plan tool.</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md font-bold">{savedPlansDB.length} Total</span>
              </div>

              {savedPlansDB.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl text-xs">
                  No plans confirmed yet. Go to <strong className="text-indigo-600 cursor-pointer" onClick={() => setActiveTab('AI Tutor')}>AI Tutor</strong> to take an assessment and save your plan.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlansDB.map((plan) => (
                    <div key={plan.planId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-indigo-600">{plan.planId}</span>
                          <span className="text-[10px] text-slate-400">● Saved at {plan.timestamp}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">Score Achieved: {plan.score} ({plan.rawScore})</p>
                        <p className="text-[11px] text-slate-500">References: {plan.sourceReferences.join(', ')}</p>
                      </div>
                      <button onClick={() => alert(`Reopened Plan ${plan.planId}:\n\n${plan.activities.map(a => a.title).join('\n')}`)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
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

      {/* INSPECTOR MODAL */}
      {isInspectorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-mono text-sm font-bold text-indigo-400">⚙️ Tool Call Inspector</h3>
              <button onClick={() => setIsInspectorOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <div className="font-mono text-xs space-y-2 max-h-80 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800">
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