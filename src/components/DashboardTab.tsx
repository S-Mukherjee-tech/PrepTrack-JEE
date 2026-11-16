import React, { useMemo, memo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserSettings, StudySession, DailyQuestions } from '../types';
import { 
  BookOpen, 
  CheckCircle, 
  Sparkles, 
  Coffee, 
  TrendingUp, 
  History, 
  ArrowUpRight, 
  Flame, 
  Award,
  Target
} from 'lucide-react';
import { WindowedStudyLog } from './WindowedStudyLog';
import TargetTracker from './TargetTracker';
import TargetReminderModal from './TargetReminderModal';
import { BrandingLogo } from './BrandingLogo';
import TimerSection from './TimerSection';
import AnimatedCounter from './AnimatedCounter';
import ScrollReveal from './ScrollReveal';
import { CLASS_11_SYLLABUS, CLASS_12_SYLLABUS } from '../data/syllabus';
import { secureJsonParse, secureStorage } from '../utils/security';

interface DashboardTabProps {
  settings: UserSettings;
  sessions: StudySession[];
  questions: DailyQuestions[];
  chapterCompletions: Record<string, boolean>;
  themeStyles: {
    bg: string;
    container: string;
    headerBg: string;
    accentColor: string;
    borderStyle: string;
    cardBg: string;
    navActive: string;
    navInactive: string;
    bannerGradient: string;
    themeBrand: string;
  };
  onSaveStudySession: (session: StudySession) => Promise<void>;
  onDeleteStudySession: (id: string) => Promise<void>;
  onTabChange: (tab: 'dashboard' | 'analytics' | 'questions' | 'syllabus' | 'notes' | 'mock_tests' | 'settings') => void;
}

const BannerClock = memo(function BannerClock({ clockFormat = '12', timezone, isLight = false }: { clockFormat?: '12' | '24'; timezone?: string; isLight?: boolean }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(time);
      const hPart = parts.find(p => p.type === 'hour');
      const mPart = parts.find(p => p.type === 'minute');
      const sPart = parts.find(p => p.type === 'second');
      if (hPart) hours = parseInt(hPart.value, 10);
      if (mPart) minutes = parseInt(mPart.value, 10);
      if (sPart) seconds = parseInt(sPart.value, 10);
    } catch (e) {
      console.warn("Invalid timezone or failed to format: ", timezone, e);
    }
  }
  
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  let displayHours = hours;
  let ampm = '';

  if (clockFormat === '12') {
    ampm = hours >= 12 ? 'PM' : 'AM';
    displayHours = hours % 12;
    displayHours = displayHours ? displayHours : 12;
  }

  const formattedHours = clockFormat === '24' 
    ? (displayHours < 10 ? `0${displayHours}` : displayHours)
    : displayHours;

  return (
    <div id="banner-clock-widget" className="flex flex-col items-center sm:items-end select-none">
      <div className="flex items-baseline font-numeric">
        <span className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold font-numeric tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {formattedHours}
          <span className={`mx-0.5 transition-opacity duration-300 ${seconds % 2 === 0 ? (isLight ? 'opacity-100 text-indigo-600' : 'opacity-100 text-indigo-400') : 'opacity-30'}`}>:</span>
          {formattedMinutes}
        </span>
        {clockFormat === '12' ? (
          <span className={`text-[11px] font-bold font-sans tracking-widest ml-2 uppercase select-none self-start ${isLight ? 'text-indigo-700' : 'text-indigo-300/80'}`}>
            {ampm}
          </span>
        ) : (
          <span className={`text-[9px] font-bold font-sans tracking-wider ml-2 uppercase select-none self-start px-1.5 py-0.5 rounded-sm ${isLight ? 'text-indigo-700 bg-indigo-100 border border-indigo-200/80' : 'text-indigo-300/60 bg-white/10'}`}>
            24H
          </span>
        )}
      </div>
      <span className={`text-[10px] font-sans font-medium mt-1 hidden sm:block ${isLight ? 'text-slate-600' : 'text-slate-300/80'}`}>
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
});

const dashboardContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
  }
} as const;

const dashboardItemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.14,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
} as const;

const DashboardTab = memo(function DashboardTab({
  settings,
  sessions,
  questions,
  chapterCompletions,
  themeStyles,
  onSaveStudySession,
  onDeleteStudySession,
  onTabChange,
}: DashboardTabProps) {
  // Target tracker integration states
  const [activeTargetsCount, setActiveTargetsCount] = useState<number>(() => {
    try {
      const saved = secureStorage.getItem('preptrack_study_targets');
      if (saved) {
        const parsed = secureJsonParse<any[]>(saved, []);
        return parsed.filter((t) => !t.completed).length;
      }
    } catch {}
    return 0;
  });
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Trigger target reminder modal on first open in the session
  useEffect(() => {
    try {
      const hasShown = sessionStorage.getItem('preptrack_session_reminder_seen');
      if (!hasShown) {
        const timer = setTimeout(() => {
          setShowReminderModal(true);
          sessionStorage.setItem('preptrack_session_reminder_seen', 'true');
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Session reminder check failed:', e);
    }
  }, []);

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

    const dayRecords: Record<string, { studyMins: number; questionsSolved: number; met: boolean }> = {};

    sessions.forEach((s) => {
      const dKey = getLocalDateKey(new Date(s.startTime));
      if (!dayRecords[dKey]) {
        dayRecords[dKey] = { studyMins: 0, questionsSolved: 0, met: false };
      }
      dayRecords[dKey].studyMins += Math.floor(s.duration / 60);
    });

    questions.forEach((q) => {
      const dKey = q.date;
      if (!dayRecords[dKey]) {
        dayRecords[dKey] = { studyMins: 0, questionsSolved: 0, met: false };
      }
      const questionsCount = (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
      const pyqsCount = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                        (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                        (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
      dayRecords[dKey].questionsSolved += (questionsCount + pyqsCount);
    });

    Object.keys(dayRecords).forEach((dStr) => {
      const record = dayRecords[dStr];
      record.met = (record.studyMins >= studyGoalMins) || (record.questionsSolved >= questionGoalCount);
    });

    let currentStreak = 0;
    const today = new Date();
    const todayStr = getLocalDateKey(today);
    const metToday = dayRecords[todayStr]?.met || false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterday);
    const metYesterday = dayRecords[yesterdayStr]?.met || false;

    let traceDate = new Date();
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
          break;
        }
      }
    }

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

  const isLight = settings.theme === 'light';

  return (
    <motion.div
      variants={dashboardContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 md:space-y-14"
    >
      {/* Dynamic header welcome banner */}
      <motion.div 
        variants={dashboardItemVariants}
        className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${themeStyles.bannerGradient} ${
          isLight
            ? 'text-slate-900 shadow-[0_18px_42px_-12px_rgba(79,70,229,0.16)]'
            : 'text-white shadow-2xl border border-white/15'
        } relative overflow-hidden`}
      >
        {/* Subtle architectural dot matrix backdrop */}
        <div
          className={`absolute inset-0 pointer-events-none [background-size:16px_16px] ${
            isLight
              ? 'bg-[radial-gradient(rgba(79,70,229,0.09)_1px,transparent_1px)]'
              : 'bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]'
          }`}
        />
        
        {/* Watermark branding logo */}
        <div className={`absolute right-0 bottom-0 translate-x-10 translate-y-10 select-none pointer-events-none ${isLight ? 'opacity-[0.06]' : 'opacity-8'}`}>
          <BrandingLogo size={260} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                  isLight
                    ? 'bg-indigo-100/90 border-indigo-200/90'
                    : 'bg-white/[0.08] border-white/[0.12]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`}></span>
                <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${isLight ? 'text-indigo-800' : 'text-slate-200'}`}>
                  JEE Command Center
                </span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-display font-black leading-tight tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Focus. Consistency. Rank.
              </h2>
              <p className={`text-xs sm:text-sm max-w-xl font-normal leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Systematic daily tracking for JEE Main & Advanced: track deep study intervals, practice questions, and verify chapter mastery.
              </p>
            </div>

            {/* Focused Daily Metrics */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-xl">
              <div
                className={`interactive-card p-3.5 squircle-card-sm border cursor-default select-none group ${
                  isLight
                    ? 'bg-white/95 border-indigo-200/90 hover:border-indigo-400 shadow-sm hover:shadow-[0_12px_26px_-8px_rgba(79,70,229,0.25)]'
                    : 'glass-panel border-indigo-400/25 hover:border-indigo-400/75 hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.48),0_0_20px_rgba(129,140,248,0.28)]'
                }`}
                title="Today's focused study minutes"
              >
                <span className={`block text-[9px] uppercase font-numeric font-bold tracking-wider transition-colors ${isLight ? 'text-indigo-700' : 'text-indigo-300/90 group-hover:text-white'}`}>Study Time</span>
                <span className={`text-base sm:text-lg font-bold font-numeric tracking-tight mt-1 block tabular-nums ${isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_0_10px_rgba(129,140,248,0.35)]'}`}>
                  <AnimatedCounter value={studyMinutesToday / 60} decimals={1} />
                  <span className={`text-xs font-normal ml-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>hrs</span>
                </span>
              </div>

              <div
                className={`interactive-card p-3.5 squircle-card-sm border cursor-default select-none group ${
                  isLight
                    ? 'bg-white/95 border-emerald-200/90 hover:border-emerald-400 shadow-sm hover:shadow-[0_12px_26px_-8px_rgba(16,185,129,0.22)]'
                    : 'glass-panel border-emerald-400/25 hover:border-emerald-400/75 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.48),0_0_20px_rgba(52,211,153,0.28)]'
                }`}
                title="Today's total questions solved"
              >
                <span className={`block text-[9px] uppercase font-numeric font-bold tracking-wider transition-colors ${isLight ? 'text-emerald-700' : 'text-emerald-300/90 group-hover:text-white'}`}>Questions</span>
                <span className={`text-base sm:text-lg font-bold font-numeric tracking-tight mt-1 block tabular-nums ${isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]'}`}>
                  <AnimatedCounter value={questionsSolvedToday} />
                  <span className={`text-xs font-normal ml-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>solved</span>
                </span>
              </div>

              <div
                className={`interactive-card p-3.5 squircle-card-sm border cursor-default select-none group ${
                  isLight
                    ? 'bg-white/95 border-sky-200/90 hover:border-sky-400 shadow-sm hover:shadow-[0_12px_26px_-8px_rgba(14,165,233,0.22)]'
                    : 'glass-panel border-sky-400/25 hover:border-sky-400/75 hover:shadow-[0_12px_28px_-6px_rgba(56,189,248,0.48),0_0_20px_rgba(56,189,248,0.28)]'
                }`}
                title="JEE syllabus completed"
              >
                <span className={`block text-[9px] uppercase font-numeric font-bold tracking-wider transition-colors ${isLight ? 'text-sky-700' : 'text-sky-300/90 group-hover:text-white'}`}>Syllabus Mastery</span>
                <span className={`text-base sm:text-lg font-bold font-numeric tracking-tight mt-1 block tabular-nums ${isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]'}`}>
                  <AnimatedCounter value={syllabusStats.percentage} suffix="%" />
                </span>
              </div>

              <div
                className={`interactive-card p-3.5 squircle-card-sm border cursor-default select-none group ${
                  isLight
                    ? 'bg-white/95 border-amber-200/90 hover:border-amber-400 shadow-sm hover:shadow-[0_12px_26px_-8px_rgba(245,158,11,0.22)]'
                    : 'glass-panel border-amber-400/25 hover:border-amber-400/75 hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.48),0_0_20px_rgba(251,191,36,0.28)]'
                }`}
                title="Consecutive day study streak"
              >
                <span className={`block text-[9px] uppercase font-numeric font-bold tracking-wider transition-colors ${isLight ? 'text-amber-700' : 'text-amber-300/90 group-hover:text-white'}`}>Daily Streak</span>
                <span className={`text-base sm:text-lg font-bold font-numeric tracking-tight mt-1 flex items-center gap-1 tabular-nums ${isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]'}`}>
                  <AnimatedCounter value={streakStats.currentStreak} />
                  <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>days</span>
                  {streakStats.currentStreak > 0 && <span className="text-sm">🔥</span>}
                </span>
              </div>
            </div>

            {/* Prioritized Quick Targets Mission Trigger */}
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  const el = document.getElementById('target-tracker-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group ${
                  isLight
                    ? 'bg-white/95 hover:bg-indigo-50 border-indigo-200/90 hover:border-indigo-400 text-slate-900 shadow-sm'
                    : 'bg-white/[0.1] hover:bg-white/[0.18] border-white/25 hover:border-indigo-400/70 text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)]'
                }`}
                title="Jump directly to Target & Deadline Tracker"
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-indigo-600' : 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.85)]'}`} />
                <span className={`font-mono font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>🎯 Targets:</span>
                <span className={`font-numeric ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeTargetsCount} Active</span>
                <ArrowUpRight className={`w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${isLight ? 'text-indigo-600' : 'text-slate-300'}`} />
              </button>

              <button
                onClick={() => setShowReminderModal(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
                  isLight
                    ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]'
                    : 'bg-indigo-500/25 hover:bg-indigo-500/40 border-indigo-400/45 hover:border-indigo-300/75 text-indigo-100 shadow-[0_6px_20px_rgba(99,102,241,0.28)]'
                }`}
                title="View Daily Mission Briefing & Target Deadlines"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-100' : 'text-indigo-300 drop-shadow-[0_0_6px_rgba(165,180,252,0.8)]'}`} />
                <span>Mission Briefing</span>
              </button>
            </div>
          </div>

          {/* Clock Widget on the Right (Desktop / Tablet) */}
          <div className={`hidden lg:flex flex-col items-end justify-center shrink-0 pl-6 border-l ${isLight ? 'border-indigo-200/80' : 'border-white/10'}`}>
            <BannerClock clockFormat={settings.clockFormat} timezone={settings.timezone} isLight={isLight} />
          </div>
        </div>
      </motion.div>                  

      {/* Subtle horizontal section divider */}
      <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

      {/* Central Study Timer */}
      <motion.div variants={dashboardItemVariants}>
        <TimerSection 
          settings={settings}
          onSaveSession={onSaveStudySession}
          currentSessionsTodayCount={sessionsTodayCount}
        />
      </motion.div>
      
      {/* Subtle horizontal section divider */}
      <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

      {/* TARGET & DEADLINE MISSION CONTROL (PRIORITIZED TOP ELEVATION) */}
      <motion.div variants={dashboardItemVariants}>
        <TargetTracker 
          theme={settings.theme} 
          cardBgClass={themeStyles.cardBg}
          onTargetsCountChange={(active) => setActiveTargetsCount(active)}
        />
      </motion.div>
      
      {/* Subtle horizontal section divider */}
      <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />
      
      {/* GAMIFIED STUDY STREAK COUNTER */}
      <ScrollReveal delay={0.04}>
        <div 
          className={`bg-card border border-border rounded-2xl md:rounded-3xl p-6 md:p-7 shadow-sm ${themeStyles.cardBg} relative overflow-hidden dashboard-card-gpu hover:border-border/90 hover:shadow-md transition-all duration-200`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4.5">
              <div className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${
                streakStats.currentStreak > 0
                  ? 'bg-gradient-to-br from-amber-500/25 to-orange-500/25 border-orange-400/60 text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.35)]'
                  : 'bg-accent/10 border-border/70 text-muted-foreground/50'
              }`}>
                <Flame
                  className={`w-7 h-7 sm:w-8 sm:h-8 ${streakStats.currentStreak > 0 ? 'text-orange-400 animate-pulse drop-shadow-[0_0_10px_rgba(249,115,22,0.75)]' : 'text-muted-foreground/40'}`}
                  fill={streakStats.currentStreak > 0 ? 'currentColor' : 'none'}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-display tracking-tight text-foreground">
                    <AnimatedCounter value={streakStats.currentStreak} /> Day Study Streak
                  </h3>
                  {streakStats.currentStreak > 0 && (
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-orange-300 bg-orange-500/20 border border-orange-400/40 px-2 py-0.5 rounded-full select-none shadow-[0_0_12px_rgba(249,115,22,0.25)]">
                      Active Momentum
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  {streakStats.currentStreak > 0
                    ? `You have met your daily goals for ${streakStats.currentStreak} consecutive days. Consistency creates rank!`
                    : "Complete either your daily study hours target or question quota today to ignite your streak."}
                </p>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    Peak Streak: <strong className="text-foreground font-bold"><AnimatedCounter value={streakStats.maxStreak} /> days</strong>
                  </span>
                  <span>•</span>
                <span className="flex items-center gap-1">
                  Today's Status: {streakStats.metToday ? (
                    <strong className="text-emerald-400 font-bold">Goal Met 🔥</strong>
                  ) : streakStats.metYesterday ? (
                    <strong className="text-amber-400 font-bold">Streak Active (Needs study) ⏳</strong>
                  ) : (
                    <strong className="text-muted-foreground font-bold">Pending ❄️</strong>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Block: Visual 7-Day Calendar Checklist */}
          <div className="glass-panel rounded-xl p-3.5 lg:w-[440px] shrink-0 w-full">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground select-none">
                Past 7 Days History
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/80">
                {streakStats.weeklyGrid.filter(d => d.met).length}/7 Days Met
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {streakStats.weeklyGrid.map((day) => {
                return (
                  <div
                    key={day.dateStr}
                    className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all relative ${
                      day.isToday
                        ? 'bg-primary/15 border border-primary/45 shadow-[0_0_16px_-4px_var(--glow-color)]'
                        : 'border border-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`text-[8.5px] font-mono font-bold ${
                      day.isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {day.dayAbbrev}
                    </span>
                    
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border cursor-default select-none hover:scale-110 ${
                      day.met
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white border-orange-300/70 shadow-[0_0_16px_rgba(249,115,22,0.5)]'
                        : day.activeAtAll
                          ? 'bg-primary/20 text-primary border-primary/45 shadow-[0_0_12px_rgba(var(--glow-rgb,129,140,248),0.28)]'
                          : 'bg-card border-border/60 text-muted-foreground/50'
                    }`}
                    title={`${day.studyMins} mins studied, ${day.questionsSolved} questions solved`}>
                      {day.met ? (
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">{day.dayNum}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* Subtle horizontal section divider */}
      <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

      {/* STUDY PROGRESS AND PROBLEM SOLVED MILESTONES */}
      <ScrollReveal delay={0.04}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HOURS TARGETS */}
          <div className="interactive-card bg-card flex flex-col sm:flex-row items-center gap-5 p-5.5 rounded-2xl border border-indigo-500/25 hover:border-indigo-400/70 hover:shadow-[0_16px_36px_-8px_rgba(99,102,241,0.45),0_0_26px_rgba(129,140,248,0.28)] group">
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  className="stroke-slate-200 dark:stroke-white/10 fill-transparent"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="50"
                  className="stroke-indigo-500 dark:stroke-indigo-400 fill-transparent"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.72))' }}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="314.16"
                  initial={{ strokeDashoffset: 314.16 }}
                  animate={{ strokeDashoffset: 314.16 - (Math.min(100, (studyMinutesToday / (settings.dailyStudyMinutesGoal ?? 180)) * 100) / 100) * 314.16 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono tracking-tight text-foreground">
                  <AnimatedCounter value={Math.min(100, Math.round((studyMinutesToday / (settings.dailyStudyMinutesGoal ?? 180)) * 100))} suffix="%" />
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">
                  Studied
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="p-1.5 bg-indigo-500/15 border border-indigo-400/30 rounded-lg text-indigo-400 shrink-0 shadow-[0_0_12px_rgba(129,140,248,0.25)]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Focused Study Hours</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium block">
                  <AnimatedCounter value={studyMinutesToday / 60} decimals={1} suffix="h" /> of {((settings.dailyStudyMinutesGoal ?? 180) / 60).toFixed(1)}h target complete
                </span>
                <div className="text-[10px] text-muted-foreground/80 font-mono">
                  <AnimatedCounter value={studyMinutesToday} /> mins / {(settings.dailyStudyMinutesGoal ?? 180)} mins goal
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEMS SOLVED GOAL */}
          <div className="interactive-card bg-card flex flex-col sm:flex-row items-center gap-5 p-5.5 rounded-2xl border border-emerald-500/25 hover:border-emerald-400/70 hover:shadow-[0_16px_36px_-8px_rgba(16,185,129,0.45),0_0_26px_rgba(52,211,153,0.28)] group">
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  className="stroke-slate-200 dark:stroke-white/10 fill-transparent"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="50"
                  className="stroke-emerald-500 dark:stroke-emerald-400 fill-transparent"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.72))' }}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="314.16"
                  initial={{ strokeDashoffset: 314.16 }}
                  animate={{ strokeDashoffset: 314.16 - (Math.min(100, (questionsSolvedToday / (settings.dailyQuestionsSolvedGoal ?? 30)) * 100) / 100) * 314.16 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono tracking-tight text-foreground">
                  <AnimatedCounter value={Math.min(100, Math.round((questionsSolvedToday / (settings.dailyQuestionsSolvedGoal ?? 30)) * 100))} suffix="%" />
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">
                  Solved
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="p-1.5 bg-emerald-500/15 border border-emerald-400/30 rounded-lg text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Daily Problem Solves</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium block">
                  <AnimatedCounter value={questionsSolvedToday} /> of {(settings.dailyQuestionsSolvedGoal ?? 30)} questions tracked
                </span>
                <div className="text-[10px] text-muted-foreground/80 font-mono">
                  <AnimatedCounter value={questionsSolvedToday} /> Qs / {(settings.dailyQuestionsSolvedGoal ?? 30)} Qs goal
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

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

      {/* Subtle horizontal section divider */}
      <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

      {/* Fast Daily Quick Solves card */}
      <ScrollReveal delay={0.08}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Solved ratios quick guide */}
          <div 
            className="bg-card border border-border rounded-2xl p-6.5 space-y-4 dashboard-card-gpu hover:border-border/80 hover:shadow-md transition-all duration-200"
          >
            <h4 className="text-sm font-bold font-display tracking-tight flex items-center gap-1.5 text-foreground">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Today's Focus Pulse
            </h4>

            <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              <p>JEE success depends critically on daily problem cycles. Logging questions establishes fine grain muscle memory.</p>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span>Total Solved Questions:</span>
                  <span className="font-bold font-numeric text-foreground"><AnimatedCounter value={questionAggregatess.normal} /> Qs</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span>Success PYQs Solved:</span>
                  <span className="font-bold font-numeric text-emerald-500"><AnimatedCounter value={questionAggregatess.pyqs} /> Qs</span>
                </div>
                <div className="flex justify-between">
                  <span>NCERT Checklist status:</span>
                  <span className="font-bold text-indigo-500">
                    <AnimatedCounter value={Object.values(chapterCompletions).filter(Boolean).length} /> Done
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Study History Snapshot */}
          <div 
            className="lg:col-span-2 bg-card border border-border rounded-2xl p-6.5 space-y-4 dashboard-card-gpu hover:border-border/80 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold font-display tracking-tight flex items-center gap-1.5 text-foreground">
                <History className="w-4.5 h-4.5 text-indigo-500 animate-spin-slow" /> Recent Actions Study Log
              </h4>
              <button
                onClick={() => onTabChange('analytics')}
                className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-transform hover:translate-x-0.5 active:scale-95"
              >
                All Logs <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <WindowedStudyLog
              sessions={sessions}
              onDeleteSession={onDeleteStudySession}
              maxHeight="170px"
              isAnalyticsVariant={false}
            />
          </div>

        </div>
      </ScrollReveal>


      {/* DYNAMIC JEE LIVE TOOL LINKS & TELEGRAM GROUP */}
      <ScrollReveal delay={0.05}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          
          {/* Telegram Community */}
          <div
            className="bg-card interactive-card border border-border rounded-2xl p-5.5 shadow-sm flex flex-col justify-between hover:border-indigo-400/70 transition-all duration-200 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">
                  Community Sync
                </span>
              </div>
              <h4 className="text-base font-bold font-display tracking-tight text-foreground group-hover:text-indigo-300 transition-colors">
                JEE CIRCLES Telegram
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Join active JEE aspirants. Share doubts, discuss tough concepts, and collaborate with peers preparing for Main & Advanced.
              </p>
            </div>

            <a
              href="https://t.me/JEECIRCLES"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-mono font-semibold py-2.5 px-4 rounded-xl text-center border border-indigo-400/40 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center gap-1.5 transition-all duration-200 outline-none"
            >
              Join JEE CIRCLES <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Exam Countdown timer link */}
          <div
            className="bg-card interactive-card border border-border rounded-2xl p-5.5 shadow-sm flex flex-col justify-between hover:border-amber-400/70 transition-all duration-200 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                  Live Countdown
                </span>
              </div>
              <h4 className="text-base font-bold font-display tracking-tight text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                JEE & NEET Exam Clock
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Track live countdowns and remaining preparation hours to stay grounded and keep the exam dates front and center.
              </p>
            </div>

            <a
              href="https://examclock-jee-neet-aspirants.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 bg-amber-500/15 hover:bg-amber-600 text-amber-300 hover:text-white text-xs font-mono font-semibold py-2.5 px-4 rounded-xl text-center border border-amber-400/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center gap-1.5 transition-all duration-200 outline-none"
            >
              Open Exam Clock <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* IIT JEE Guide link */}
          <div
            className="bg-card interactive-card border border-border rounded-2xl p-5.5 shadow-sm flex flex-col justify-between hover:border-emerald-400/70 transition-all duration-200 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                  Strategy & Pyqs
                </span>
              </div>
              <h4 className="text-base font-bold font-display tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                IIT JEE Guide Hub
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Subject prep frameworks, chapter-wise weightage analysis, and curated problem strategies for Physics, Chem & Math.
              </p>
            </div>

            <a
              href="https://iit-jee-guide.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-mono font-semibold py-2.5 px-4 rounded-xl text-center border border-emerald-400/40 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-1.5 transition-all duration-200 outline-none"
            >
              View Study Guides <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

        </div>
      </ScrollReveal>

      {/* TARGET REMINDER POPUP MODAL (MISSION BRIEFING ON LAUNCH) */}
      <TargetReminderModal 
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onNavigateToTargets={() => {
          const el = document.getElementById('target-tracker-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        theme={settings.theme}
      />
    </motion.div>
  );
});

export default DashboardTab;
