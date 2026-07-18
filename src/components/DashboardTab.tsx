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
  Award 
} from 'lucide-react';
import { WindowedStudyLog } from './WindowedStudyLog';
import QuickNotes from './QuickNotes';
import { BrandingLogo } from './BrandingLogo';
import TimerSection from './TimerSection';
import { CLASS_11_SYLLABUS, CLASS_12_SYLLABUS } from '../data/syllabus';

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

const BannerClock = memo(function BannerClock({ clockFormat = '12', timezone }: { clockFormat?: '12' | '24'; timezone?: string }) {
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
      <div className="flex items-start font-sans drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
        <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
          {formattedHours}
          <span className={`mx-0.5 transition-opacity duration-500 ${seconds % 2 === 0 ? 'opacity-100' : 'opacity-35'}`}>:</span>
          {formattedMinutes}
        </span>
        {clockFormat === '12' ? (
          <span className="text-xs md:text-sm font-black tracking-wider text-indigo-200/90 ml-1.5 uppercase select-none pt-0.5">
            {ampm}
          </span>
        ) : (
          <span className="text-[10px] font-black tracking-widest text-indigo-200/70 ml-2 uppercase select-none pt-1">
            24H
          </span>
        )}
      </div>
    </div>
  );
});

const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

const dashboardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
      mass: 0.8
    }
  }
};

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

  return (
    <motion.div
      variants={dashboardContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 md:space-y-14 animate-fade-in"
    >
      {/* Dynamic header welcome banner */}
      <motion.div 
        variants={dashboardItemVariants}
        className={`p-6 md:p-8 rounded-3xl bg-gradient-to-r ${themeStyles.bannerGradient} text-white shadow-lg relative overflow-hidden`}
      >
        <div className="absolute right-0 bottom-0 opacity-12 translate-x-12 translate-y-12 select-none pointer-events-none">
          <BrandingLogo size={280} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
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
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-lg">
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
          </div>

          {/* Clock Widget on the Right (Tablet, Laptop, PC only - hidden on mobile) */}
          <div className="hidden sm:flex flex-col items-center sm:items-end justify-center shrink-0 pr-2 lg:pr-6 border-l border-white/10 sm:pl-6">
            <BannerClock clockFormat={settings.clockFormat} timezone={settings.timezone} />
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
      
      {/* GAMIFIED STUDY STREAK COUNTER */}
      <motion.div 
        variants={dashboardItemVariants}
        className={`bg-card border border-border rounded-3xl p-6 shadow-sm ${themeStyles.cardBg} relative overflow-hidden dashboard-card-gpu`}
      >
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4.5">
            <div className={`relative shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 ${
              streakStats.currentStreak > 0
                ? 'bg-orange-500/15 border-orange-500/35 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.12)] scale-[1.01]'
                : 'bg-accent/10 border-border text-muted-foreground/60'
            }`}>
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
                      ) : (
                        <span className="text-[10px] sm:text-xs font-black font-mono">{day.dayNum}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subtle horizontal section divider */}
      <div className={`border-t ${themeStyles.borderStyle} my-8 opacity-65`} />

      {/* STUDY PROGRESS AND PROBLEM SOLVED MILESTONES */}
      <motion.div 
        variants={dashboardItemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* HOURS TARGETS */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 dark:bg-white/[0.02] dark:border-white/[0.05] hover:bg-slate-500/10 dark:hover:bg-white/[0.04] transition-all duration-300">
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-md" />
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
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
                {Math.min(100, Math.round((studyMinutesToday / (settings.dailyStudyMinutesGoal ?? 180)) * 100))}%
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">
                Studied
              </span>
            </div>
          </div>

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
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-md" />
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
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
                {Math.min(100, Math.round((questionsSolvedToday / (settings.dailyQuestionsSolvedGoal ?? 30)) * 100))}%
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">
                Solved
              </span>
            </div>
          </div>

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
      </motion.div>

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
              onClick={() => onTabChange('analytics')}
              className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
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
    </motion.div>
  );
});

export default DashboardTab;
