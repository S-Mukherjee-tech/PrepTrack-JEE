import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Award, 
  BarChart2, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Info,
  ChevronRight,
  Filter,
  Check,
  ChevronDown,
  BrainCircuit,
  PieChart
} from 'lucide-react';
import { MockTest, SubjectStats } from '../types';

interface MockTestTrackerProps {
  mockTests: MockTest[];
  onAddTest: (test: MockTest) => Promise<void>;
  onDeleteTest: (id: string) => Promise<void>;
  theme: 'slate' | 'cyber' | 'light' | 'glass';
  cardBgClass: string;
}

const MockTestTracker = memo(function MockTestTracker({
  mockTests,
  onAddTest,
  onDeleteTest,
  theme,
  cardBgClass
}: MockTestTrackerProps) {
  // Tabs for the Tracker
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'analytics' | 'history'>('log');
  
  // Test Form States
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pattern, setPattern] = useState<'JEE Main' | 'JEE Advanced'>('JEE Main');
  const [fullMarks, setFullMarks] = useState<number | string>(300);
  const [totalMarksScored, setTotalMarksScored] = useState<number>(0);

  // Subject Scores (allow empty string for clean typing and placeholders)
  const [pScore, setPScore] = useState<number | string>('');
  const [cScore, setCScore] = useState<number | string>('');
  const [mScore, setMScore] = useState<number | string>('');

  // Subject Questions Count (allow empty string for clean typing and placeholders)
  const [pCorrect, setPCorrect] = useState<number | string>('');
  const [pIncorrect, setPIncorrect] = useState<number | string>('');
  const [pUnattempted, setPUnattempted] = useState<number | string>('');

  const [cCorrect, setCCorrect] = useState<number | string>('');
  const [cIncorrect, setCIncorrect] = useState<number | string>('');
  const [cUnattempted, setCUnattempted] = useState<number | string>('');

  const [mCorrect, setMCorrect] = useState<number | string>('');
  const [mIncorrect, setMIncorrect] = useState<number | string>('');
  const [mUnattempted, setMUnattempted] = useState<number | string>('');

  const [notes, setNotes] = useState<string>('');

  // Helper function to safely parse values without NaN
  const safeNum = (v: any): number => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // Helper handler for score inputs (allows typing optional negative sign)
  const handleScoreChange = (val: string, setter: (v: number | string) => void) => {
    if (val === '') {
      setter('');
      return;
    }
    if (val === '-') {
      setter('-');
      return;
    }
    // Allow standard negative integers
    const cleaned = val.replace(/(?!^-)[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    setter(isNaN(parsed) ? '' : parsed);
  };

  // Helper handler for positive integers only
  const handlePositiveIntegerChange = (val: string, setter: (v: number | string) => void, maxVal?: number) => {
    if (val === '') {
      setter('');
      return;
    }
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setter('');
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setter(maxVal !== undefined ? Math.min(maxVal, parsed) : parsed);
    }
  };
  
  // Analytics Filter States
  const [chartFilter, setChartFilter] = useState<'all' | 'JEE Main' | 'JEE Advanced'>('all');
  const [chartSubjectFilter, setChartSubjectFilter] = useState<'total' | 'physics' | 'chemistry' | 'math'>('total');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any>(null);

  // Form auto-calculate totals as the user inputs scores or questions
  const computedTotalScored = useMemo(() => {
    return safeNum(pScore) + safeNum(cScore) + safeNum(mScore);
  }, [pScore, cScore, mScore]);

  const computedTotalCorrect = useMemo(() => {
    return safeNum(pCorrect) + safeNum(cCorrect) + safeNum(mCorrect);
  }, [pCorrect, cCorrect, mCorrect]);

  const computedTotalIncorrect = useMemo(() => {
    return safeNum(pIncorrect) + safeNum(cIncorrect) + safeNum(mIncorrect);
  }, [pIncorrect, cIncorrect, mIncorrect]);

  const computedTotalUnattempted = useMemo(() => {
    return safeNum(pUnattempted) + safeNum(cUnattempted) + safeNum(mUnattempted);
  }, [pUnattempted, cUnattempted, mUnattempted]);

  const handleFullMarksPreset = (type: 'JEE Main' | 'JEE Advanced') => {
    setPattern(type);
    if (type === 'JEE Main') {
      setFullMarks(300);
    } else {
      setFullMarks(360); // Standard JEE Advanced Full Marks
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pStats: SubjectStats = {
      score: safeNum(pScore),
      correct: safeNum(pCorrect),
      incorrect: safeNum(pIncorrect),
      unattempted: safeNum(pUnattempted)
    };

    const cStats: SubjectStats = {
      score: safeNum(cScore),
      correct: safeNum(cCorrect),
      incorrect: safeNum(cIncorrect),
      unattempted: safeNum(cUnattempted)
    };

    const mStats: SubjectStats = {
      score: safeNum(mScore),
      correct: safeNum(mCorrect),
      incorrect: safeNum(mIncorrect),
      unattempted: safeNum(mUnattempted)
    };

    const nextTest: MockTest = {
      id: Math.random().toString(36).substring(2, 9),
      date,
      pattern,
      fullMarks: safeNum(fullMarks),
      totalMarksScored: computedTotalScored,
      physics: pStats,
      chemistry: cStats,
      math: mStats,
      notes: notes.trim() || undefined,
      timestamp: new Date(date).getTime()
    };

    await onAddTest(nextTest);
    
    // Reset Form to beautiful empty fields (placeholders will show 0)
    setNotes('');
    setPScore('');
    setCScore('');
    setMScore('');
    setPCorrect('');
    setPIncorrect('');
    setPUnattempted('');
    setCCorrect('');
    setCIncorrect('');
    setCUnattempted('');
    setMCorrect('');
    setMIncorrect('');
    setMUnattempted('');

    // Switch to history tab
    setActiveSubTab('history');
  };

  // Human coach generative advice algorithm based on actual metrics
  const getCoachAdvice = (test: MockTest) => {
    const percentage = (test.totalMarksScored / (test.fullMarks || 300)) * 100;
    
    const physics = test.physics || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };
    const chemistry = test.chemistry || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };
    const math = test.math || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };

    // Correct ratio
    const totalCorrect = (physics.correct ?? 0) + (chemistry.correct ?? 0) + (math.correct ?? 0);
    const totalIncorrect = (physics.incorrect ?? 0) + (chemistry.incorrect ?? 0) + (math.incorrect ?? 0);
    const totalUnattempted = (physics.unattempted ?? 0) + (chemistry.unattempted ?? 0) + (math.unattempted ?? 0);
    const totalQuestions = totalCorrect + totalIncorrect + totalUnattempted;
    
    const accuracy = totalQuestions > 0 ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100 : 0;
    const negativeRatio = totalCorrect > 0 ? (totalIncorrect / totalCorrect) * 100 : 0;

    // Subjects balance
    const pPct = physics.score ?? 0;
    const cPct = chemistry.score ?? 0;
    const mPct = math.score ?? 0;
    
    const subjectScores = [
      { name: 'Physics', score: pStatsPercentage(physics, test.pattern), raw: pPct },
      { name: 'Chemistry', score: pStatsPercentage(chemistry, test.pattern), raw: cPct },
      { name: 'Maths', score: pStatsPercentage(math, test.pattern), raw: mPct }
    ];

    subjectScores.sort((a, b) => b.score - a.score);
    const strongest = subjectScores[0];
    const weakest = subjectScores[2];

    if (percentage >= 80) {
      return {
        rating: 'Supreme Elite Level',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        message: `Outstanding! Scoring ${percentage.toFixed(1)}% in a ${test.pattern} test is elite territory. Your mastery is evident, particularly in ${strongest.name} (which stood out at ${strongest.score.toFixed(0)}%). Keep doing exactly what you are doing. Review any minor errors in ${weakest.name} to plug any potential leaks before D-Day!`,
        tips: [
          'Solve advanced problem archives (Irodov / Pathfinder / Wiley) for critical edge.',
          'Double-down on simulated tests during the exact exam hour slot (9-12 or 2-5).',
          'Optimize your time strategy to save 15-20 mins for cross-checking complex equations.'
        ]
      };
    } else if (percentage >= 60) {
      return {
        rating: 'Excellent Progress',
        color: 'text-teal-400',
        bg: 'bg-teal-500/10 border-teal-500/20',
        message: `Fantastic effort! A score of ${test.totalMarksScored}/${test.fullMarks} (${percentage.toFixed(1)}%) is strong. ${strongest.name} is shining brightly. However, ${weakest.name} left some marks on the table. With some targeted study in the coming days, you're on the absolute cusp of clearing top NIT/IIT streams!`,
        tips: [
          `Focus on ${weakest.name} question clusters. Revise key formulas and solve past 5-year archives.`,
          `Minimize negative marks: your incorrect-to-correct ratio is ${negativeRatio.toFixed(0)}%. Avoid wildcard guesses.`,
          'Analyze whether errors were conceptual or due to silly computation calculations.'
        ]
      };
    } else if (percentage >= 40) {
      return {
        rating: 'Solid Baseline',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        message: `Good battle! You scored ${percentage.toFixed(1)}%. You have established a solid foundation. ${strongest.name} was respectable, but ${weakest.name} is currently dragging your total aggregate down. To boost your score by 40-50 marks, immediately flag high-yield sections in ${weakest.name} and convert those conceptual gaps into secure points.`,
        tips: [
          `Target NCERT/Coaching core booklets for ${weakest.name} and solve 20 key formulas daily.`,
          `Tackle unattempted questions under no-timer constraints to build structural confidence.`,
          `Make an active entry of silly mistakes from this test in your "Mistakes Book" tab right now!`
        ]
      };
    } else {
      return {
        rating: 'Struggle & Opportunity',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
        message: `A tough paper, but a massive learning goldmine! Scoring ${percentage.toFixed(1)}% means there's a disconnect between theory and question application. Do not be discouraged—every topper has faced this. Your primary focus must be on eliminating negative marks (accuracy is ${accuracy.toFixed(0)}%) and securing basic high-yield chapters first.`,
        tips: [
          'Pause full-length tests and focus entirely on sub-topic chapterwise tests first.',
          `Revise ${weakest.name} basics from scratch. Do not proceed to advanced archives until basic NCERT examples compile.`,
          'Commit to logging at least 15 solved questions under the Questions Tab every single day.'
        ]
      };
    }
  };

  function pStatsPercentage(sub?: SubjectStats, pattern?: string): number {
    if (!sub) return 0;
    const subFullMarks = pattern === 'JEE Main' ? 100 : 120;
    return Math.max(0, Math.min(100, ((sub.score ?? 0) / subFullMarks) * 100));
  }

  // Generate customized message when list is empty
  const overallPerformance = useMemo(() => {
    if (mockTests.length === 0) return null;
    const totalScoredSum = mockTests.reduce((acc, t) => acc + (Number(t.totalMarksScored) || 0), 0);
    const totalFullSum = mockTests.reduce((acc, t) => acc + (Number(t.fullMarks) || 300), 0);
    const rawPct = totalFullSum > 0 ? (totalScoredSum / totalFullSum) * 100 : 0;
    const avgPercentage = isNaN(rawPct) || !isFinite(rawPct) ? 0 : rawPct;
    
    let label = 'Steady Tracker';
    let feedback = '';
    
    if (avgPercentage >= 75) {
      label = 'Elite Champion Elite 👑';
      feedback = 'You are consistently scoring at an elite level. Your IIT-JEE probability is stellar. Keep compounding your discipline!';
    } else if (avgPercentage >= 55) {
      label = 'Supreme Main Stream Tracker 🚀';
      feedback = 'Strong consistency. You have established a top tier baseline. Target subject-wise speed run logs to burst into the 99th percentile!';
    } else if (avgPercentage >= 35) {
      label = 'Rising Aspirant Level 📈';
      feedback = 'A highly respectable study curve. You are learning valuable JEE test-taking lessons. Keep drilling down on error book entries.';
    } else {
      label = 'Focused Warrior ⚔️';
      feedback = 'You are facing the heat of battle. JEE papers are brutal, but consistency will crack it. Analyze every incorrect line meticulously.';
    }

    return { avgPercentage, label, feedback };
  }, [mockTests]);

  // SVG Chart Calculations
  const chartData = useMemo(() => {
    // Filter tests by JEE pattern if requested
    const filtered = mockTests
      .filter(t => chartFilter === 'all' || t.pattern === chartFilter)
      // Sort chronologically (oldest to newest for graphing)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return filtered;
  }, [mockTests, chartFilter]);

  // Calculate SVG plot line coordinates
  const svgDimensions = { width: 680, height: 320, padding: 45 };
  
  const svgCoordinates = useMemo(() => {
    if (chartData.length < 2) return [];
    
    const { width, height, padding } = svgDimensions;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const minX = 0;
    const maxX = chartData.length - 1;

    // We plot percentages (0 to 100) on the Y axis to keep scale consistent
    const minY = 0;
    const maxY = 100;

    return chartData.map((test, index) => {
      // Calculate X coordinate
      let x = padding + (index / maxX) * plotWidth;
      if (isNaN(x) || !isFinite(x)) {
        x = padding;
      }
      
      // Calculate Y coordinate based on subject filter
      let scorePercentage = 0;
      if (chartSubjectFilter === 'total') {
        const totalScored = test.totalMarksScored ?? 0;
        const fm = test.fullMarks || 300;
        scorePercentage = (totalScored / fm) * 100;
      } else {
        const sub = test[chartSubjectFilter] || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };
        const subScore = sub.score ?? 0;
        const fm = test.fullMarks || 300;
        const subFullMarks = test.pattern === 'JEE Main' ? 100 : test.pattern === 'JEE Advanced' ? (fm / 3) : 100;
        scorePercentage = (subScore / (subFullMarks || 100)) * 100;
      }
      
      if (isNaN(scorePercentage) || !isFinite(scorePercentage)) {
        scorePercentage = 0;
      }
      
      // Flip Y axis since (0,0) is top-left in SVG
      let y = padding + plotHeight - (scorePercentage / maxY) * plotHeight;
      if (isNaN(y) || !isFinite(y)) {
        y = padding + plotHeight;
      }
      
      return { x, y, test, scorePercentage };
    });
  }, [chartData, chartSubjectFilter]);

  // Theme-specific colors matching existing design parameters
  const activeTabAccent = 
    theme === 'cyber' ? 'bg-emerald-500 text-black font-extrabold shadow-sm' :
    theme === 'light' ? 'bg-rose-500 text-white font-bold shadow-sm' :
    theme === 'slate' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' :
    'bg-indigo-600 text-white font-bold shadow-sm';

  const buttonHoverColor = 
    theme === 'cyber' ? 'hover:bg-emerald-500/20 text-emerald-400' :
    theme === 'light' ? 'hover:bg-rose-500/20 text-rose-600' :
    theme === 'slate' ? 'hover:bg-cyan-500/20 text-cyan-400' :
    'hover:bg-indigo-500/25 text-[#6366f1]';

  const inputBorderFocus = 
    theme === 'cyber' ? 'focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/35' :
    theme === 'light' ? 'focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/35' :
    theme === 'slate' ? 'focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/35' :
    'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/35';

  const outlineBorder = 
    theme === 'cyber' ? 'border-emerald-500/20' :
    theme === 'light' ? 'border-rose-500/20' :
    theme === 'slate' ? 'border-cyan-500/20' :
    'border-border';

  const accentColorText = 
    theme === 'cyber' ? 'text-emerald-400' :
    theme === 'light' ? 'text-rose-500' :
    theme === 'slate' ? 'text-cyan-400' :
    'text-[#6366f1]';

  const badgeColor = 
    theme === 'cyber' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
    theme === 'light' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
    theme === 'slate' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
    'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20';

  const activeOptionStyle = 
    theme === 'cyber' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
    theme === 'light' ? 'bg-rose-500/20 border-rose-500/40 text-rose-600' :
    theme === 'slate' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' :
    'bg-indigo-500/20 border-indigo-500/40 text-[#6366f1]';

  return (
    <div className={`rounded-3xl p-6 shadow-sm transition-all duration-300 hover:shadow-md border border-white/5 ${cardBgClass}`}>
      
      {/* SECTION HEADER & TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/5 pb-5 mb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${badgeColor} flex items-center justify-center shrink-0`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-display tracking-tight flex items-center gap-2">
                JEE Mock Test Tracker & Analyzer
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl">
                Log and analyze JEE Main/Advanced test scores, monitor subject balance metrics, and unlock custom AI-style coaching insights.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic sub-tab switcher */}
        <div className="flex bg-accent/15 dark:bg-black/40 p-1 rounded-2xl border border-white/5 self-start lg:self-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('log')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'log' ? (activeTabAccent + ' scale-[1.01]') : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Score</span>
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl transition-all cursor-pointer relative ${
              activeSubTab === 'analytics' ? (activeTabAccent + ' scale-[1.01]') : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Interactive Trend</span>
            {mockTests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  theme === 'cyber' ? 'bg-emerald-400' :
                  theme === 'light' ? 'bg-rose-400' :
                  theme === 'slate' ? 'bg-cyan-400' :
                  'bg-indigo-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  theme === 'cyber' ? 'bg-emerald-500' :
                  theme === 'light' ? 'bg-rose-500' :
                  theme === 'slate' ? 'bg-cyan-500' :
                  'bg-indigo-500'
                }`}></span>
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'history' ? (activeTabAccent + ' scale-[1.01]') : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Test History ({mockTests.length})</span>
          </button>
        </div>
      </div>

      {/* RENDER SELECTED TAB CONTROLLER */}
      <div className="transition-all duration-150">
        
        {/* LOG TEST SCORES TAB */}
        {activeSubTab === 'log' && (
          <form
            onSubmit={handleAddSubmit}
            className="space-y-6 animate-fade-in"
          >
            {/* Exam Details & Presets Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-accent/5 dark:bg-white/[0.01] p-5 rounded-2xl border border-white/5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Date of Exam</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full text-xs px-4 py-3 rounded-xl bg-background border ${outlineBorder} text-foreground focus:outline-none transition-all ${inputBorderFocus}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Pattern</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFullMarksPreset('JEE Main')}
                    className={`flex-1 py-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      pattern === 'JEE Main'
                        ? activeOptionStyle
                        : 'bg-background hover:bg-accent/15 border-border text-muted-foreground'
                    }`}
                  >
                    JEE Main (300M)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFullMarksPreset('JEE Advanced')}
                    className={`flex-1 py-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      pattern === 'JEE Advanced'
                        ? activeOptionStyle
                        : 'bg-background hover:bg-accent/15 border-border text-muted-foreground'
                    }`}
                  >
                    JEE Advanced
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Full Marks</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={fullMarks}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handlePositiveIntegerChange(e.target.value, setFullMarks, 1000)}
                  placeholder="300"
                  className={`w-full text-xs px-4 py-3 rounded-xl bg-background border ${outlineBorder} text-foreground focus:outline-none transition-all ${inputBorderFocus} font-sans font-medium`}
                />
              </div>
            </div>

            {/* Subject-Wise Logging Matrices */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-1.5 select-none pl-1">
                <TrendingUp className={`w-4 h-4 ${accentColorText}`} /> Subject Marks & Accuracy Details
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* PHYSICS */}
                <div className="p-5 rounded-2xl bg-sky-500/[0.02] dark:bg-sky-500/[0.01] border border-sky-500/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-sky-500/10 pb-2">
                    <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">Physics</span>
                    <span className="text-xs font-semibold bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-500/15">Weight: ~33%</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1">Score Obtained</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={pScore}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleScoreChange(e.target.value, setPScore)}
                        className={`w-full text-xs px-3 py-2.5 rounded-lg bg-background border border-sky-500/20 text-foreground focus:outline-none focus:border-sky-500/50 font-sans font-medium`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Correct</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={pCorrect}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setPCorrect, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-emerald-500/25 text-emerald-400 text-center font-sans font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Incorrect</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={pIncorrect}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setPIncorrect, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-rose-500/25 text-rose-400 text-center font-sans font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Unattempted</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={pUnattempted}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setPUnattempted, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-slate-500/25 text-slate-400 text-center font-sans font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHEMISTRY */}
                <div className="p-5 rounded-2xl bg-amber-500/[0.02] dark:bg-amber-500/[0.01] border border-amber-500/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Chemistry</span>
                    <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/15">Weight: ~33%</span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1">Score Obtained</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={cScore}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleScoreChange(e.target.value, setCScore)}
                        className={`w-full text-xs px-3 py-2.5 rounded-lg bg-background border border-amber-500/20 text-foreground focus:outline-none focus:border-amber-500/50 font-sans font-medium`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Correct</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cCorrect}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setCCorrect, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-emerald-500/25 text-emerald-400 text-center font-sans font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Incorrect</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cIncorrect}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setCIncorrect, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-rose-500/25 text-rose-400 text-center font-sans font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Unattempted</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cUnattempted}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setCUnattempted, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-slate-500/25 text-slate-400 text-center font-sans font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MATHEMATICS */}
                <div className="p-5 rounded-2xl bg-purple-500/[0.02] dark:bg-purple-500/[0.01] border border-purple-500/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
                    <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">Mathematics</span>
                    <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/15">Weight: ~33%</span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1">Score Obtained</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={mScore}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleScoreChange(e.target.value, setMScore)}
                        className={`w-full text-xs px-3 py-2.5 rounded-lg bg-background border border-purple-500/20 text-foreground focus:outline-none focus:border-purple-500/50 font-sans font-medium`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Correct</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={mCorrect}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setMCorrect, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-emerald-500/25 text-emerald-400 text-center font-sans font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Incorrect</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={mIncorrect}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setMIncorrect, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-rose-500/25 text-rose-400 text-center font-sans font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1 text-center">Unattempted</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={mUnattempted}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePositiveIntegerChange(e.target.value, setMUnattempted, 100)}
                          className="w-full text-xs px-2.5 py-2 rounded-lg bg-background border border-slate-500/25 text-slate-400 text-center font-sans font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Auto-Calculation Aggregates Showcase */}
            <div className="p-5 rounded-2xl bg-primary/[0.04] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center select-none shadow-inner">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Total Marks Scored</span>
                <span className={`text-base md:text-xl font-bold font-display ${accentColorText}`}>
                  {computedTotalScored} <span className="text-xs font-normal text-muted-foreground">/ {fullMarks}</span>
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 font-bold uppercase tracking-wide">({((computedTotalScored / (fullMarks || 1)) * 100).toFixed(0)}% accuracy)</span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Total Correct Questions</span>
                <span className="text-base md:text-xl font-bold font-display text-emerald-400">
                  {computedTotalCorrect} <span className="text-xs font-normal text-muted-foreground">Qs</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Total Incorrect Questions</span>
                <span className="text-base md:text-xl font-bold font-display text-rose-400">
                  {computedTotalIncorrect} <span className="text-xs font-normal text-muted-foreground">Qs</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Total Unattempted Questions</span>
                <span className="text-base md:text-xl font-bold font-display text-slate-300">
                  {computedTotalUnattempted} <span className="text-xs font-normal text-muted-foreground">Qs</span>
                </span>
              </div>
            </div>

            {/* Personal Test Log Reflections Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Critical Takeaways & Exam Mistake Reflections</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="💡 Write about silly mistakes committed, time pressure bottlenecks, chapters to revise, formula confusion, or conceptual blindspots..."
                rows={3}
                className={`w-full text-xs p-4 rounded-xl bg-background border ${outlineBorder} text-foreground placeholder:text-muted-foreground/45 focus:outline-none transition-all leading-relaxed resize-none ${inputBorderFocus}`}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-5">
              <button
                type="submit"
                className={`px-5 py-3 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                  theme === 'cyber' ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold shadow-emerald-500/10' :
                  theme === 'light' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10' :
                  theme === 'slate' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold shadow-cyan-500/10' :
                  'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                }`}
              >
                <Plus className="w-4 h-4" /> Save Mock Test Analysis
              </button>
            </div>
          </form>
        )}

        {/* INTERACTIVE TRENDS & PATTERNS TAB */}
        {activeSubTab === 'analytics' && (
          <div
            className="space-y-6 animate-fade-in"
          >
            {mockTests.length < 2 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3">
                <BarChart2 className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">Awaiting More Coordinates</h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Log at least 2 Mock Tests under the "Log Score" tab to unlock dynamic, interactive animated trend mapping.
                </p>
                <button
                  onClick={() => setActiveSubTab('log')}
                  className={`mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-accent/15 hover:bg-accent/30 border border-border transition-all cursor-pointer ${buttonHoverColor}`}
                >
                  Log Your First Test Score
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Chart Controls Grid */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-accent/10 dark:bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Chart Filters</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Pattern filter */}
                    <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-white/5">
                      {(['all', 'JEE Main', 'JEE Advanced'] as const).map((pat) => (
                        <button
                          key={pat}
                          onClick={() => setChartFilter(pat)}
                          className={`px-3 py-1 text-[10px] rounded-lg transition-all cursor-pointer font-sans border ${
                            chartFilter === pat
                              ? theme === 'cyber' ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-xs scale-[1.01]' :
                                theme === 'light' ? 'bg-rose-500 text-white border-rose-500 font-bold shadow-xs scale-[1.01]' :
                                theme === 'slate' ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-bold shadow-xs scale-[1.01]' :
                                'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs scale-[1.01]'
                              : 'bg-accent/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
                          }`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>

                    {/* Subject/Metrics filter */}
                    <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-white/5">
                      {[
                        { id: 'total', label: 'Total Scored' },
                        { id: 'physics', label: 'Physics' },
                        { id: 'chemistry', label: 'Chemistry' },
                        { id: 'math', label: 'Maths' }
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setChartSubjectFilter(sub.id as any)}
                          className={`px-3 py-1 text-[10px] rounded-lg transition-all cursor-pointer font-sans border ${
                            chartSubjectFilter === sub.id
                              ? theme === 'cyber' ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-xs scale-[1.01]' :
                                theme === 'light' ? 'bg-rose-500 text-white border-rose-500 font-bold shadow-xs scale-[1.01]' :
                                theme === 'slate' ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-bold shadow-xs scale-[1.01]' :
                                'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs scale-[1.01]'
                              : 'bg-accent/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SVG Animated Chart Layout */}
                <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-4 left-4 select-none pointer-events-none">
                    <span className="text-[10px] font-mono text-muted-foreground block uppercase tracking-wider">Performance curve</span>
                    <h4 className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Plotting Marks percentage (%) Chronologically
                    </h4>
                  </div>
                  
                  {/* Legend indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-4 text-[10px] font-mono text-muted-foreground select-none pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme === 'cyber' ? 'bg-emerald-400' : 'bg-indigo-500'}`} />
                      <span>{chartSubjectFilter === 'total' ? 'Overall score' : `${chartSubjectFilter.charAt(0).toUpperCase() + chartSubjectFilter.slice(1)}`}</span>
                    </div>
                  </div>

                  <div className="w-full mt-10 overflow-x-auto no-scrollbar">
                    <div className="min-w-[640px] h-[340px] flex items-center justify-center">
                      <svg width={svgDimensions.width} height={svgDimensions.height} className="overflow-visible">
                        {/* Horizontal grid lines */}
                        {[0, 20, 40, 60, 80, 100].map((val, idx) => {
                          const y = svgDimensions.padding + (svgDimensions.height - svgDimensions.padding * 2) - (val / 100) * (svgDimensions.height - svgDimensions.padding * 2);
                          return (
                            <g key={idx}>
                              <line
                                x1={svgDimensions.padding}
                                y1={y}
                                x2={svgDimensions.width - svgDimensions.padding}
                                y2={y}
                                stroke="rgba(148, 163, 184, 0.25)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={svgDimensions.padding - 10}
                                y={y + 3}
                                textAnchor="end"
                                className="fill-slate-300 dark:fill-slate-100 text-[10px] font-mono font-semibold"
                              >
                                {val}%
                              </text>
                            </g>
                          );
                        })}

                        {/* Chart Line and Dots */}
                        {svgCoordinates.length > 1 && (
                          <>
                            {/* Area Fill */}
                            <path
                              d={`
                                M ${svgCoordinates[0].x} ${svgDimensions.height - svgDimensions.padding}
                                L ${svgCoordinates.map(c => `${c.x} ${c.y}`).join(' L ')}
                                L ${svgCoordinates[svgCoordinates.length - 1].x} ${svgDimensions.height - svgDimensions.padding}
                                Z
                              `}
                              fill={
                                theme === 'cyber' ? 'url(#cyberArea)' :
                                theme === 'light' ? 'url(#roseArea)' :
                                theme === 'slate' ? 'url(#cyanArea)' :
                                'url(#indigoArea)'
                              }
                              opacity="0.1"
                            />

                            {/* Main Curve Line */}
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              d={`M ${svgCoordinates.map(c => `${c.x} ${c.y}`).join(' L ')}`}
                              fill="none"
                              stroke={
                                theme === 'cyber' ? '#10b981' :
                                theme === 'light' ? '#f43f5e' :
                                theme === 'slate' ? '#06b6d4' :
                                '#6366f1'
                              }
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Data points (Interactive Dots) */}
                            {svgCoordinates.map((pt, idx) => (
                              <g
                                key={idx}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredDataPoint(pt)}
                                onMouseLeave={() => setHoveredDataPoint(null)}
                              >
                                {/* Glow circle on hover */}
                                {hoveredDataPoint?.test.id === pt.test.id && (
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="9"
                                    fill={
                                      theme === 'cyber' ? '#10b981' :
                                      theme === 'light' ? '#f43f5e' :
                                      theme === 'slate' ? '#06b6d4' :
                                      '#6366f1'
                                    }
                                    opacity="0.3"
                                    className="animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="5"
                                  fill={
                                    theme === 'cyber' ? '#000' :
                                    theme === 'light' ? '#fff' :
                                    theme === 'slate' ? '#0f172a' :
                                    '#fff'
                                  }
                                  stroke={
                                    theme === 'cyber' ? '#10b981' :
                                    theme === 'light' ? '#f43f5e' :
                                    theme === 'slate' ? '#06b6d4' :
                                    '#6366f1'
                                  }
                                  strokeWidth="2.5"
                                  className="transition-all duration-150 hover:r-7"
                                />
                                {/* Bottom X axis dates */}
                                <text
                                  x={pt.x}
                                  y={svgDimensions.height - svgDimensions.padding + 18}
                                  textAnchor="middle"
                                  className="fill-slate-300 dark:fill-slate-100 text-[10px] font-mono font-semibold"
                                >
                                  {pt.test.date.split('-').slice(1).join('/')}
                                </text>
                              </g>
                            ))}
                          </>
                        )}

                        {/* Defining Gradients */}
                        <defs>
                          <linearGradient id="cyberArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#000000" />
                          </linearGradient>
                          <linearGradient id="roseArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#000000" />
                          </linearGradient>
                          <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#000000" />
                          </linearGradient>
                          <linearGradient id="indigoArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#000000" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  {/* Interactive Chart Tooltip Portal */}
                  <AnimatePresence>
                    {hoveredDataPoint && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-4 left-4 right-4 bg-black/90 dark:bg-slate-900/95 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-xl"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                              theme === 'cyber' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              theme === 'light' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                              theme === 'slate' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {hoveredDataPoint.test.pattern}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {hoveredDataPoint.test.date}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            Score: {hoveredDataPoint.test.totalMarksScored} / {hoveredDataPoint.test.fullMarks} ({hoveredDataPoint.scorePercentage.toFixed(1)}%)
                          </div>
                        </div>

                        {/* Subject stats preview in tooltip */}
                        <div className="flex gap-4 text-xs font-mono">
                          <div className="border-l border-white/5 pl-3">
                            <div className="text-sky-400 font-semibold">Physics</div>
                            <div>{hoveredDataPoint.test.physics?.score ?? 0}m</div>
                          </div>
                          <div className="border-l border-white/5 pl-3">
                            <div className="text-amber-400 font-semibold">Chemistry</div>
                            <div>{hoveredDataPoint.test.chemistry?.score ?? 0}m</div>
                          </div>
                          <div className="border-l border-white/5 pl-3">
                            <div className="text-purple-400 font-semibold">Maths</div>
                            <div>{hoveredDataPoint.test.math?.score ?? 0}m</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Over-Arching Analytics Coaching Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-primary/[0.02] border border-white/5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Overall Syllabus Curve Progress</h4>
                      <h3 className="text-base font-bold font-display text-foreground mt-1.5">Aggregate Consistency</h3>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Based on your accumulated history of {mockTests.length} examinations, your current average score stands at <span className="text-foreground font-bold">{overallPerformance?.avgPercentage.toFixed(1)}%</span>.
                      </p>
                      <div className="mt-4 p-4 rounded-xl bg-background border border-border">
                        <span className={`text-xs font-bold ${accentColorText}`}>{overallPerformance?.label}</span>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{overallPerformance?.feedback}</p>
                      </div>
                    </div>
                  </div>

                  {/* High Yield Suggestion block */}
                  <div className="p-5 rounded-2xl bg-accent/5 dark:bg-black/35 border border-white/5 space-y-4 select-none">
                    <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BrainCircuit className="w-4 h-4 text-amber-400 shrink-0" /> Recommended Strategy Core Rules
                    </h4>
                    <ul className="space-y-2.5 text-[11px] text-muted-foreground leading-relaxed">
                      <li className="flex gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Log incorrect answers immediately in your Mistakes Book tab for systematic concept gap plugging.</span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Attempt Mock tests during exact slot hours to synchronize your body clock with official JEE times.</span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Work on Chemistry first to maximize scoring buffer, leaving generous time blocks for analytical Maths.</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* HISTORIC LIST & HUMAN COACH FEEDBACK TAB */}
        {activeSubTab === 'history' && (
          <div
            className="space-y-6 animate-fade-in"
          >
            {mockTests.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3">
                <Calendar className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">Whiteboard Empty</h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Log a JEE Main or Advanced mock score inside the "Log Score" tab to begin compiling your exam ledger.
                </p>
                <button
                  onClick={() => setActiveSubTab('log')}
                  className={`mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-accent/15 hover:bg-accent/30 border border-border transition-all cursor-pointer ${buttonHoverColor}`}
                >
                  Log Test Score
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-h-[800px] overflow-y-auto pr-1 dashboard-card-gpu">
                {mockTests.map((test) => {
                  const coach = getCoachAdvice(test);
                  const p = test.physics || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };
                  const c = test.chemistry || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };
                  const m = test.math || { score: 0, correct: 0, incorrect: 0, unattempted: 0 };

                  const accuracy = (((p.correct ?? 0) + (c.correct ?? 0) + (m.correct ?? 0)) / 
                    (((p.correct ?? 0) + (c.correct ?? 0) + (m.correct ?? 0) + 
                      (p.incorrect ?? 0) + (c.incorrect ?? 0) + (m.incorrect ?? 0)) || 1)) * 100;
                  
                  return (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl bg-card border border-border space-y-5 transition-all hover:border-border/80 hover:shadow-md"
                    >
                      {/* Top Header Row of log item */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wide border ${
                              theme === 'cyber' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              theme === 'light' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                              theme === 'slate' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {test.pattern}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {test.date}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Performance Level: <span className={`font-bold ${coach.color}`}>{coach.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block font-mono">Total score</span>
                            <span className={`text-base font-black ${accentColorText}`}>
                              {test.totalMarksScored} <span className="text-xs text-muted-foreground font-normal">/ {test.fullMarks}</span>
                            </span>
                          </div>
                          
                          <button
                            onClick={() => onDeleteTest(test.id)}
                            className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete exam log"
                            aria-label="Delete exam log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Score Metrics details table grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-sky-500/[0.01] border border-sky-500/10 rounded-xl space-y-1">
                          <div className="text-xs font-bold text-sky-400">Physics</div>
                          <div className="text-sm font-bold">{p.score ?? 0} marks</div>
                          <div className="text-[10px] font-mono text-muted-foreground flex justify-between">
                            <span>{p.correct ?? 0} correct</span>
                            <span>{p.incorrect ?? 0} incorrect</span>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-500/[0.01] border border-amber-500/10 rounded-xl space-y-1">
                          <div className="text-xs font-bold text-amber-400">Chemistry</div>
                          <div className="text-sm font-bold">{c.score ?? 0} marks</div>
                          <div className="text-[10px] font-mono text-muted-foreground flex justify-between">
                            <span>{c.correct ?? 0} correct</span>
                            <span>{c.incorrect ?? 0} incorrect</span>
                          </div>
                        </div>

                        <div className="p-3 bg-purple-500/[0.01] border border-purple-500/10 rounded-xl space-y-1">
                          <div className="text-xs font-bold text-purple-400">Mathematics</div>
                          <div className="text-sm font-bold">{m.score ?? 0} marks</div>
                          <div className="text-[10px] font-mono text-muted-foreground flex justify-between">
                            <span>{m.correct ?? 0} correct</span>
                            <span>{m.incorrect ?? 0} incorrect</span>
                          </div>
                        </div>
                      </div>

                      {/* Coach dynamic advisory feedback portal */}
                      <div className={`p-4.5 rounded-xl border ${coach.bg} space-y-3`}>
                        <div className="flex items-center gap-2 font-display text-xs font-extrabold tracking-tight">
                          <Sparkles className="w-4 h-4 text-amber-400" /> Humanized Coaching Assessment & Strategy Advice
                        </div>
                        <p className="text-[11.5px] text-foreground/90 leading-relaxed italic">
                          "{coach.message}"
                        </p>
                        
                        <div className="space-y-1.5 pt-1 border-t border-white/5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Key Actionable Guidelines:</span>
                          <ul className="space-y-1 text-[11px] text-muted-foreground pl-1">
                            {coach.tips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-1.5">
                                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Test Notes if logged */}
                      {test.notes && (
                        <div className="p-4 rounded-xl bg-accent/15 border border-border select-none text-[11px] text-muted-foreground leading-relaxed">
                          <span className="font-bold text-foreground block mb-1">Self-Logged Takeaways:</span>
                          "{test.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
});

export default MockTestTracker;
