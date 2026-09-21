import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrepTrackDB } from './db';
import { RateLimiter } from './utils/rateLimit';
import { validateNumber, validateString, validateDate } from './utils/validators';
import { 
  StudySession, 
  DailyQuestions, 
  ErrorBookItem, 
  SpecialImportanceItem, 
  UserSettings, 
  ThemeType,
  FeedbackItem,
  MockTest,
  Subject
} from './types';

// Subcomponents
import TimerSection from './components/TimerSection';
import FeedbackModal from './components/FeedbackModal';
import QuickNotes from './components/QuickNotes';
import ToastContainer, { Toast } from './components/ToastContainer';
import { CLASS_11_SYLLABUS, CLASS_12_SYLLABUS } from './data/syllabus';
import DashboardTab from './components/DashboardTab';
import HeaderClock from './components/HeaderClock';
import { BrandingLogo } from './components/BrandingLogo';
import { WindowedStudyLog } from './components/WindowedStudyLog';
import { ScrollProgressAndTop } from './components/ScrollProgressAndTop';

// Lazy loaded workspace features for loading performance
const AnalyticsCharts = lazy(() => import('./components/AnalyticsCharts'));
const QuestionTrackerForm = lazy(() => import('./components/QuestionTrackerForm'));
const SyllabusTracker = lazy(() => import('./components/SyllabusTracker'));
const NotesAndErrors = lazy(() => import('./components/NotesAndErrors'));
const MockTestTracker = lazy(() => import('./components/MockTestTracker'));
const SettingsTab = lazy(() => import('./components/SettingsTab'));

// High-performance loading fallback component
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4">
    <div className="relative flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500/15 border-t-indigo-500 animate-spin"></div>
      <div className="absolute w-6 h-6 rounded-full border-4 border-emerald-500/10 border-b-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-bold tracking-tight text-foreground/80">Loading workspace...</h4>
      <p className="text-[11px] text-muted-foreground max-w-[200px]">Retrieving secure local logs & charts.</p>
    </div>
  </div>
);

// Lucide Icons
import { 
  Timer, 
  BarChart, 
  BookOpen, 
  AlertCircle, 
  BookMarked,
  Settings, 
  Trash2, 
  TrendingUp, 
  History,
  ArrowUp,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Github,
  Moon,
  Sun,
  ShieldAlert,
  ShieldCheck,
  Award,
  CheckCircle,
  Coffee,
  Flame
} from 'lucide-react';

const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
} as const;

const dashboardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 14,
      mass: 0.8
    }
  }
} as const;

export default function App() {
  // Database States
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'glass',
    pomodoroWorkDuration: 25,
    pomodoroBreakDuration: 5,
    dailyStudyMinutesGoal: 180,
    dailyQuestionsSolvedGoal: 30,
    clockFormat: '12',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  });
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [questions, setQuestions] = useState<DailyQuestions[]>([]);
  const [errorBook, setErrorBook] = useState<ErrorBookItem[]>([]);
  const [specialImportance, setSpecialImportance] = useState<SpecialImportanceItem[]>([]);
  const [chapterCompletions, setChapterCompletions] = useState<Record<string, boolean>>({});
  const [mockTests, setMockTests] = useState<MockTest[]>([]);

  // UI Control states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'questions' | 'syllabus' | 'notes' | 'mock_tests' | 'settings'>('dashboard');
  const [dbLoading, setDbLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isBannerClockScrolledOut, setIsBannerClockScrolledOut] = useState(false);

  // Client-side rate limiters to prevent localStorage/IndexedDB write spamming
  const saveSettingsLimiter = useMemo(() => new RateLimiter(1000), []);
  const saveSessionLimiter = useMemo(() => new RateLimiter(1000), []);
  const saveQuestionsLimiter = useMemo(() => new RateLimiter(1000), []);
  const addErrorLimiter = useMemo(() => new RateLimiter(1000), []);
  const addImportanceLimiter = useMemo(() => new RateLimiter(1000), []);
  const saveMockTestLimiter = useMemo(() => new RateLimiter(1000), []);
  const toggleChapterLimiter = useMemo(() => new RateLimiter(300), []);

  // Track scroll position to dynamically show/hide the header clock
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const scrolled = window.scrollY > 150;
      setIsBannerClockScrolledOut((prev) => {
        if (prev !== scrolled) {
          return scrolled;
        }
        return prev;
      });
    };

    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'goal' = 'goal') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const handleCloseToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Clickjacking and Malicious Hostile Framing Shield
  useEffect(() => {
    try {
      if (window.self !== window.top) {
        const referrer = document.referrer || '';
        const safeHosts = ['google.com', 'ai.studio', 'googleusercontent.com', 'localhost', 'run.app', '127.0.0.1'];
        const isAuthorizedHost = safeHosts.some(host => referrer.includes(host) || window.location.hostname === 'localhost');
        if (!isAuthorizedHost && referrer !== '') {
          console.warn('Hostile framing detected. Mitigating clickjacking risk.');
          window.top!.location.href = window.location.href;
        }
      }
    } catch (e) {
      console.warn('Framing warning: Strict cross-origin framing detected. Content isolated.');
    }
  }, []);

  // Manage high-level CSS classes and single transition morphing filter effect on root documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-morphing');
    
    const allThemes = ['theme-glass', 'theme-cyber', 'theme-light', 'theme-slate'];
    allThemes.forEach((t) => root.classList.remove(t));
    root.classList.add(`theme-${settings.theme}`);

    const timer = setTimeout(() => {
      root.classList.remove('theme-morphing');
    }, 200);

    return () => clearTimeout(timer);
  }, [settings.theme]);

  // Load database files
  useEffect(() => {
    async function initDB() {
      try {
        const loadedSettings = await PrepTrackDB.getSettings();
        const loadedSessions = await PrepTrackDB.getStudySessions();
        const loadedQuestions = await PrepTrackDB.getQuestionsSolved();
        const loadedErrors = await PrepTrackDB.getErrorBook();
        const loadedImportance = await PrepTrackDB.getSpecialImportance();
        const loadedCompletions = await PrepTrackDB.getChapterCompletion();
        const loadedMockTests = await PrepTrackDB.getMockTests();

        setSettings(loadedSettings);
        setSessions(loadedSessions);
        setQuestions(loadedQuestions);
        setErrorBook(loadedErrors);
        setSpecialImportance(loadedImportance);
        setChapterCompletions(loadedCompletions);
        setMockTests(loadedMockTests);
      } catch (err) {
        console.error('Failed to load local database logs', err);
      } finally {
        setDbLoading(false);
      }
    }
    initDB();
  }, []);

  // Set active tab scroll safely
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // --- SAVE CALLBACKS UNIFYING DB AND REACT STATE ---
  const handleSaveSettings = useCallback(async (nextSettings: UserSettings) => {
    try {
      const result = await saveSettingsLimiter.throttle(async () => {
        await PrepTrackDB.saveSettings(nextSettings);
        setSettings(nextSettings);
      });
      if (result === null) {
        addToast('⚠️ Rate Limited', 'Please wait before saving again', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [saveSettingsLimiter, addToast]);

  const handleSaveStudySession = useCallback(async (session: StudySession) => {
    try {
      const result = await saveSessionLimiter.throttle(async () => {
        await PrepTrackDB.saveStudySession(session);
        setSessions((prev) => [session, ...prev]);
      });
      if (result === null) {
        addToast('⚠️ Rate Limited', 'Please wait before saving again', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [saveSessionLimiter, addToast]);

  const handleDeleteStudySession = useCallback(async (id: string) => {
    if (confirm('Delete this study log entry permanently?')) {
      try {
        await PrepTrackDB.deleteStudySession(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveQuestions = useCallback(async (record: DailyQuestions) => {
    try {
      const validated: DailyQuestions = {
        date: validateDate(record.date),
        math: validateNumber(record.math, 0, 1000),
        physics: validateNumber(record.physics, 0, 1000),
        chemistry: validateNumber(record.chemistry, 0, 1000),
        math_pyq_main: validateNumber(record.math_pyq_main, 0, 1000),
        math_pyq_adv: validateNumber(record.math_pyq_adv, 0, 1000),
        physics_pyq_main: validateNumber(record.physics_pyq_main, 0, 1000),
        physics_pyq_adv: validateNumber(record.physics_pyq_adv, 0, 1000),
        chemistry_pyq_main: validateNumber(record.chemistry_pyq_main, 0, 1000),
        chemistry_pyq_adv: validateNumber(record.chemistry_pyq_adv, 0, 1000),
      };
      const result = await saveQuestionsLimiter.throttle(async () => {
        await PrepTrackDB.saveQuestionsSolved(validated);
        setQuestions((prev) => {
          const existingIdx = prev.findIndex((q) => q.date === validated.date);
          if (existingIdx > -1) {
            const updated = [...prev];
            updated[existingIdx] = validated;
            return updated;
          }
          return [...prev, validated].sort((a, b) => a.date.localeCompare(b.date));
        });
      });
      if (result === null) {
        addToast('⚠️ Rate Limited', 'Please wait before saving again', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [saveQuestionsLimiter, addToast]);

  const handleAddErrorItem = useCallback(async (item: ErrorBookItem) => {
    try {
      const validated: ErrorBookItem = {
        id: validateString(item.id, 100),
        subject: (['physics', 'chemistry', 'math', 'general'].includes(item.subject) ? item.subject : 'general') as Subject,
        chapter: validateString(item.chapter, 200),
        mistake: validateString(item.mistake, 2000),
        correction: validateString(item.correction, 2000),
        tags: Array.isArray(item.tags) ? item.tags.map((t) => validateString(t, 50)) : [],
        timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now()
      };
      const result = await addErrorLimiter.throttle(async () => {
        await PrepTrackDB.saveErrorBookItem(validated);
        setErrorBook((prev) => [validated, ...prev]);
      });
      if (result === null) {
        addToast('⚠️ Rate Limited', 'Please wait before saving again', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [addErrorLimiter, addToast]);

  const handleDeleteErrorItem = useCallback(async (id: string) => {
    try {
      await PrepTrackDB.deleteErrorBookItem(id);
      setErrorBook((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddImportanceItem = useCallback(async (item: SpecialImportanceItem) => {
    try {
      const validated: SpecialImportanceItem = {
        id: validateString(item.id, 100),
        title: validateString(item.title, 200),
        topic: validateString(item.topic, 200),
        content: validateString(item.content, 5000),
        subject: (['physics', 'chemistry', 'math', 'general'].includes(item.subject) ? item.subject : 'general') as Subject,
        timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now()
      };
      const result = await addImportanceLimiter.throttle(async () => {
        await PrepTrackDB.saveSpecialImportanceItem(validated);
        setSpecialImportance((prev) => [validated, ...prev]);
      });
      if (result === null) {
        addToast('⚠️ Rate Limited', 'Please wait before saving again', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [addImportanceLimiter, addToast]);

  const handleDeleteImportanceItem = useCallback(async (id: string) => {
    try {
      await PrepTrackDB.deleteSpecialImportanceItem(id);
      setSpecialImportance((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveMockTest = useCallback(async (test: MockTest) => {
    try {
      const validatedPhysics = test.physics ? {
        score: validateNumber(test.physics.score, -360, 1000),
        correct: validateNumber(test.physics.correct, 0, 200),
        incorrect: validateNumber(test.physics.incorrect, 0, 200),
        unattempted: validateNumber(test.physics.unattempted, 0, 200),
      } : { score: 0, correct: 0, incorrect: 0, unattempted: 0 };

      const validatedChemistry = test.chemistry ? {
        score: validateNumber(test.chemistry.score, -360, 1000),
        correct: validateNumber(test.chemistry.correct, 0, 200),
        incorrect: validateNumber(test.chemistry.incorrect, 0, 200),
        unattempted: validateNumber(test.chemistry.unattempted, 0, 200),
      } : { score: 0, correct: 0, incorrect: 0, unattempted: 0 };

      const validatedMath = test.math ? {
        score: validateNumber(test.math.score, -360, 1000),
        correct: validateNumber(test.math.correct, 0, 200),
        incorrect: validateNumber(test.math.incorrect, 0, 200),
        unattempted: validateNumber(test.math.unattempted, 0, 200),
      } : { score: 0, correct: 0, incorrect: 0, unattempted: 0 };

      const totalScored = validatedPhysics.score + validatedChemistry.score + validatedMath.score;

      const validated: MockTest = {
        id: validateString(test.id, 100),
        date: validateDate(test.date),
        pattern: test.pattern === 'JEE Advanced' ? 'JEE Advanced' : 'JEE Main',
        fullMarks: validateNumber(test.fullMarks, 1, 2000),
        totalMarksScored: totalScored,
        physics: validatedPhysics,
        chemistry: validatedChemistry,
        math: validatedMath,
        notes: test.notes ? validateString(test.notes, 1000) : undefined,
        timestamp: typeof test.timestamp === 'number' ? test.timestamp : Date.now()
      };

      const result = await saveMockTestLimiter.throttle(async () => {
        await PrepTrackDB.saveMockTest(validated);
        setMockTests((prev) => [validated, ...prev]);
        addToast(
          '🏆 Mock Test Logged!',
          `Your ${validated.pattern} score of ${validated.totalMarksScored}/${validated.fullMarks} has been saved. Go to the Interactive Trend tab to map your progress!`,
          'success'
        );
      });
      if (result === null) {
        addToast('⚠️ Rate Limited', 'Please wait before saving again', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [saveMockTestLimiter, addToast]);

  const handleDeleteMockTest = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this mock test log entry permanently?')) {
      try {
        await PrepTrackDB.deleteMockTest(id);
        setMockTests((prev) => prev.filter((t) => t.id !== id));
        addToast('🗑️ Exam Entry Deleted', 'The mock test score log has been removed from database.', 'info');
      } catch (e) {
        console.error(e);
      }
    }
  }, [addToast]);

  const handleToggleChapter = useCallback(async (id: string, completed: boolean) => {
    try {
      await PrepTrackDB.saveChapterCompletion(id, completed);
      setChapterCompletions((prev) => ({ ...prev, [id]: completed }));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleClearChapters = useCallback(async () => {
    if (confirm('Are you sure you want to completely clear all chapter tick mark statuses? This cannot be undone.')) {
      try {
        await PrepTrackDB.clearChapterCompletions();
        setChapterCompletions({});
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveFeedback = useCallback((feedback: FeedbackItem) => {
    // Simply logging or aggregating feedback safely
    console.log('Feedback submitted locally:', feedback);
  }, []);

  const handleResetAllData = async () => {
    try {
      await PrepTrackDB.resetAllData();
      // Reload defaults
      setSettings({
        theme: 'glass',
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
        dailyStudyMinutesGoal: 180,
        dailyQuestionsSolvedGoal: 30,
      });
      setSessions([]);
      setQuestions([]);
      setErrorBook([]);
      setSpecialImportance([]);
      setChapterCompletions({});
      setMockTests([]);
      setShowResetConfirm(false);
      setActiveTab('dashboard');
      addToast('Data Reset', 'All PrepTrack device data was successfully deleted. App has been reset!', 'info');
    } catch (e) {
      console.error('Failed to reset local workspace', e);
    }
  };

  // Sessions today count tracker
  const sessionsTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return sessions.filter((s) => new Date(s.startTime).toDateString() === todayStr).length;
  }, [sessions]);

  // Study minutes logged today
  const studyMinutesToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    const sec = sessions
      .filter((s) => new Date(s.startTime).toDateString() === todayStr)
      .reduce((acc, s) => acc + s.duration, 0);
    return Math.floor(sec / 60);
  }, [sessions]);

  // Accurate syllabus completion stats
  const syllabusStats = useMemo(() => {
    const total = CLASS_11_SYLLABUS.length + CLASS_12_SYLLABUS.length;
    const completed = Object.values(chapterCompletions).filter(Boolean).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [chapterCompletions]);

  // Questions solved today
  const questionsSolvedToday = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${day}`;
    
    const todayRecord = questions.find((q) => q.date === todayStr);
    if (!todayRecord) return 0;
    
    const questionsCount = (todayRecord.physics || 0) + (todayRecord.chemistry || 0) + (todayRecord.math || 0);
    const pyqsCount = (todayRecord.physics_pyq_main || 0) + (todayRecord.physics_pyq_adv || 0) +
                      (todayRecord.chemistry_pyq_main || 0) + (todayRecord.chemistry_pyq_adv || 0) +
                      (todayRecord.math_pyq_main || 0) + (todayRecord.math_pyq_adv || 0);
    return questionsCount + pyqsCount;
  }, [questions]);

  // Track and trigger Toast celebrations when daily study or questions goals are reached
  const prevStudyMinutes = useRef<number | null>(null);
  const prevQuestionCount = useRef<number | null>(null);

  useEffect(() => {
    if (dbLoading) return; // Wait until local data loads completely
    
    const studyGoalMins = settings.dailyStudyMinutesGoal ?? 180;
    
    if (prevStudyMinutes.current !== null) {
      if (studyMinutesToday >= studyGoalMins && prevStudyMinutes.current < studyGoalMins) {
        addToast(
          '🔥 Study Goal Reached!',
          `Incredible dedication! You have successfully completed ${studyMinutesToday} minutes of focused study today, passing your target of ${studyGoalMins} minutes. Keep up this championship momentum!`,
          'goal'
        );
      }
    }
    prevStudyMinutes.current = studyMinutesToday;
  }, [studyMinutesToday, settings.dailyStudyMinutesGoal, dbLoading]);

  useEffect(() => {
    if (dbLoading) return; // Wait until local data loads completely
    
    const questionGoalCount = settings.dailyQuestionsSolvedGoal ?? 30;
    
    if (prevQuestionCount.current !== null) {
      if (questionsSolvedToday >= questionGoalCount && prevQuestionCount.current < questionGoalCount) {
        addToast(
          '⚡ Question Goal Surpassed!',
          `Tremendous performance! You solved ${questionsSolvedToday} questions today, successfully meeting your daily milestone of ${questionGoalCount}. Excellence logged!`,
          'goal'
        );
      }
    }
    prevQuestionCount.current = questionsSolvedToday;
  }, [questionsSolvedToday, settings.dailyQuestionsSolvedGoal, dbLoading]);

  // Aggregate questions metrics
  const questionAggregatess = useMemo(() => {
    let totQuestions = 0;
    let totPYQs = 0;

    questions.forEach((q) => {
      totQuestions += (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
      totPYQs += (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                 (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                 (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
    });

    return { totalMath: totQuestions + totPYQs, totalSolved: totQuestions + totPYQs, pyqs: totPYQs, normal: totQuestions };
  }, [questions]);

  // Dynamic daily study streak metric calculations
  const streakStats = useMemo(() => {
    const studyGoalMins = settings.dailyStudyMinutesGoal ?? 180;
    const questionGoalCount = settings.dailyQuestionsSolvedGoal ?? 30;

    const getLocalDateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Date keys map with respective aggregated scores
    const dayRecords: Record<string, { studyMins: number; questionsSolved: number; met: boolean }> = {};

    // 1. Process all historical study sessions
    sessions.forEach((s) => {
      const dKey = getLocalDateKey(new Date(s.startTime));
      if (!dayRecords[dKey]) {
        dayRecords[dKey] = { studyMins: 0, questionsSolved: 0, met: false };
      }
      dayRecords[dKey].studyMins += Math.floor(s.duration / 60);
    });

    // 2. Process all dynamic questions entries
    questions.forEach((q) => {
      const dKey = q.date; // already YYYY-MM-DD
      if (!dayRecords[dKey]) {
        dayRecords[dKey] = { studyMins: 0, questionsSolved: 0, met: false };
      }
      const questionsCount = (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
      const pyqsCount = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                        (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                        (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
      dayRecords[dKey].questionsSolved += (questionsCount + pyqsCount);
    });

    // 3. Mark days that crossed either of the targets
    Object.keys(dayRecords).forEach((dStr) => {
      const record = dayRecords[dStr];
      record.met = (record.studyMins >= studyGoalMins) || (record.questionsSolved >= questionGoalCount);
    });

    // 4. Trace backwards to calculate current active streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = getLocalDateKey(today);
    const metToday = dayRecords[todayStr]?.met || false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterday);
    const metYesterday = dayRecords[yesterdayStr]?.met || false;

    let traceDate = new Date();
    // If today is study-completed, trace starting from today.
    // Otherwise, if yesterday is completed, start tracing from yesterday so the streak stays alive in-day.
    if (!metToday && metYesterday) {
      traceDate.setDate(traceDate.getDate() - 1);
    }

    if (metToday || metYesterday) {
      while (true) {
        const traceStr = getLocalDateKey(traceDate);
        if (dayRecords[traceStr]?.met) {
          currentStreak++;
          traceDate.setDate(traceDate.getDate() - 1);
        } else {
          break; // broke
        }
      }
    }

    // 5. Calculate all-time longest streak
    const uniqueDates = Object.keys(dayRecords).filter(k => dayRecords[k].met).sort();
    let maxStreak = 0;
    let runStreak = 0;
    let lastDate: Date | null = null;

    uniqueDates.forEach((dStr) => {
      const cur = new Date(dStr);
      if (lastDate === null) {
        runStreak = 1;
      } else {
        const timeDiff = Math.abs(cur.getTime() - lastDate.getTime());
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff <= 1) {
          runStreak++;
        } else {
          runStreak = 1;
        }
      }
      lastDate = cur;
      if (runStreak > maxStreak) {
        maxStreak = runStreak;
      }
    });

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    // 6. Assemble status of the past 7 days for the visual tracker grid
    const weeklyGrid = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateKey(d);
      const r = dayRecords[dStr] || { studyMins: 0, questionsSolved: 0, met: false };
      
      const dayAbbrev = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();

      weeklyGrid.push({
        dateStr: dStr,
        dayAbbrev,
        dayNum,
        isToday: i === 0,
        studyMins: r.studyMins,
        questionsSolved: r.questionsSolved,
        met: r.met,
        activeAtAll: r.studyMins > 0 || r.questionsSolved > 0
      });
    }

    return {
      currentStreak,
      maxStreak,
      metToday,
      metYesterday,
      weeklyGrid,
      dayRecords
    };
  }, [sessions, questions, settings]);

  useEffect(() => {
    // Sync the HTML/Body background and classes with current theme
    const themes = ['theme-glass', 'theme-slate', 'theme-cyber', 'theme-light'];
    themes.forEach(t => {
      document.documentElement.classList.remove(t);
      document.body.classList.remove(t);
    });
    
    document.documentElement.classList.add(`theme-${settings.theme}`);
    document.body.classList.add(`theme-${settings.theme}`);
    
    // Set background color of body explicitly to match theme
    let bgColor = '#050816'; // Default slate
    if (settings.theme === 'glass') bgColor = '#060713';
    else if (settings.theme === 'cyber') bgColor = '#020905';
    else if (settings.theme === 'light') bgColor = '#fffbf7';
    else if (settings.theme === 'slate') bgColor = '#050816';
    
    document.body.style.backgroundColor = bgColor;
    document.documentElement.style.backgroundColor = bgColor;
  }, [settings.theme]);

  // Dynamic Theme Definitions
  // We compute tailwind body color bindings
  const themeStyles = useMemo(() => {
    switch (settings.theme) {
      case 'glass':
        return {
          bg: 'bg-[#080b14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 lg:py-12 space-y-10 md:space-y-12 relative z-10',
          headerBg: 'bg-[#080b14]/85 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-50',
          accentColor: 'text-indigo-400',
          borderStyle: 'border-white/[0.08]',
          cardBg: 'bg-[#0e1322]/85 backdrop-blur-xl border border-white/[0.08] text-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
          navActive: 'bg-white/10 text-white font-semibold',
          navInactive: 'text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium',
          bannerGradient: 'from-slate-900 via-indigo-950 to-slate-900 border border-white/10 shadow-xl',
          themeBrand: '🌌 Obsidian Indigo'
        };
      case 'cyber':
        return {
          bg: 'bg-[#030906] text-emerald-100 selection:bg-emerald-500/30 selection:text-emerald-300',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 lg:py-12 space-y-10 md:space-y-12',
          headerBg: 'bg-[#030906]/85 backdrop-blur-xl border-b border-emerald-500/20 sticky top-0 z-50',
          accentColor: 'text-emerald-400',
          borderStyle: 'border-emerald-500/20',
          cardBg: 'bg-[#06140b] border border-emerald-500/20 text-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.5)]',
          navActive: 'bg-emerald-500/15 text-emerald-300 font-semibold',
          navInactive: 'text-emerald-400/70 hover:text-emerald-200 hover:bg-emerald-500/5 font-medium',
          bannerGradient: 'from-slate-950 via-emerald-950 to-slate-950 border border-emerald-500/25 shadow-xl',
          themeBrand: '⚡ Cyber Emerald'
        };
      case 'light':
        return {
          bg: 'bg-[#f8fafc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 lg:py-12 space-y-10 md:space-y-12',
          headerBg: 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50',
          accentColor: 'text-indigo-600',
          borderStyle: 'border-slate-200/80',
          cardBg: 'bg-white border border-slate-200/80 text-slate-950 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)]',
          navActive: 'bg-slate-100 text-indigo-600 font-semibold shadow-xs',
          navInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium',
          bannerGradient: 'from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl',
          themeBrand: '☀️ Minimal Light'
        };
      case 'slate':
      default:
        return {
          bg: 'bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 lg:py-12 space-y-10 md:space-y-12',
          headerBg: 'bg-[#070b14]/85 backdrop-blur-xl border-b border-white/[0.07] sticky top-0 z-50',
          accentColor: 'text-cyan-400',
          borderStyle: 'border-white/[0.07]',
          cardBg: 'bg-[#0c1224] border border-white/[0.07] text-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.45)]',
          navActive: 'bg-cyan-500/15 text-cyan-300 font-semibold',
          navInactive: 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-500/5 font-medium',
          bannerGradient: 'from-slate-950 via-cyan-950 to-slate-950 border border-cyan-500/20 shadow-xl',
          themeBrand: '💎 Titanium Slate'
        };
    }
  }, [settings.theme]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#0b0c1e] via-[#070814] to-[#12132a] text-white flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.12)_0px,transparent_60%)] animate-pulse" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.25)]">
            <RefreshCw className="w-10 h-10 text-[#818cf8] animate-spin" />
          </div>
          <span className="text-sm font-bold tracking-widest text-[#818cf8] uppercase animate-pulse">PrepTrack Initializing Workspace...</span>
          <span className="text-xs text-slate-400 font-medium max-w-xs text-center leading-relaxed">Preparing your high-vibrancy study dashboard & syllabi trackers</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-300 relative ${themeStyles.bg} theme-${settings.theme}`}
      style={{
        backgroundImage: settings.theme === 'glass'
          ? 'radial-gradient(at 0% 0%, rgba(129, 140, 248, 0.25) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.22) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(168, 85, 247, 0.18) 0px, transparent 55%), radial-gradient(at 10% 90%, rgba(6, 182, 212, 0.15) 0px, transparent 50%)'
          : settings.theme === 'slate'
          ? 'radial-gradient(at 5% 5%, rgba(6, 182, 212, 0.2) 0px, transparent 50%), radial-gradient(at 95% 95%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(13, 16, 35, 0.95) 0px, transparent 100%)'
          : settings.theme === 'cyber'
          ? 'radial-gradient(at 10% 10%, rgba(16, 185, 129, 0.22) 0px, transparent 55%), radial-gradient(at 90% 90%, rgba(6, 182, 212, 0.15) 0px, transparent 50%)'
          : settings.theme === 'light'
          ? 'radial-gradient(at 0% 0%, rgba(244, 63, 94, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.06) 0px, transparent 50%), radial-gradient(at 50% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%)'
          : undefined,
        backgroundColor: settings.theme === 'glass'
          ? '#070814'
          : settings.theme === 'slate'
          ? '#080a15'
          : settings.theme === 'cyber'
          ? '#010804'
          : settings.theme === 'light'
          ? '#fafbfc'
          : undefined
      }}
    >
      
      {/* Dynamic ambient floating backdrops for balanced aesthetic side effects */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {settings.theme === 'glass' && (
          <>
            <div className="absolute top-[10%] left-[5%] w-[450px] h-[450px] rounded-full bg-indigo-600/12 blur-[130px] animate-[floatGlow_25s_infinite_ease-in-out]" />
            <div className="absolute bottom-[15%] right-[5%] w-[500px] h-[500px] rounded-full bg-pink-500/10 blur-[140px] animate-[floatGlowReverse_30s_infinite_ease-in-out]" />
            <div className="absolute top-[40%] right-[15%] w-[380px] h-[380px] rounded-full bg-purple-600/8 blur-[120px] animate-[floatGlow_20s_infinite_ease-in-out]" />
          </>
        )}
        {settings.theme === 'slate' && (
          <>
            <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px] animate-[floatGlow_28s_infinite_ease-in-out]" />
            <div className="absolute bottom-[20%] right-[8%] w-[450px] h-[450px] rounded-full bg-indigo-500/12 blur-[130px] animate-[floatGlowReverse_24s_infinite_ease-in-out]" />
          </>
        )}
        {settings.theme === 'cyber' && (
          <>
            <div className="absolute top-[8%] left-[12%] w-[480px] h-[480px] rounded-full bg-emerald-500/8 blur-[120px] animate-[floatGlow_22s_infinite_ease-in-out]" />
            <div className="absolute bottom-[25%] right-[10%] w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px] animate-[floatGlowReverse_26s_infinite_ease-in-out]" />
          </>
        )}
        {settings.theme === 'light' && (
          <>
            <div className="absolute top-[5%] left-[3%] w-[550px] h-[550px] rounded-full bg-rose-200/20 blur-[140px] animate-[floatGlow_35s_infinite_ease-in-out]" />
            <div className="absolute bottom-[10%] right-[5%] w-[480px] h-[480px] rounded-full bg-amber-100/25 blur-[120px] animate-[floatGlowReverse_28s_infinite_ease-in-out]" />
          </>
        )}
      </div>

      {/* GLOBAL NAVBAR HEADER */}
      <header className={themeStyles.headerBg}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 select-none shrink-0">
            {/* Minimal, crisp branding logo container */}
            <div className="relative group shrink-0 select-none">
              <div className="relative p-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-950 border border-white/10 dark:border-white/10 text-white shadow-xs overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <BrandingLogo size={24} className="shrink-0 relative z-10" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold font-display tracking-tight text-foreground leading-none">
                PrepTrack
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                JEE 2026
              </span>
            </div>
          </div>

          {/* Nav Segmented Control for PC */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-accent/[0.06] border border-border/40 gap-0.5 backdrop-blur-md">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Timer },
              { id: 'analytics', label: 'Analytics', icon: BarChart },
              { id: 'questions', label: 'Questions', icon: Sparkles },
              { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
              { id: 'notes', label: 'Mistakes Book', icon: BookMarked },
              { id: 'mock_tests', label: 'Mock Tests', icon: Award },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold relative transition-all duration-150 cursor-pointer outline-none rounded-lg select-none ${
                    isActive 
                      ? 'text-foreground font-bold shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDesktopSegment"
                      className="absolute inset-0 bg-card border border-border/70 rounded-lg -z-0 shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 shrink-0 z-10 transition-colors ${isActive ? 'text-primary' : 'opacity-70'}`} />
                  <span className="z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Utilities: Live Clock & Theme Toggler */}
          <div className="flex items-center gap-2">
            <HeaderClock 
              clockFormat={settings.clockFormat} 
              timezone={settings.timezone}
              visible={activeTab !== 'dashboard' || isBannerClockScrolledOut} 
            />
            <button
              onClick={() => {
                const themes: ThemeType[] = ['glass', 'slate', 'cyber', 'light'];
                const currentIdx = themes.indexOf(settings.theme);
                const nextTheme = themes[(currentIdx + 1) % themes.length];
                handleSaveSettings({ ...settings, theme: nextTheme });
              }}
              className="p-2 border border-border/50 rounded-xl bg-accent/10 hover:bg-accent/25 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title={`Switch Theme (Current: ${settings.theme})`}
              aria-label={`Switch Theme (Current: ${settings.theme})`}
            >
              {settings.theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE CONSOLE TABS - FIXED BOTTOM NAV BAR FOR NATIVE APP EXPERIENCE */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/60 z-40 flex items-center justify-around px-2 h-16 pb-safe gap-1 shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
        {[
          { id: 'dashboard', label: 'Home', icon: Timer },
          { id: 'analytics', label: 'Stats', icon: BarChart },
          { id: 'questions', label: 'Solved', icon: Sparkles },
          { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
          { id: 'notes', label: 'Mistakes', icon: BookMarked },
          { id: 'mock_tests', label: 'Tests', icon: Award },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 outline-none select-none ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                   layoutId="activeMobileTabPill"
                   className="absolute inset-x-1.5 inset-y-1 rounded-xl -z-0 bg-primary/10 border border-primary/20"
                   transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-4.5 h-4.5 z-10 shrink-0" />
              <span className="z-10 text-[8.5px] font-bold leading-none tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CORE FRAME CONTAINER */}
      <main className={themeStyles.container}>
        
        {/* Sleek breadcrumb and section heading for non-dashboard tracks */}
        {activeTab !== 'dashboard' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-1.5 select-none animate-fade-in border-b border-border/40 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="tracking-wider uppercase font-extrabold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md text-[10px]">
                  Workspace
                </span>
                <span>/</span>
                <span className="uppercase font-bold text-slate-300">
                  {activeTab === 'notes' ? 'mistakes book' : activeTab === 'mock_tests' ? 'mock tests' : activeTab}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-foreground capitalize">
                {activeTab === 'notes' && 'Mistakes & Core Concept Book'}
                {activeTab === 'syllabus' && 'JEE Curriculum Syllabus Track'}
                {activeTab === 'questions' && 'Daily Solved Questions Logger'}
                {activeTab === 'analytics' && 'Syllabus & Time Analytics'}
                {activeTab === 'mock_tests' && 'JEE Mock Test Tracker & Trends'}
                {activeTab === 'settings' && 'Applet Configurations & Customization'}
              </h2>
            </div>
            
            <div className="flex gap-2.5 mt-3 md:mt-0 text-xs font-bold text-muted-foreground bg-card/80 backdrop-blur-md border border-border/80 px-4 py-2 rounded-2xl self-start items-center shadow-md">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <span>{themeStyles.themeBrand}</span>
            </div>
          </div>
        )}

        {/* --- DYNAMIC RENDER OF THEMES OR TABS --- */}
        <div className="space-y-12 md:space-y-14">
          {/* Keep Dashboard always mounted to preserve active running stopwatch and avoid resetting */}
          <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
            <div className={activeTab === 'dashboard' ? 'animate-tab-fade-in' : 'opacity-0'}>
              <DashboardTab
                settings={settings}
                sessions={sessions}
                questions={questions}
                chapterCompletions={chapterCompletions}
                themeStyles={themeStyles}
                onSaveStudySession={handleSaveStudySession}
                onDeleteStudySession={handleDeleteStudySession}
                onTabChange={handleTabChange}
              />
            </div>
          </div>

          {/* TAB 2: PROGRESS HISTORY & BAR CHARTS */}
          <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
            <div className={`space-y-12 md:space-y-14 ${activeTab === 'analytics' ? 'animate-tab-fade-in' : 'opacity-0'}`}>
              <Suspense fallback={<LoadingFallback />}>
                <AnalyticsCharts sessions={sessions} questions={questions} errorItems={errorBook} />
              </Suspense>

              <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-border/60 pb-5">
                  <div>
                    <h3 className="text-lg font-bold font-sans tracking-tight">Full Study Period History Log</h3>
                    <p className="text-xs text-muted-foreground">Historical breakdown of your focused study sessions on this device</p>
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-muted-foreground">No sessions logged yet</span>
                    <p className="text-[10px] text-muted-foreground/55 mt-1">Start stopwatch timer and complete a study study period to display historical charts.</p>
                  </div>
                ) : (
                  <WindowedStudyLog
                    sessions={sessions}
                    onDeleteSession={handleDeleteStudySession}
                    maxHeight="400px"
                    isAnalyticsVariant={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* TAB 3: QUESTIONS LOGGER */}
          <div className={activeTab === 'questions' ? 'block' : 'hidden'}>
            <div className={activeTab === 'questions' ? 'animate-tab-fade-in' : 'opacity-0'}>
              <Suspense fallback={<LoadingFallback />}>
                <QuestionTrackerForm 
                  questionsList={questions}
                  onSaveQuestions={handleSaveQuestions}
                />
              </Suspense>
            </div>
          </div>

          {/* TAB 4: SYLLABUS TABS */}
          <div className={activeTab === 'syllabus' ? 'block' : 'hidden'}>
            <div className={activeTab === 'syllabus' ? 'animate-tab-fade-in' : 'opacity-0'}>
              <Suspense fallback={<LoadingFallback />}>
                <SyllabusTracker 
                  completions={chapterCompletions}
                  onToggleChapter={handleToggleChapter}
                  onClearAll={handleClearChapters}
                />
              </Suspense>
            </div>
          </div>

          {/* TAB 5: NOTES & ERROR BOOKS */}
          <div className={activeTab === 'notes' ? 'block' : 'hidden'}>
            <div className={activeTab === 'notes' ? 'animate-tab-fade-in' : 'opacity-0'}>
              <Suspense fallback={<LoadingFallback />}>
                <NotesAndErrors 
                  errorItems={errorBook}
                  importanceItems={specialImportance}
                  onAddErrorItem={handleAddErrorItem}
                  onDeleteErrorItem={handleDeleteErrorItem}
                  onAddImportanceItem={handleAddImportanceItem}
                  onDeleteImportanceItem={handleDeleteImportanceItem}
                />
              </Suspense>
            </div>
          </div>

          {/* TAB 6: MOCK TEST TRACKER */}
          <div className={activeTab === 'mock_tests' ? 'block' : 'hidden'}>
            <div className={activeTab === 'mock_tests' ? 'animate-tab-fade-in' : 'opacity-0'}>
              <Suspense fallback={<LoadingFallback />}>
                <MockTestTracker 
                  mockTests={mockTests}
                  onAddTest={handleSaveMockTest}
                  onDeleteTest={handleDeleteMockTest}
                  theme={settings.theme}
                  cardBgClass="bg-card/75 backdrop-blur-md"
                />
              </Suspense>
            </div>
          </div>

          {/* TAB 7: SETTINGS & APPEARANCES */}
          <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
            <div className={`bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-10 md:space-y-12 ${activeTab === 'settings' ? 'animate-tab-fade-in' : 'opacity-0'}`}>
              <div className="border-b border-border/60 pb-5">
                <h3 className="text-lg font-bold font-sans tracking-tight">Settings & Appearance</h3>
                <p className="text-xs text-muted-foreground">Customize your study targets, timer intervals, themes, and local datasets.</p>
              </div>

              <Suspense fallback={<LoadingFallback />}>
                <SettingsTab
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onResetAllData={handleResetAllData}
                  showResetConfirm={showResetConfirm}
                  setShowResetConfirm={setShowResetConfirm}
                />
              </Suspense>
            </div>
          </div>




          {/* DYNAMIC FEEDBACK BOOK FOR CLIENT */}
          <FeedbackModal onSubmitFeedback={handleSaveFeedback} />

          {/* DYNAMIC GOAL TOAST NOTIFICATIONS */}
          <ToastContainer toasts={toasts} onClose={handleCloseToast} theme={settings.theme} />

        </div>
      </main>

      {/* FOOTER & RIGHTS */}
      <footer className="border-t border-border mt-16 py-8 bg-card/65 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 space-y-2 select-none">
          <p className="font-semibold text-foreground">PrepTrack — Engineered for Excellence</p>
          <p>© All Rights Reserved 2026. Localized Database Storage Active.</p>
        </div>
      </footer>

      {/* High-Performance Decoupled Scroll Progress & Top Handler */}
      <ScrollProgressAndTop theme={settings.theme} />

    </div>
  );
}
