import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrepTrackDB } from './db';
import { 
  StudySession, 
  DailyQuestions, 
  ErrorBookItem, 
  SpecialImportanceItem, 
  UserSettings, 
  ThemeType,
  FeedbackItem,
  MockTest
} from './types';

// Subcomponents
import TimerSection from './components/TimerSection';
import AnalyticsCharts from './components/AnalyticsCharts';
import QuestionTrackerForm from './components/QuestionTrackerForm';
import SyllabusTracker from './components/SyllabusTracker';
import NotesAndErrors from './components/NotesAndErrors';
import FeedbackModal from './components/FeedbackModal';
import QuickNotes from './components/QuickNotes';
import ToastContainer, { Toast } from './components/ToastContainer';
import MockTestTracker from './components/MockTestTracker';
import { CLASS_11_SYLLABUS, CLASS_12_SYLLABUS } from './data/syllabus';
import DashboardTab from './components/DashboardTab';
import SettingsTab from './components/SettingsTab';
import HeaderClock from './components/HeaderClock';
import { BrandingLogo } from './components/BrandingLogo';
import { WindowedStudyLog } from './components/WindowedStudyLog';
import { ScrollProgressAndTop } from './components/ScrollProgressAndTop';

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
    }, 350);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- SAVE CALLBACKS UNIFYING DB AND REACT STATE ---
  const handleSaveSettings = useCallback(async (nextSettings: UserSettings) => {
    try {
      await PrepTrackDB.saveSettings(nextSettings);
      setSettings(nextSettings);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveStudySession = useCallback(async (session: StudySession) => {
    try {
      await PrepTrackDB.saveStudySession(session);
      // Prepend to show immediately
      setSessions((prev) => [session, ...prev]);
    } catch (e) {
      console.error(e);
    }
  }, []);

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
      await PrepTrackDB.saveQuestionsSolved(record);
      setQuestions((prev) => {
        const existingIdx = prev.findIndex((q) => q.date === record.date);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = record;
          return updated;
        }
        return [...prev, record].sort((a, b) => a.date.localeCompare(b.date));
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddErrorItem = useCallback(async (item: ErrorBookItem) => {
    try {
      await PrepTrackDB.saveErrorBookItem(item);
      setErrorBook((prev) => [item, ...prev]);
    } catch (e) {
      console.error(e);
    }
  }, []);

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
      await PrepTrackDB.saveSpecialImportanceItem(item);
      setSpecialImportance((prev) => [item, ...prev]);
    } catch (e) {
      console.error(e);
    }
  }, []);

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
      await PrepTrackDB.saveMockTest(test);
      setMockTests((prev) => [test, ...prev]);
      addToast(
        '🏆 Mock Test Logged!',
        `Your ${test.pattern} score of ${test.totalMarksScored}/${test.fullMarks} has been saved. Go to the Interactive Trend tab to map your progress!`,
        'success'
      );
    } catch (e) {
      console.error(e);
    }
  }, [addToast]);

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
      alert('All PrepTrack device data was successfully deleted. App has been reset!');
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

  // Dynamic Theme Definitions
  // We compute tailwind body color bindings
  const themeStyles = useMemo(() => {
    switch (settings.theme) {
      case 'glass':
        return {
          bg: 'bg-[#060713] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32 lg:py-16 space-y-12 md:space-y-14 relative z-10',
          headerBg: 'bg-[#0a0c1b]/65 backdrop-blur-2xl border-b border-white/[0.08] sticky top-0 z-40',
          accentColor: 'text-[#818cf8]',
          borderStyle: 'border-white/[0.08]',
          cardBg: 'bg-[#131528]/70 backdrop-blur-xl border border-white/[0.1] text-slate-100 shadow-[0_16px_48px_-12px_rgba(99,102,241,0.22)]',
          navActive: 'bg-white/10 text-white border-b-2 border-indigo-400 font-bold',
          navInactive: 'text-slate-300 hover:text-white hover:bg-white/5 font-medium',
          bannerGradient: 'from-indigo-600 via-purple-600 to-pink-500 border border-white/15 shadow-xl',
          themeBrand: '🌌 Aurora Glass Theme'
        };
      case 'cyber':
        return {
          bg: 'bg-[#020905] text-emerald-100 selection:bg-emerald-500/30 selection:text-emerald-300',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32 lg:py-16 space-y-12 md:space-y-14',
          headerBg: 'bg-[#03150b]/80 backdrop-blur-md border-b border-emerald-500/25 sticky top-0 z-40',
          accentColor: 'text-emerald-400',
          borderStyle: 'border-emerald-500/20',
          cardBg: 'bg-[#051a10]/95 border border-emerald-500/35 text-emerald-50 shadow-[0_16px_48px_-12px_rgba(16,185,129,0.25)]',
          navActive: 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400 font-bold',
          navInactive: 'text-emerald-400 hover:text-emerald-100 hover:bg-emerald-500/10 font-medium',
          bannerGradient: 'from-emerald-500 via-teal-600 to-cyan-500 shadow-[0_8px_32px_rgba(16,185,129,0.2)]',
          themeBrand: '⚡ Cyber Neon Theme'
        };
      case 'light':
        return {
          bg: 'bg-[#fffbf7] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32 lg:py-16 space-y-12 md:space-y-14',
          headerBg: 'bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-sm',
          accentColor: 'text-indigo-600',
          borderStyle: 'border-pink-100/60',
          cardBg: 'bg-white border border-pink-100 text-slate-950 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.06)]',
          navActive: 'bg-pink-50 text-rose-600 border-b-2 border-rose-500 font-bold',
          navInactive: 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 font-medium',
          bannerGradient: 'from-pink-400 via-rose-500 to-amber-400 shadow-[0_8px_32px_rgba(244,63,94,0.15)]',
          themeBrand: '🌸 Spring Blossom Theme'
        };
      case 'slate':
      default:
        return {
          bg: 'bg-[#050816] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200',
          container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32 lg:py-16 space-y-12 md:space-y-14',
          headerBg: 'bg-[#090d24]/80 backdrop-blur-md border-b border-cyan-500/25 sticky top-0 z-40',
          accentColor: 'text-cyan-400',
          borderStyle: 'border-cyan-500/20',
          cardBg: 'bg-[#0d122e]/95 border border-cyan-500/30 text-slate-100 shadow-[0_16px_48px_-12px_rgba(6,182,212,0.25)]',
          navActive: 'bg-cyan-500/15 text-cyan-300 border-b-2 border-cyan-400 font-bold',
          navInactive: 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10 font-medium',
          bannerGradient: 'from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_8px_32px_rgba(6,182,212,0.2)]',
          themeBrand: '💎 Cosmic Ocean Theme'
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
      className={`min-h-screen font-sans transition-colors duration-300 ${themeStyles.bg} theme-${settings.theme}`}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            {/* Custom high-fidelity branding icon with growth paths, success tick & action arrow */}
            <div className="relative group shrink-0 select-none">
              {/* Animated glowing backdrop aura - constant breathing glow */}
              <div 
                className="absolute -inset-1.5 rounded-xl opacity-65 blur-md group-hover:opacity-100 transition duration-1000 animate-pulse-glow"
                style={{
                  background: settings.theme === 'cyber'
                    ? 'linear-gradient(to right, #10b981, #059669, #34d399)'
                    : settings.theme === 'light'
                    ? 'linear-gradient(to right, #f43f5e, #ec4899, #fb7185)'
                    : settings.theme === 'slate'
                    ? 'linear-gradient(to right, #06b6d4, #0891b2, #38bdf8)'
                    : 'linear-gradient(to right, #818cf8, #6366f1, #c084fc)'
                }}
              />
              
              {/* The main logo container box */}
              <div className="relative p-1.5 rounded-xl bg-slate-950 dark:bg-[#030712] border border-primary/30 text-white shadow-lg overflow-hidden flex items-center justify-center">
                {/* A circuiting glowing line effect */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-xl">
                  <div 
                    className="absolute top-0 left-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 animate-circuit-slow"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 40%, ${
                        settings.theme === 'cyber' ? '#10b981' :
                        settings.theme === 'light' ? '#f43f5e' :
                        settings.theme === 'slate' ? '#06b6d4' :
                        '#818cf8'
                      } 50%, ${
                        settings.theme === 'cyber' ? '#059669' :
                        settings.theme === 'light' ? '#fb7185' :
                        settings.theme === 'slate' ? '#0891b2' :
                        '#6366f1'
                      } 60%, transparent 70%)`
                    }}
                  />
                  <div className="absolute inset-[1px] bg-slate-950 dark:bg-[#0a0f1d] rounded-[11px]" />
                </div>
                
                {/* Branding Logo inside */}
                <BrandingLogo size={28} className="shrink-0 relative z-10" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold font-display tracking-tight text-foreground leading-none">PrepTrack</h1>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 hidden xl:block">Your JEE preparation Tracker.</p>
            </div>
          </div>

          {/* Nav Links for PC */}
          <nav className="hidden lg:flex items-center h-full gap-0.5 xl:gap-1.5">
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
              const textClass = isActive 
                ? (settings.theme === 'light' ? 'text-rose-650 font-extrabold' : settings.theme === 'cyber' ? 'text-emerald-400 font-extrabold' : settings.theme === 'slate' ? 'text-cyan-400 font-extrabold' : 'text-[#818cf8] font-extrabold') 
                : (settings.theme === 'light' ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/40' : settings.theme === 'cyber' ? 'text-emerald-500/70 hover:text-emerald-300 hover:bg-emerald-950/20' : settings.theme === 'slate' ? 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20' : 'text-slate-400 hover:text-white hover:bg-white/5');
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`h-16 px-1.5 xl:px-4 flex items-center gap-1 xl:gap-2 text-[10.5px] xl:text-xs font-semibold relative transition-all duration-300 cursor-pointer outline-none rounded-t-lg ${textClass}`}
                >
                  <Icon className="w-4 h-4 shrink-0 z-10" />
                  <span className="z-10">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-1 z-10 ${
                        settings.theme === 'cyber' ? 'bg-emerald-400 shadow-[0_-2px_10px_rgba(16,185,129,0.5)]' :
                        settings.theme === 'light' ? 'bg-rose-500 shadow-[0_-2px_10px_rgba(244,63,94,0.5)]' :
                        settings.theme === 'slate' ? 'bg-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.5)]' :
                        'bg-indigo-400 shadow-[0_-2px_10px_rgba(129,140,248,0.5)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-white/[0.03] rounded-t-lg z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick theme toggler in navbar for supreme accessibility */}
          <div className="flex items-center gap-2.5">
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
              className="p-2 border border-border rounded-xl bg-accent/15 hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-40 flex items-center justify-around px-2 h-16 pb-safe gap-1 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
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
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-250 outline-none ${
                isActive
                  ? (settings.theme === 'light' ? 'text-rose-650 font-black' : settings.theme === 'cyber' ? 'text-emerald-400 font-black' : settings.theme === 'slate' ? 'text-cyan-400 font-black' : 'text-[#818cf8] font-black')
                  : 'text-muted-foreground/80 hover:text-foreground font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                   layoutId="activeMobileTabPill"
                   className={`absolute inset-x-1.5 inset-y-1 rounded-2xl -z-0 ${
                     settings.theme === 'light' ? 'bg-rose-500/10' :
                     settings.theme === 'cyber' ? 'bg-emerald-500/10' :
                     settings.theme === 'slate' ? 'bg-cyan-500/10' :
                     'bg-indigo-500/10'
                   }`}
                   transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-4.5 h-4.5 z-10 shrink-0" />
              <span className="z-10 text-[8px] font-bold leading-none tracking-tight select-none">{tab.label}</span>
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

          {/* DEPRECATED INLINE DASHBOARD CODE GUARDED */}
          {false && (
            <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
              <motion.div
              variants={dashboardContainerVariants}
              initial="hidden"
              animate={activeTab === 'dashboard' ? "visible" : "hidden"}
              className="space-y-12 md:space-y-14"
            >
              <div className="space-y-12 md:space-y-14">
                
                {/* Dynamic header welcome banner now displayed ONLY inside dashboard workspace */}
                <motion.div 
                  variants={dashboardItemVariants}
                  className={`p-6 md:p-8 rounded-3xl bg-gradient-to-r ${themeStyles.bannerGradient} text-white shadow-lg space-y-3 relative overflow-hidden`}
                >
                  {/* Subtle logo background */}
                  <div className="absolute right-0 bottom-0 opacity-12 translate-x-12 translate-y-12 select-none pointer-events-none">
                    <BrandingLogo size={280} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-150 bg-white/10 px-2.5 py-1 rounded-full w-max">
                      JEE Preparation Companion • Pure & Focused Tracker
                    </span>
                    <h2 className="text-2xl md:text-3xl font-display font-black leading-tight tracking-tight">Focus. Track. Crack JEE.</h2>
                    <p className="text-xs text-indigo-100 max-w-xl font-medium leading-relaxed">
                      A comprehensive, elegant workspace to track study hours, practice questions, and chapter progress for JEE Main & Advanced.
                    </p>
                  </div>

                  {/* PCM Fast stats panel */}
                  <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-lg">
                    <div className="bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl text-center border border-white/5 shadow-sm relative group" title="Today's focused study minutes translated to hours (resets daily)">
                      <span className="block text-[9px] uppercase font-bold text-indigo-150">Study Hrs (Today)</span>
                      <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-white mt-1 block">
                        {(studyMinutesToday / 60).toFixed(1)}h
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl text-center border border-white/5 shadow-sm relative group" title="Today's total questions solved (resets daily)">
                      <span className="block text-[9px] uppercase font-bold text-indigo-150">Qs Solved (Today)</span>
                      <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-white mt-1 block">
                        {questionsSolvedToday}
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl text-center border border-white/5 shadow-sm">
                      <span className="block text-[9px] uppercase font-bold text-indigo-150">NCERT Done</span>
                      <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-white mt-1 block">
                        {syllabusStats.percentage}%
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl text-center border border-white/5 shadow-sm">
                      <span className="block text-[9px] uppercase font-bold text-indigo-150">Streak 🔥</span>
                      <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-white mt-1 block">
                        {streakStats.currentStreak}d
                      </span>
                    </div>
                  </div>
                </motion.div>                  

                {/* Subtle horizontal section divider */}
                <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

                {/* Central Study Timer */}
                <motion.div variants={dashboardItemVariants}>
                  <TimerSection 
                    settings={settings}
                    onSaveSession={handleSaveStudySession}
                    currentSessionsTodayCount={sessionsTodayCount}
                  />
                </motion.div>
                
                {/* Subtle horizontal section divider */}
                <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />
                
                {/* GAMIFIED STUDY STREAK COUNTER */}
                <motion.div 
                  variants={dashboardItemVariants}
                  className={`bg-card border border-border rounded-3xl p-6 shadow-sm ${themeStyles.cardBg} relative overflow-hidden dashboard-card-gpu`}
                >
                    
                    {/* Decorative ambient background glow */}
                    <div className="absolute -right-12 -top-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Left Block: Core Flame and Stats */}
                      <div className="flex items-center gap-4.5">
                        
                        {/* Roaring Hot Streak Badge Container */}
                        <div className={`relative shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 ${
                          streakStats.currentStreak > 0
                            ? 'bg-orange-500/15 border-orange-500/35 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.12)] scale-[1.01]'
                            : 'bg-accent/10 border-border text-muted-foreground/60'
                        }`}>
                          
                          {/* Pulsing visual halo for positive streaks */}
                          {streakStats.currentStreak > 0 && (
                            <span className="absolute inset-0.5 rounded-2xl bg-orange-500/20 animate-ping opacity-30 pointer-events-none" />
                          )}
                          
                          <Flame className={`w-8 h-8 ${streakStats.currentStreak > 0 ? 'animate-bounce' : ''}`} fill={streakStats.currentStreak > 0 ? 'currentColor' : 'none'} />
                          
                          {streakStats.currentStreak > 0 && (
                            <span className="absolute bottom-1 right-1 text-[8px] font-black font-mono bg-orange-500 text-white px-1 rounded-sm leading-none py-0.5 select-none">
                              LIT
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold font-display tracking-tight text-foreground">
                              {streakStats.currentStreak} Day Study Streak
                            </h3>
                            {streakStats.currentStreak > 0 && (
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full select-none">
                                Unstoppable Flame
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                            {streakStats.currentStreak > 0
                              ? `You have met your JEE Daily Study Goals for ${streakStats.currentStreak} consecutive days! Keep up this supreme momentum to crack it!`
                              : "Meet either your Daily study hours goal or questions target today to spark an active study streak!"}
                          </p>
                          
                          {/* Streak statistics secondary row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] font-mono font-medium text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-indigo-500" />
                              All-Time Peak-Streak: <strong className="text-foreground">{streakStats.maxStreak} days</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Today's Pulse: {streakStats.metToday ? (
                                <strong className="text-emerald-500">Sparked! 🔥</strong>
                              ) : streakStats.metYesterday ? (
                                <strong className="text-orange-400">Maintained (Needs study) ⏳</strong>
                              ) : (
                                <strong className="text-muted-foreground/80">Cold ❄️</strong>
                              )}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Right Block: Visual 7-Day Calendar Checklist */}
                      <div className="bg-accent/[0.03] dark:bg-white/[0.02] border border-border/85 rounded-2xl p-4 lg:w-[460px] shrink-0 w-full">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3 text-center lg:text-left select-none">
                          Past Weekly Fire Checklist
                        </span>
                        
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                          {streakStats.weeklyGrid.map((day) => {
                            return (
                              <div
                                key={day.dateStr}
                                className={`flex flex-col items-center gap-1.5 p-0.5 sm:p-1 rounded-xl transition-all duration-300 relative ${
                                  day.isToday 
                                    ? 'bg-indigo-500/5 border border-indigo-500/25' 
                                    : 'border border-transparent'
                                }`}
                              >
                                <span className={`text-[8px] sm:text-[9px] font-mono font-black ${
                                  day.isToday ? 'text-indigo-500' : 'text-muted-foreground/90'
                                }`}>
                                  {day.dayAbbrev}
                                </span>
                                
                                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-400 border cursor-default ${
                                  day.met
                                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white border-orange-500/40 shadow-xs'
                                    : day.activeAtAll
                                      ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                      : 'bg-card border-border/60 text-muted-foreground/35 hover:border-muted-foreground/30'
                                }`}
                                title={`${day.studyMins} mins studied, ${day.questionsSolved} questions solved`}>
                                  {day.met ? (
                                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-white animate-pulse" />
                                  ) : day.activeAtAll ? (
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                  ) : (
                                    <span className="text-[9px] sm:text-[10px] font-mono font-medium select-none">{day.dayNum}</span>
                                  )}
                                </div>
                                
                                {day.isToday && (
                                  <span className="text-[7px] sm:text-[8px] font-bold text-indigo-500 uppercase leading-none mt-0.5 tracking-wider select-none">
                                    Today
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </motion.div>

                  {/* Subtle horizontal section divider */}
                  <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

                  {/* TODAY'S GOALS PROGRESS BOARD */}
                  <motion.div 
                    variants={dashboardItemVariants}
                    className={`bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 ${themeStyles.cardBg}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
                      <div>
                        <h3 className="text-base font-bold font-display tracking-tight flex items-center gap-2">
                          <Award className="w-5 h-5 text-indigo-500 animate-pulse" /> Today's Aspiration Milestones
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Real-time tracking of achievements towards your custom daily JEE study targets</p>
                      </div>
                      
                      <button
                        onClick={() => handleTabChange('settings')}
                        className="text-[10px] sm:self-center uppercase font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer w-max self-start"
                      >
                        Adjust targets <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      {/* STUDY HOUR GOAL */}
                      <div className="flex flex-col sm:flex-row items-center gap-5 p-5.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 dark:bg-white/[0.02] dark:border-white/[0.05] hover:bg-slate-500/10 dark:hover:bg-white/[0.04] transition-all duration-300">
                        {/* Radial Ring Container */}
                        <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                          {/* Outer glow overlay */}
                          <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-md" />
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                            {/* Track Circle */}
                            <circle
                              cx="64"
                              cy="64"
                              r="50"
                              className="stroke-slate-200 dark:stroke-white/10 fill-transparent"
                              strokeWidth="8"
                            />
                            {/* Progress Circle */}
                            <motion.circle
                              cx="64"
                              cy="64"
                              r="50"
                              className="stroke-indigo-500 dark:stroke-indigo-400 fill-transparent"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray="314.16"
                              initial={{ strokeDashoffset: 314.16 }}
                              animate={{ strokeDashoffset: 314.16 - (Math.min(100, (studyMinutesToday / (settings.dailyStudyMinutesGoal ?? 180)) * 100) / 100) * 314.16 }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                          </svg>
                          {/* Inner percentage & details */}
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-black font-mono tracking-tight text-foreground">
                              {Math.min(100, Math.round((studyMinutesToday / (settings.dailyStudyMinutesGoal ?? 180)) * 100))}%
                            </span>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">
                              Studied
                            </span>
                          </div>
                        </div>

                        {/* Text and Details */}
                        <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500 shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-foreground">Focused Study Hours</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-medium block">
                              {(studyMinutesToday / 60).toFixed(1)}h of {((settings.dailyStudyMinutesGoal ?? 180) / 60).toFixed(1)}h target complete
                            </span>
                            <div className="text-[10px] text-muted-foreground/80 font-mono">
                              {studyMinutesToday} mins / {(settings.dailyStudyMinutesGoal ?? 180)} mins goal
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PROBLEMS SOLVED GOAL */}
                      <div className="flex flex-col sm:flex-row items-center gap-5 p-5.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 dark:bg-white/[0.02] dark:border-white/[0.05] hover:bg-slate-500/10 dark:hover:bg-white/[0.04] transition-all duration-300">
                        {/* Radial Ring Container */}
                        <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                          {/* Outer glow overlay */}
                          <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-md" />
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                            {/* Track Circle */}
                            <circle
                              cx="64"
                              cy="64"
                              r="50"
                              className="stroke-slate-200 dark:stroke-white/10 fill-transparent"
                              strokeWidth="8"
                            />
                            {/* Progress Circle */}
                            <motion.circle
                              cx="64"
                              cy="64"
                              r="50"
                              className="stroke-emerald-500 dark:stroke-emerald-400 fill-transparent"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray="314.16"
                              initial={{ strokeDashoffset: 314.16 }}
                              animate={{ strokeDashoffset: 314.16 - (Math.min(100, (questionsSolvedToday / (settings.dailyQuestionsSolvedGoal ?? 30)) * 100) / 100) * 314.16 }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                          </svg>
                          {/* Inner percentage & details */}
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-black font-mono tracking-tight text-foreground">
                              {Math.min(100, Math.round((questionsSolvedToday / (settings.dailyQuestionsSolvedGoal ?? 30)) * 100))}%
                            </span>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">
                              Solved
                            </span>
                          </div>
                        </div>

                        {/* Text and Details */}
                        <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-foreground">Daily Problem Solves</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-medium block">
                              {questionsSolvedToday} of {(settings.dailyQuestionsSolvedGoal ?? 30)} questions tracked
                            </span>
                            <div className="text-[10px] text-muted-foreground/80 font-mono">
                              {questionsSolvedToday} Qs / {(settings.dailyQuestionsSolvedGoal ?? 30)} Qs goal
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fun motivative dynamic notification */}
                    {(studyMinutesToday >= (settings.dailyStudyMinutesGoal ?? 180) && questionsSolvedToday >= (settings.dailyQuestionsSolvedGoal ?? 30)) ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                        <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />
                        <div className="text-xs text-emerald-400">
                          <span className="font-bold">Outstanding focus!</span> Both daily targets have been successfully surpassed today. Keep on tracking to build supreme momentum!
                        </div>
                      </div>
                    ) : (studyMinutesToday >= (settings.dailyStudyMinutesGoal ?? 180) || questionsSolvedToday >= (settings.dailyQuestionsSolvedGoal ?? 30)) ? (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                        <Coffee className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div className="text-xs text-indigo-300">
                          <span className="font-bold">Super progress!</span> You have completed one of your milestones today. Power through the remaining target to stay at peak consistency!
                        </div>
                      </div>
                    ) : null}
                  </motion.div>

                  {/* Subtle horizontal section divider */}
                  <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

                  {/* Fast Daily Quick Solves card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Solved ratios quick guide */}
                    <motion.div 
                      variants={dashboardItemVariants}
                      className="bg-card border border-border rounded-2xl p-6.5 space-y-4 dashboard-card-gpu"
                    >
                      <h4 className="text-sm font-bold font-display tracking-tight flex items-center gap-1.5 text-foreground">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Today's Focus Pulse
                      </h4>

                      <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                        <p>JEE success depends critically on daily problem cycles. Logging questions establishes fine grain muscle memory.</p>
                        <div className="space-y-2 font-medium">
                          <div className="flex justify-between border-b border-border/40 pb-1.5">
                            <span>Total Solved Questions:</span>
                            <span className="font-bold font-mono text-foreground">{questionAggregatess.normal} Qs</span>
                          </div>
                          <div className="flex justify-between border-b border-border/40 pb-1.5">
                            <span>Success PYQs Solved:</span>
                            <span className="font-bold font-mono text-emerald-500">{questionAggregatess.pyqs} Qs</span>
                          </div>
                          <div className="flex justify-between">
                            <span>NCERT Checklist status:</span>
                            <span className="font-bold text-indigo-500">
                              {Object.values(chapterCompletions).filter(Boolean).length} Done
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Study History Snapshot */}
                    <motion.div 
                      variants={dashboardItemVariants}
                      className="lg:col-span-2 bg-card border border-border rounded-2xl p-6.5 space-y-4 dashboard-card-gpu"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold font-display tracking-tight flex items-center gap-1.5 text-foreground">
                          <History className="w-4.5 h-4.5 text-indigo-500 animate-spin-slow" /> Recent Actions Study Log
                        </h4>
                        <button
                          onClick={() => handleTabChange('analytics')}
                          className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                        >
                          All Logs <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <WindowedStudyLog
                        sessions={sessions}
                        onDeleteSession={handleDeleteStudySession}
                        maxHeight="170px"
                        isAnalyticsVariant={false}
                      />
                    </motion.div>

                  </div>

                  {/* QUICK NOTES SECTION */}
                  <motion.div variants={dashboardItemVariants}>
                    <QuickNotes theme={settings.theme} cardBgClass={themeStyles.cardBg} />
                  </motion.div>

                  {/* DYNAMIC JEE LIVE TOOL LINKS & TELEGRAM GROUP */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    
                    {/* Telegram Community */}
                    <motion.div 
                      variants={dashboardItemVariants}
                      className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full w-max">Community Sync</span>
                        <h4 className="text-base font-bold font-sans tracking-tight">JEE CIRCLES Telegram</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Join other serious aspirants in our active JEE CIRCLES telegram group. Collaborate, solve, and get guides instantly.
                        </p>
                      </div>

                      <a
                        href="https://t.me/JEECIRCLES"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600 hover:text-white text-xs font-bold py-3 px-4 rounded-2xl text-center border border-indigo-500/20 flex items-center justify-center gap-1.5 transition-all outline-none"
                      >
                        Join JEE CIRCLES <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </motion.div>

                    {/* Exam Countdown timer link */}
                    <motion.div 
                      variants={dashboardItemVariants}
                      className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-max">Live Timer App</span>
                        <h4 className="text-base font-bold font-sans tracking-tight">JEE & NEET Exam Clock</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Track dynamic countdowns and remaining preparation slots visually using high quality exam timing portals.
                        </p>
                      </div>

                      <a
                        href="https://examclock-jee-neet-aspirants.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white text-xs font-bold py-3 px-4 rounded-2xl text-center border border-amber-500/20 flex items-center justify-center gap-1.5 transition-all outline-none"
                      >
                        Access Countdown Timer <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </motion.div>

                    {/* IIT JEE Guide link */}
                    <motion.div 
                      variants={dashboardItemVariants}
                      className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-max">Aspirant Guides</span>
                        <h4 className="text-base font-bold font-sans tracking-tight">The IIT JEE Guide Hub</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Access optimal subject prep schedules, NCERT solution methods, strategy breakdowns and pyq archives easily.
                        </p>
                      </div>

                      <a
                        href="https://iit-jee-guide.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white text-xs font-bold py-3 px-4 rounded-2xl text-center border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-all outline-none"
                      >
                        View JEE Guides <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </motion.div>

                  </div>

                </div>
            </motion.div>
          </div>
          )}

          {/* TAB 2: PROGRESS HISTORY & BAR CHARTS */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12 md:space-y-14"
            >
              <AnalyticsCharts sessions={sessions} questions={questions} errorItems={errorBook} />

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
            </motion.div>
          )}

          {/* TAB 3: QUESTIONS LOGGER */}
          {activeTab === 'questions' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuestionTrackerForm 
                questionsList={questions}
                onSaveQuestions={handleSaveQuestions}
              />
            </motion.div>
          )}

          {/* TAB 4: SYLLABUS TABS */}
          {activeTab === 'syllabus' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <SyllabusTracker 
                completions={chapterCompletions}
                onToggleChapter={handleToggleChapter}
                onClearAll={handleClearChapters}
              />
            </motion.div>
          )}

          {/* TAB 5: NOTES & ERROR BOOKS */}
          {activeTab === 'notes' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <NotesAndErrors 
                errorItems={errorBook}
                importanceItems={specialImportance}
                onAddErrorItem={handleAddErrorItem}
                onDeleteErrorItem={handleDeleteErrorItem}
                onAddImportanceItem={handleAddImportanceItem}
                onDeleteImportanceItem={handleDeleteImportanceItem}
              />
            </motion.div>
          )}

          {/* TAB 6: MOCK TEST TRACKER */}
          {activeTab === 'mock_tests' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <MockTestTracker 
                mockTests={mockTests}
                onAddTest={handleSaveMockTest}
                onDeleteTest={handleDeleteMockTest}
                theme={settings.theme}
                cardBgClass="bg-card/75 backdrop-blur-md"
              />
            </motion.div>
          )}

          {/* TAB 7: SETTINGS & APPEARANCES */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-10 md:space-y-12"
            >
              <div className="border-b border-border/60 pb-5">
                <h3 className="text-lg font-bold font-sans tracking-tight">Settings & Appearance</h3>
                <p className="text-xs text-muted-foreground">Customize your study targets, timer intervals, themes, and local datasets.</p>
              </div>

              <SettingsTab
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onResetAllData={handleResetAllData}
                showResetConfirm={showResetConfirm}
                setShowResetConfirm={setShowResetConfirm}
              />
            </motion.div>
          )}




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
