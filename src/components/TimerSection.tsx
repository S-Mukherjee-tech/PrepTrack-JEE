import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudySession, StudyMode, UserSettings } from '../types';
import { Play, Pause, Square, RotateCcw, Timer, Award, Coffee, BookOpen, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { secureStorage } from '../utils/security';

interface TimerSectionProps {
  settings: UserSettings;
  onSaveSession: (session: StudySession) => void;
  currentSessionsTodayCount: number;
}

const TimerSection = memo(function TimerSection({ settings, onSaveSession, currentSessionsTodayCount }: TimerSectionProps) {
  const [mode, setMode] = useState<StudyMode>(() => {
    return (secureStorage.getItem('preptrack_timer_mode') as StudyMode) || 'normal';
  });
  const [sessionNameInput, setSessionNameInput] = useState(() => {
    const saved = secureStorage.getItem('preptrack_timer_nameInput') || '';
    if (saved.includes('U2FsdGVkX1')) {
      secureStorage.setItem('preptrack_timer_nameInput', '');
      return '';
    }
    return saved;
  });
  const [sessionSelected, setSessionSelected] = useState(() => {
    const saved = secureStorage.getItem('preptrack_timer_selected') || 'Session Auto';
    if (saved.includes('U2FsdGVkX1')) {
      secureStorage.setItem('preptrack_timer_selected', 'Session Auto');
      return 'Session Auto';
    }
    return saved;
  });
  const [isRunning, setIsRunning] = useState(() => {
    return secureStorage.getItem('preptrack_timer_isRunning') === 'true';
  });
  const [isPaused, setIsPaused] = useState(() => {
    return secureStorage.getItem('preptrack_timer_isPaused') === 'true';
  });
  const [timeElapsed, setTimeElapsed] = useState(() => {
    const savedTime = parseInt(secureStorage.getItem('preptrack_timer_timeElapsed') || '0', 10);
    const savedIsRunning = secureStorage.getItem('preptrack_timer_isRunning') === 'true';
    const savedIsPaused = secureStorage.getItem('preptrack_timer_isPaused') === 'true';
    const savedLastTS = parseInt(secureStorage.getItem('preptrack_timer_lastTS') || '0', 10);
    
    if (savedIsRunning && !savedIsPaused && savedLastTS > 0) {
      const deltaSec = Math.floor((Date.now() - savedLastTS) / 1000);
      return savedTime + deltaSec;
    }
    return savedTime;
  });
  
  // Pomodoro states
  const [pomodoroStage, setPomodoroStage] = useState<'work' | 'break'>(() => {
    return (secureStorage.getItem('preptrack_timer_pomodoroStage') as 'work' | 'break') || 'work';
  });
  
  // Audio & Notification Custom Configurations
  const [alarmSound, setAlarmSound] = useState<'chime' | 'beep' | 'zen'>('chime');
  const [isMuted, setIsMuted] = useState(false);
  const [minTimeNotice, setMinTimeNotice] = useState<string | null>(null);
  const [visualNotification, setVisualNotification] = useState<{
    type: 'work_done' | 'break_done' | 'test_done';
    title: string;
    message: string;
    duration: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(
    parseInt(secureStorage.getItem('preptrack_timer_startTimeRef') || '0', 10) || Date.now()
  );
  const totalPausedTimeRef = useRef<number>(
    parseInt(secureStorage.getItem('preptrack_timer_totalPausedTimeRef') || '0', 10) || 0
  );
  const pauseStartTimeRef = useRef<number>(
    parseInt(secureStorage.getItem('preptrack_timer_pauseStartTimeRef') || '0', 10) || 0
  );

  const segmentStartTimeRef = useRef<number>(Date.now());
  const baseTimeElapsedRef = useRef<number>(0);

  // Initialize refs on mount if already running
  useEffect(() => {
    if (isRunning && !isPaused) {
      segmentStartTimeRef.current = Date.now();
      baseTimeElapsedRef.current = timeElapsed;
    }
  }, []);

  // Ensure corrupt ciphertext legacy state is immediately cleared from UI
  useEffect(() => {
    if (sessionNameInput.includes('U2FsdGVkX1')) {
      setSessionNameInput('');
      secureStorage.setItem('preptrack_timer_nameInput', '');
    }
    if (sessionSelected.includes('U2FsdGVkX1')) {
      setSessionSelected('Session Auto');
      secureStorage.setItem('preptrack_timer_selected', 'Session Auto');
    }
  }, [sessionNameInput, sessionSelected]);

  const alarmSoundRef = useRef(alarmSound);
  const isMutedRef = useRef(isMuted);

  // Persistence to localstorage on every update reactive stream (Only for static settings/modes)
  useEffect(() => {
    secureStorage.setItem('preptrack_timer_mode', mode);
    secureStorage.setItem('preptrack_timer_nameInput', sessionNameInput);
    secureStorage.setItem('preptrack_timer_selected', sessionSelected);
    secureStorage.setItem('preptrack_timer_isRunning', isRunning.toString());
    secureStorage.setItem('preptrack_timer_isPaused', isPaused.toString());
    secureStorage.setItem('preptrack_timer_pomodoroStage', pomodoroStage);
    secureStorage.setItem('preptrack_timer_startTimeRef', sessionStartTimeRef.current.toString());
    secureStorage.setItem('preptrack_timer_totalPausedTimeRef', totalPausedTimeRef.current.toString());
    secureStorage.setItem('preptrack_timer_pauseStartTimeRef', pauseStartTimeRef.current.toString());
  }, [mode, sessionNameInput, sessionSelected, isRunning, isPaused, pomodoroStage]);

  // High-frequency persistence (timeElapsed and lastTS) separated to prevent redundant storage writes of static fields
  useEffect(() => {
    secureStorage.setItem('preptrack_timer_timeElapsed', timeElapsed.toString());
    secureStorage.setItem('preptrack_timer_lastTS', Date.now().toString());
  }, [timeElapsed]);

  // Screen Wake Lock API to prevent lockscreen sleep when stopwatch is ticking
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
          }
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Screen Wake Lock acquired successfully');
        } catch (err) {
          console.warn('Failed to acquire Screen Wake Lock:', err);
        }
      }
    }

    async function releaseWakeLock() {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log('Screen Wake Lock released');
        } catch (err) {
          console.warn('Failed to release Screen Wake Lock:', err);
        }
      }
    }

    if (isRunning && !isPaused) {
      requestWakeLock();
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isRunning && !isPaused) {
          requestWakeLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        releaseWakeLock();
      };
    } else {
      releaseWakeLock();
    }
  }, [isRunning, isPaused]);

  useEffect(() => {
    alarmSoundRef.current = alarmSound;
  }, [alarmSound]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Determine current total duration goal based on mode
  const currentDurationGoal = (): number => {
    if (mode === 'pomodoro') {
      const mins = pomodoroStage === 'work' 
        ? settings.pomodoroWorkDuration 
        : settings.pomodoroBreakDuration;
      return mins * 60;
    }
    if (mode === 'test') {
      return 3 * 3600; // 3 hours in seconds
    }
    return 0; // infinite
  };

  const currentDurationLeft = (): number => {
    if (mode === 'normal') return timeElapsed;
    const goal = currentDurationGoal();
    const left = goal - timeElapsed;
    return left < 0 ? 0 : left;
  };

  // Sound/alert synthesizer with multi-note fallback safely
  const playAudibleNotification = (type: 'work_done' | 'break_done' | 'test_done') => {
    if (isMutedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      
      const playNote = (freq: number, start: number, duration: number, volFactor = 0.4, oscType: OscillatorType = 'sine') => {
        const osc = context.createOscillator();
        const gainNode = context.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, start);
        
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(volFactor, start + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration - 0.04);
        
        osc.connect(gainNode);
        gainNode.connect(context.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const soundType = alarmSoundRef.current;
      if (soundType === 'chime') {
        if (type === 'work_done') {
          // Success chime: C5, E5, G5, C6
          const now = context.currentTime;
          playNote(523.25, now, 0.4, 0.25);
          playNote(659.25, now + 0.12, 0.4, 0.25);
          playNote(783.99, now + 0.24, 0.4, 0.25);
          playNote(1046.50, now + 0.36, 0.6, 0.35);
        } else if (type === 'break_done') {
          // Energizing chime G4, C5, E5
          const now = context.currentTime;
          playNote(392.00, now, 0.35, 0.25);
          playNote(523.25, now + 0.15, 0.35, 0.25);
          playNote(659.25, now + 0.3, 0.5, 0.35);
        } else {
          // Mock test complete harmony chime
          const now = context.currentTime;
          playNote(440.00, now, 0.5, 0.25);
          playNote(554.37, now + 0.2, 0.5, 0.25);
          playNote(659.25, now + 0.4, 0.8, 0.35);
        }
      } else if (soundType === 'beep') {
        const now = context.currentTime;
        const count = type === 'test_done' ? 4 : 3;
        for (let i = 0; i < count; i++) {
          playNote(type === 'break_done' ? 660 : 880, now + i * 0.22, 0.12, 0.25, 'sine');
        }
      } else {
        // Deep meditational zen gong pulse
        const now = context.currentTime;
        playNote(type === 'break_done' ? 220 : 165, now, 1.4, 0.5, 'triangle');
        playNote(type === 'break_done' ? 440 : 330, now + 0.04, 1.1, 0.15, 'sine');
      }
    } catch (e) {
      console.warn('Audio blocked by browser context posture:', e);
    }
  };

  // Poll & sync elapsed time from system clock to prevent background timer drift and ensure butter-smooth accuracy
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        const secondsPassed = Math.floor((Date.now() - segmentStartTimeRef.current) / 1000);
        const exactElapsed = baseTimeElapsedRef.current + secondsPassed;
        setTimeElapsed(exactElapsed);
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  // Monitor session goal completion side effects in a dedicated, StrictMode-safe useEffect
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const goal = currentDurationGoal();
    if (goal > 0 && timeElapsed >= goal) {
      if (mode === 'pomodoro') {
        if (pomodoroStage === 'work') {
          playAudibleNotification('work_done');
          setVisualNotification({
            type: 'work_done',
            title: '🎯 Work Block Complete!',
            message: `Splendid! You have finished your dedicated ${settings.pomodoroWorkDuration}-minute study milestone. It is now time for a refreshing rest break.`,
            duration: goal
          });
          setPomodoroStage('break');
          saveSession(goal, true);
          setTimeElapsed(0);
          baseTimeElapsedRef.current = 0;
          segmentStartTimeRef.current = Date.now();
        } else {
          playAudibleNotification('break_done');
          setVisualNotification({
            type: 'break_done',
            title: '💪 Break Completed! Back to Study',
            message: `Your rest period is over. Let's start the next Pomodoro interval with fresh focus and energy!`,
            duration: goal
          });
          setPomodoroStage('work');
          setTimeElapsed(0);
          baseTimeElapsedRef.current = 0;
          setIsRunning(false);
        }
      } else if (mode === 'test') {
        playAudibleNotification('test_done');
        setVisualNotification({
          type: 'test_done',
          title: '🛑 Examination Countdown Expired!',
          message: `The 3-hour mock block has concluded. Your study data has been successfully saved to your historical logs.`,
          duration: goal
        });
        saveSession(goal, false);
        setTimeElapsed(0);
        baseTimeElapsedRef.current = 0;
        setIsRunning(false);
      }
    }
  }, [timeElapsed, isRunning, isPaused, mode, pomodoroStage, settings]);

  const handleStart = () => {
    if (!isRunning) {
      sessionStartTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      setTimeElapsed(0);
      baseTimeElapsedRef.current = 0;
      segmentStartTimeRef.current = Date.now();
      setIsRunning(true);
      setIsPaused(false);
    } else if (isPaused) {
      const pausedDuration = Math.floor((Date.now() - pauseStartTimeRef.current) / 1000);
      totalPausedTimeRef.current += pausedDuration;
      baseTimeElapsedRef.current = timeElapsed;
      segmentStartTimeRef.current = Date.now();
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    pauseStartTimeRef.current = Date.now();
    baseTimeElapsedRef.current = timeElapsed;
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to discard the active timer session?')) {
      setIsRunning(false);
      setIsPaused(false);
      setTimeElapsed(0);
      baseTimeElapsedRef.current = 0;
      setPomodoroStage('work');
    }
  };

  const saveSession = (durationToSave: number, isPomodoroBreakAuto: boolean) => {
    const startTm = sessionStartTimeRef.current || (Date.now() - durationToSave * 1000);
    const endTm = Date.now();
    
    let resolvedName = '';
    if (sessionNameInput.trim()) {
      resolvedName = sessionNameInput.trim();
    } else if (sessionSelected === 'Session Auto') {
      resolvedName = `Session ${currentSessionsTodayCount + 1}`;
    } else {
      resolvedName = sessionSelected;
    }

    if (mode === 'pomodoro') {
      resolvedName = `${resolvedName} (Pomodoro ${isPomodoroBreakAuto ? 'Work' : 'Break'})`;
    } else if (mode === 'test') {
      resolvedName = `${resolvedName} (JEE Test Block)`;
    }

    const sessionRecord: StudySession = {
      id: `session_${Date.now()}_` + Math.floor(Math.random() * 1000),
      startTime: startTm,
      endTime: endTm,
      duration: durationToSave,
      sessionName: resolvedName,
      mode: mode,
    };

    onSaveSession(sessionRecord);
  };

  const handleStopAndSave = () => {
    if (timeElapsed < 5) {
      setMinTimeNotice('Keep studying! Log study sessions of at least 5 seconds.');
      setTimeout(() => setMinTimeNotice(null), 3500);
      return;
    }
    setMinTimeNotice(null);

    const durationToSave = timeElapsed;
    saveSession(durationToSave, false);
    setIsRunning(false);
    setIsPaused(false);
    setTimeElapsed(0);
    baseTimeElapsedRef.current = 0;
  };

  // Time conversion
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      hoursStr: hrs.toString().padStart(2, '0'),
      minutesStr: mins.toString().padStart(2, '0'),
      secondsStr: secs.toString().padStart(2, '0'),
    };
  };

  const { hoursStr, minutesStr, secondsStr } = formatTime(currentDurationLeft());

  // SVG Math values for circular dial representation
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const ratio = useMemo(() => {
    const goal = currentDurationGoal();
    if (goal === 0) return 0.75; // aesthetic fraction for normal running study blocks
    return Math.min(1, timeElapsed / goal);
  }, [timeElapsed, mode, pomodoroStage, settings]);
  const strokeDashoffset = circumference - ratio * circumference;

  const isThemeCyber = settings.theme === 'cyber';
  const isThemeLight = settings.theme === 'light';
  const isThemeSlate = settings.theme === 'slate';

  const timerGlowColor =
    isThemeCyber ? 'rgba(16,185,129,0.52)' :
    isThemeLight ? 'rgba(79,70,229,0.28)' :
    isThemeSlate ? 'rgba(6,182,212,0.52)' :
    'rgba(129,140,248,0.52)';

  const dialGlowRgb =
    isThemeCyber ? '16, 185, 129' :
    isThemeLight ? '79, 70, 229' :
    isThemeSlate ? '6, 182, 212' :
    '129, 140, 248';

  const accentTextClass =
    isThemeCyber ? 'text-emerald-400' :
    isThemeLight ? 'text-indigo-600' :
    isThemeSlate ? 'text-cyan-400' :
    'text-indigo-400';

  const badgeThemeClass =
    isThemeCyber ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_14px_rgba(16,185,129,0.28)]' :
    isThemeLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-[0_0_12px_rgba(79,70,229,0.14)]' :
    isThemeSlate ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_14px_rgba(6,182,212,0.28)]' :
    'bg-indigo-500/15 text-indigo-300 border border-indigo-400/40 shadow-[0_0_14px_rgba(129,140,248,0.28)]';

  return (
    <motion.div
      animate={isRunning && !isPaused ? {
        boxShadow: isThemeCyber ? [
          "0 12px 34px -10px rgba(16,185,129,0.28), 0 0 24px -4px rgba(16,185,129,0.24)",
          "0 18px 46px 2px rgba(16,185,129,0.48), 0 0 36px 2px rgba(16,185,129,0.38)",
          "0 12px 34px -10px rgba(16,185,129,0.28), 0 0 24px -4px rgba(16,185,129,0.24)"
        ] : isThemeLight ? [
          "0 12px 34px -10px rgba(79,70,229,0.18), 0 0 20px -4px rgba(79,70,229,0.18)",
          "0 18px 44px 2px rgba(79,70,229,0.32), 0 0 32px 2px rgba(79,70,229,0.28)",
          "0 12px 34px -10px rgba(79,70,229,0.18), 0 0 20px -4px rgba(79,70,229,0.18)"
        ] : isThemeSlate ? [
          "0 12px 34px -10px rgba(6,182,212,0.28), 0 0 24px -4px rgba(6,182,212,0.24)",
          "0 18px 46px 2px rgba(6,182,212,0.48), 0 0 36px 2px rgba(6,182,212,0.38)",
          "0 12px 34px -10px rgba(6,182,212,0.28), 0 0 24px -4px rgba(6,182,212,0.24)"
        ] : [
          "0 12px 34px -10px rgba(129,140,248,0.28), 0 0 24px -4px rgba(129,140,248,0.24)",
          "0 18px 46px 2px rgba(129,140,248,0.48), 0 0 36px 2px rgba(129,140,248,0.38)",
          "0 12px 34px -10px rgba(129,140,248,0.28), 0 0 24px -4px rgba(129,140,248,0.24)"
        ]
      } : {}}
      transition={{
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut"
      }}
      id="study-timer-container"
      className="bg-card border border-border squircle-card p-6 lg:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden dashboard-card-gpu glass-panel group/timer"
    >
      {/* Pre-diffused Ambient Corner Bloom (zero CSS filter blur cost) */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-80 group-hover/timer:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, rgba(${dialGlowRgb}, 0.22) 0%, rgba(${dialGlowRgb}, 0.06) 45%, transparent 72%)`
        }}
      />

      {/* Circle visual progress & displays */}
      <div className="relative flex flex-col items-center justify-center shrink-0">
        {/* Always-present radial dial aura — serene glow when prepared, breathing bloom when active */}
        <div
          aria-hidden="true"
          className={`absolute -inset-6 rounded-full pointer-events-none z-0 transition-opacity duration-300 ${
            isRunning && !isPaused ? 'opacity-100 animate-pulse' : 'opacity-65 group-hover/timer:opacity-95'
          }`}
          style={{
            background: `radial-gradient(circle, ${timerGlowColor} 0%, rgba(${dialGlowRgb}, 0.16) 44%, transparent 72%)`
          }}
        />

        {/* Animated circular gauge block styled with exquisite detail */}
        <div className="w-56 h-56 rounded-full flex flex-col items-center justify-center relative z-10">
          {/* SVG circle track loader under the core text */}
          <svg className="absolute inset-x-0 inset-y-0 w-full h-full transform -rotate-90 pointer-events-none overflow-visible" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  isThemeCyber ? '#10b981' :
                  isThemeLight ? '#4f46e5' :
                  isThemeSlate ? '#06b6d4' :
                  '#6366f1'
                } />
                <stop offset="50%" stopColor={
                  isThemeCyber ? '#2dd4bf' :
                  isThemeLight ? '#6366f1' :
                  isThemeSlate ? '#38bdf8' :
                  '#8b5cf6'
                } />
                <stop offset="100%" stopColor={
                  isThemeCyber ? '#34d399' :
                  isThemeLight ? '#0ea5e9' :
                  isThemeSlate ? '#818cf8' :
                  '#a855f7'
                } />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="currentColor"
              strokeWidth="4.5"
              className={isThemeLight ? 'text-indigo-200/60' : 'text-white/10'}
              fill="transparent"
            />
            {/* Real progression stroke indicator with crisp neon bloom */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#timerGrad)"
              strokeWidth={isRunning ? 5.5 : 4.5}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={mode === 'normal' ? (isRunning ? (isPaused ? circumference * 0.5 : 0) : circumference * 0.25) : strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 7px rgba(${dialGlowRgb}, ${isRunning && !isPaused ? 0.85 : 0.55}))`,
              }}
              className={`transition-all duration-300 ease-out ${isRunning && !isPaused && mode === 'normal' ? 'animate-[spin_24s_linear_infinite] origin-center' : ''}`}
              fill="transparent"
            />
            {/* Fine rotating dashed radar ring - provides a precision instrument vibe */}
            <circle
              cx="110"
              cy="110"
              r={radius + 9}
              stroke={`rgba(${dialGlowRgb}, ${isRunning && !isPaused ? 0.55 : 0.34})`}
              strokeWidth="1.25"
              strokeDasharray="3, 10"
              className={`transition-all duration-300 ${
                isRunning && !isPaused ? 'animate-[spin_40s_linear_infinite] origin-center' : ''
              }`}
              fill="transparent"
            />
          </svg>

          {/* Core glass ring overlay with luminous inner shadow */}
          <div
            className={`absolute w-[180px] h-[180px] rounded-full border-2 flex flex-col items-center justify-center z-10 transition-all duration-300 ${
              isRunning && !isPaused
                ? isThemeCyber ? 'border-emerald-400/75 bg-slate-950/90' :
                  isThemeLight ? 'border-indigo-500/80 bg-white/95' :
                  isThemeSlate ? 'border-cyan-400/75 bg-slate-950/90' :
                  'border-indigo-400/75 bg-slate-950/90'
                : isThemeCyber ? 'border-emerald-400/40 bg-slate-950/88' :
                  isThemeLight ? 'border-indigo-300/80 bg-white/95' :
                  isThemeSlate ? 'border-cyan-400/45 bg-slate-950/88' :
                  'border-indigo-400/45 bg-slate-950/88'
            }`}
            style={{
              boxShadow: isRunning && !isPaused
                ? `inset 0 0 30px rgba(${dialGlowRgb}, 0.38), 0 0 34px rgba(${dialGlowRgb}, 0.38)`
                : `inset 0 0 24px rgba(${dialGlowRgb}, 0.2), 0 0 22px rgba(${dialGlowRgb}, 0.2)`,
            }}
          >
            <span className={`text-[9px] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1 px-2.5 py-0.5 rounded-full ${badgeThemeClass}`}>
              {mode === 'normal' && <Timer className="w-3 h-3" />}
              {mode === 'pomodoro' && (pomodoroStage === 'work' ? <Award className="w-3 h-3 animate-bounce" /> : <Coffee className="w-3 h-3" />)}
              {mode === 'test' && <BookOpen className="w-3 h-3" />}
              {mode === 'normal' && 'Normal Study'}
              {mode === 'pomodoro' && `Pomodoro: ${pomodoroStage}`}
              {mode === 'test' && '3HR JEE TEST'}
            </span>

            {/* Timer String digits - jitter free tabular formatting with crisp glow */}
            <div
              className="font-numeric text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex gap-0.5 items-center my-1.5 transition-colors select-none"
              style={{
                textShadow: isThemeLight
                  ? `0 2px 10px rgba(${dialGlowRgb}, 0.16)`
                  : `0 0 18px rgba(${dialGlowRgb}, 0.32)`,
              }}
            >
              <span className="tabular-nums">{hoursStr}</span>
              <span className={`transition-colors duration-300 ${
                isRunning && !isPaused
                  ? `${accentTextClass} animate-pulse`
                  : accentTextClass
              }`}>:</span>
              <span className="tabular-nums">{minutesStr}</span>
              <span className={`transition-colors duration-300 ${
                isRunning && !isPaused
                  ? `${accentTextClass} animate-pulse`
                  : accentTextClass
              }`}>:</span>
              <span className="tabular-nums">{secondsStr}</span>
            </div>

            <p className={`text-[9.5px] font-semibold tracking-wide ${
              isRunning && !isPaused ? accentTextClass : 'text-muted-foreground'
            }`}>
              {isRunning ? (isPaused ? 'Paused' : 'Active Study Session') : 'Prepared & Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Control panel and customization options */}
      <div className="flex-1 w-full space-y-5 relative z-10">
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl glass-panel">
          {(['normal', 'pomodoro', 'test'] as StudyMode[]).map((m) => {
            const isActiveMode = mode === m;
            return (
              <motion.button
                key={m}
                disabled={isRunning}
                whileHover={isRunning ? undefined : { y: -1.5 }}
                whileTap={isRunning ? undefined : { scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                onClick={() => {
                  setMode(m);
                  setTimeElapsed(0);
                  setPomodoroStage('work');
                }}
                className={`py-3 px-3 squircle-card-sm text-xs font-bold capitalize border cursor-pointer flex flex-col items-center gap-1 relative select-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActiveMode
                    ? 'border-transparent text-white'
                    : isThemeLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/90 hover:border-indigo-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]'
                }`}
              >
                {isActiveMode && (
                  <motion.div
                    layoutId="timerModePill"
                    transition={{ type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }}
                    className={`absolute inset-0 squircle-card-sm -z-0 ${
                      isThemeCyber ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      isThemeLight ? 'bg-gradient-to-r from-indigo-600 to-violet-600' :
                      isThemeSlate ? 'bg-gradient-to-r from-cyan-500 to-sky-500' :
                      'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{
                      boxShadow: `0 6px 20px -2px rgba(${dialGlowRgb}, 0.55), 0 0 18px 0 rgba(${dialGlowRgb}, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)`
                    }}
                  />
                )}
                <span className="font-sans relative z-10">
                  {m === 'normal' && 'Normal Study'}
                  {m === 'pomodoro' && 'Pomodoro'}
                  {m === 'test' && 'JEE Test (3h)'}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Audible notification options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2.5 flex-wrap">
            <label htmlFor="alarm-sound-select" className={`text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${isThemeLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Volume2 className={`w-4 h-4 ${accentTextClass}`} style={{ filter: `drop-shadow(0 0 6px rgba(${dialGlowRgb}, 0.6))` }} />
              Pomodoro Alert:
            </label>
            <select
              id="alarm-sound-select"
              value={alarmSound}
              onChange={(e) => setAlarmSound(e.target.value as any)}
              className="border text-[11px] rounded-lg px-2.5 py-1.5 outline-none font-bold text-foreground cursor-pointer transition-all"
            >
              <option value="chime">Chime Synthesizer</option>
              <option value="beep">Precision Beep</option>
              <option value="zen">Harmonic Resonance</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMuted
                  ? isThemeLight
                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                    : 'bg-rose-500/15 border-rose-400/40 text-rose-400 hover:bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                  : isThemeLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_14px_rgba(16,185,129,0.24)]'
              }`}
              title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
            <button
              onClick={() => playAudibleNotification('work_done')}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                isThemeLight
                  ? 'border-slate-300 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 hover:border-indigo-300'
                  : 'border-white/15 bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white'
              }`}
            >
              Test Alert
            </button>
          </div>
        </div>

        {/* Configurations for Active Session labels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="session-block-select" className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Session Block</label>
            <select
              id="session-block-select"
              disabled={isRunning}
              value={sessionSelected}
              onChange={(e) => setSessionSelected(e.target.value)}
              className="w-full text-xs rounded-xl px-3.5 py-2.5 font-medium outline-none transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="Session Auto">Session Auto (Session {currentSessionsTodayCount + 1})</option>
              <option value="Session 1">Session 1</option>
              <option value="Session 2">Session 2</option>
              <option value="Session 3">Session 3</option>
              <option value="Morning Session">Morning Blocks</option>
              <option value="Afternoon Session">Afternoon Blocks</option>
              <option value="Evening Revision">Evening Revision</option>
              <option value="Late Night Drive">Late Night Blocks</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Or Tag custom topic/name</label>
            <input
              type="text"
              placeholder="e.g. Chemical Bonding basics"
              disabled={isRunning}
              value={sessionNameInput}
              onChange={(e) => setSessionNameInput(e.target.value)}
              className="w-full text-xs rounded-xl px-3.5 py-2.5 font-medium placeholder:text-muted-foreground/55 outline-none transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Minimum time notice */}
        {minTimeNotice && (
          <div className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold text-center animate-fade-in shadow-[0_0_16px_rgba(245,158,11,0.2)]">
            {minTimeNotice}
          </div>
        )}

        {/* Timer Control CTA Buttons */}
        <div className="pt-2 flex flex-wrap gap-3">
          {!isRunning ? (
            <motion.button
              whileHover={{ scale: 1.018, y: -2 }}
              whileTap={{ scale: 0.96 }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                scale: { type: 'spring', stiffness: 460, damping: 24 },
                y: { type: 'spring', stiffness: 460, damping: 24 },
                backgroundPosition: { duration: 5, repeat: Infinity, ease: 'linear' },
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
              onClick={handleStart}
              className={`cta-radiant flex-1 min-w-[140px] font-extrabold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer text-white select-none ${
                isThemeCyber ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600' :
                isThemeLight ? 'bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-500' :
                isThemeSlate ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500' :
                'bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500'
              }`}
            >
              <Play className="w-4.5 h-4.5 fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.65)]" />
              <span className="tracking-tight">Start Focused Study</span>
            </motion.button>
          ) : (
            <>
              {isPaused ? (
                <motion.button
                  whileHover={{ scale: 1.018, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 24 }}
                  style={{
                    backgroundSize: "200% 200%",
                  }}
                  onClick={handleStart}
                  className={`cta-radiant flex-1 font-extrabold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-white ${
                    isThemeCyber ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600' :
                    isThemeLight ? 'bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-500' :
                    isThemeSlate ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500' :
                    'bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500'
                  }`}
                >
                  <Play className="w-4.5 h-4.5 fill-current" /> Resume Study
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1.5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 24 }}
                  onClick={handlePause}
                  className={`flex-1 font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-[0_8px_24px_rgba(245,158,11,0.22)] ${
                    isThemeLight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/45'
                  }`}
                >
                  <Pause className="w-4.5 h-4.5 fill-current" /> Pause Block
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02, y: -1.5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 460, damping: 24 }}
                onClick={handleStopAndSave}
                className={`font-bold text-sm py-4 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                  isThemeCyber ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/45 shadow-[0_8px_24px_rgba(16,185,129,0.22)]' :
                  isThemeLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' :
                  isThemeSlate ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/45 shadow-[0_8px_24px_rgba(6,182,212,0.22)]' :
                  'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-400/45 shadow-[0_8px_24px_rgba(129,140,248,0.22)]'
                }`}
                title="Stop and save session to local history Log"
              >
                <Square className="w-4.5 h-4.5 fill-current" /> Save Session
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08, rotate: -45 }}
                whileTap={{ scale: 0.90 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={handleReset}
                className={`border font-bold text-xs py-4 px-4 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isThemeLight
                    ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                    : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.14] text-muted-foreground hover:text-foreground'
                }`}
                title="Discard study session"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>

        {/* Interactive guidelines helpful hint */}
        <div className="text-[11px] text-muted-foreground flex gap-1.5 items-start mt-2">
          <AlertCircle className={`w-4 h-4 shrink-0 ${accentTextClass}`} />
          <span>
            {mode === 'pomodoro' && `Pomodoro will automatically cycle: ${settings.pomodoroWorkDuration} mins of focal work followed by ${settings.pomodoroBreakDuration} mins break.`}
            {mode === 'test' && 'JEE Test block mimics the actual 3-Hour examination countdown with secure automatic savings on timer expiration.'}
            {mode === 'normal' && 'Normal Study operates as an elegant stopwatch. Track hours, minutes, and seconds, then save to analyze in progress history charts.'}
          </span>
        </div>
      </div>

      {/* Visual notification glass overlay */}
      <AnimatePresence>
        {visualNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md ${
              settings.theme === 'glass' ? 'bg-[#0f0c1b]/95' :
              settings.theme === 'cyber' ? 'bg-[#030e0a]/95' :
              settings.theme === 'light' ? 'bg-white/95' : 'bg-[#0f172a]/95'
            }`}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md space-y-4 p-5 rounded-3xl border border-border bg-card shadow-xl"
            >
              <div className="flex justify-center">
                <div className={`p-4 rounded-full ${
                  visualNotification.type === 'work_done' ? 'bg-emerald-500/15 text-emerald-400' :
                  visualNotification.type === 'break_done' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-rose-500/15 text-rose-400'
                } animate-bounce`}>
                  {visualNotification.type === 'work_done' && <Award className="w-7 h-7" />}
                  {visualNotification.type === 'break_done' && <Coffee className="w-7 h-7" />}
                  {visualNotification.type === 'test_done' && <BookOpen className="w-7 h-7" />}
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold font-display tracking-tight text-foreground">
                  {visualNotification.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {visualNotification.message}
                </p>
              </div>

              {visualNotification.type === 'work_done' && (
                <div className="border border-border/80 rounded-xl px-3 py-2 bg-accent/15 inline-block mx-auto text-[10px] font-sans text-muted-foreground">
                  📊 Automatically saved <span className="font-bold text-foreground font-numeric">{settings.pomodoroWorkDuration} mins</span> session to history logs.
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                {visualNotification.type === 'work_done' ? (
                  <button
                    onClick={() => {
                      setVisualNotification(null);
                      // Start break
                      setIsRunning(true);
                      setIsPaused(false);
                      setTimeElapsed(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer hover:brightness-110 shadow-lg ${
                      settings.theme === 'cyber' ? 'bg-emerald-600 shadow-emerald-500/15' : 'bg-indigo-600 shadow-indigo-500/15'
                    }`}
                  >
                    Start Break Interval ({settings.pomodoroBreakDuration}m) ☕
                  </button>
                ) : null}

                <button
                  onClick={() => setVisualNotification(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-accent/25 hover:bg-accent/40 border border-border text-foreground transition-all cursor-pointer"
                >
                  {visualNotification.type === 'work_done' ? 'Close & Review' : 'Awesome, Let\'s Go!'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default TimerSection;
