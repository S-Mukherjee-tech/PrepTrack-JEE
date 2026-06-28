import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudySession, StudyMode, UserSettings } from '../types';
import { Play, Pause, Square, RotateCcw, Timer, Award, Coffee, BookOpen, AlertCircle, Volume2, VolumeX } from 'lucide-react';

interface TimerSectionProps {
  settings: UserSettings;
  onSaveSession: (session: StudySession) => void;
  currentSessionsTodayCount: number;
}

export default function TimerSection({ settings, onSaveSession, currentSessionsTodayCount }: TimerSectionProps) {
  const [mode, setMode] = useState<StudyMode>(() => {
    return (localStorage.getItem('preptrack_timer_mode') as StudyMode) || 'normal';
  });
  const [sessionNameInput, setSessionNameInput] = useState(() => {
    return localStorage.getItem('preptrack_timer_nameInput') || '';
  });
  const [sessionSelected, setSessionSelected] = useState(() => {
    return localStorage.getItem('preptrack_timer_selected') || 'Session Auto';
  });
  const [isRunning, setIsRunning] = useState(() => {
    return localStorage.getItem('preptrack_timer_isRunning') === 'true';
  });
  const [isPaused, setIsPaused] = useState(() => {
    return localStorage.getItem('preptrack_timer_isPaused') === 'true';
  });
  const [timeElapsed, setTimeElapsed] = useState(() => {
    const savedTime = parseInt(localStorage.getItem('preptrack_timer_timeElapsed') || '0', 10);
    const savedIsRunning = localStorage.getItem('preptrack_timer_isRunning') === 'true';
    const savedIsPaused = localStorage.getItem('preptrack_timer_isPaused') === 'true';
    const savedLastTS = parseInt(localStorage.getItem('preptrack_timer_lastTS') || '0', 10);
    
    if (savedIsRunning && !savedIsPaused && savedLastTS > 0) {
      const deltaSec = Math.floor((Date.now() - savedLastTS) / 1000);
      return savedTime + deltaSec;
    }
    return savedTime;
  });
  
  // Pomodoro states
  const [pomodoroStage, setPomodoroStage] = useState<'work' | 'break'>(() => {
    return (localStorage.getItem('preptrack_timer_pomodoroStage') as 'work' | 'break') || 'work';
  });
  
  // Audio & Notification Custom Configurations
  const [alarmSound, setAlarmSound] = useState<'chime' | 'beep' | 'zen'>('chime');
  const [isMuted, setIsMuted] = useState(false);
  const [visualNotification, setVisualNotification] = useState<{
    type: 'work_done' | 'break_done' | 'test_done';
    title: string;
    message: string;
    duration: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(
    parseInt(localStorage.getItem('preptrack_timer_startTimeRef') || '0', 10) || Date.now()
  );
  const totalPausedTimeRef = useRef<number>(
    parseInt(localStorage.getItem('preptrack_timer_totalPausedTimeRef') || '0', 10) || 0
  );
  const pauseStartTimeRef = useRef<number>(
    parseInt(localStorage.getItem('preptrack_timer_pauseStartTimeRef') || '0', 10) || 0
  );

  const alarmSoundRef = useRef(alarmSound);
  const isMutedRef = useRef(isMuted);

  // Persistence to localstorage on every update reactive stream
  useEffect(() => {
    localStorage.setItem('preptrack_timer_mode', mode);
    localStorage.setItem('preptrack_timer_nameInput', sessionNameInput);
    localStorage.setItem('preptrack_timer_selected', sessionSelected);
    localStorage.setItem('preptrack_timer_isRunning', isRunning.toString());
    localStorage.setItem('preptrack_timer_isPaused', isPaused.toString());
    localStorage.setItem('preptrack_timer_timeElapsed', timeElapsed.toString());
    localStorage.setItem('preptrack_timer_pomodoroStage', pomodoroStage);
    localStorage.setItem('preptrack_timer_startTimeRef', sessionStartTimeRef.current.toString());
    localStorage.setItem('preptrack_timer_totalPausedTimeRef', totalPausedTimeRef.current.toString());
    localStorage.setItem('preptrack_timer_pauseStartTimeRef', pauseStartTimeRef.current.toString());
    localStorage.setItem('preptrack_timer_lastTS', Date.now().toString());
  }, [mode, sessionNameInput, sessionSelected, isRunning, isPaused, timeElapsed, pomodoroStage]);

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

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          const goal = currentDurationGoal();
          if (goal > 0 && next >= goal) {
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
                // Auto save study session
                saveSession(goal, true);
                setTimeElapsed(0);
                return 0;
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
                setIsRunning(false);
                return 0;
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
              setIsRunning(false);
              return 0;
            }
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, mode, pomodoroStage, settings]);

  const handleStart = () => {
    if (!isRunning) {
      sessionStartTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      setTimeElapsed(0);
      setIsRunning(true);
      setIsPaused(false);
    } else if (isPaused) {
      const pausedDuration = Math.floor((Date.now() - pauseStartTimeRef.current) / 1000);
      totalPausedTimeRef.current += pausedDuration;
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    pauseStartTimeRef.current = Date.now();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to discard the active timer session?')) {
      setIsRunning(false);
      setIsPaused(false);
      setTimeElapsed(0);
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
      alert('Keep studying! Log study sessions of at least 5 seconds.');
      return;
    }

    const durationToSave = timeElapsed;
    saveSession(durationToSave, false);
    setIsRunning(false);
    setIsPaused(false);
    setTimeElapsed(0);
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

  return (
    <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-md hover:border-border/80">
      
      {/* Decorative gradient glowing orb - purely aesthetic */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Circle visual progress & displays */}
      <div className="relative flex flex-col items-center justify-center shrink-0">
        
        {/* Animated circular gauge block styled with exquisite detail */}
        <div className="w-56 h-56 rounded-full flex flex-col items-center justify-center relative shadow-xs bg-accent/5">
          
          {/* SVG circle track loader under the core text */}
          <svg className="absolute inset-x-0 inset-y-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={settings.theme === 'cyber' ? '#10b981' : '#6366f1'} />
                <stop offset="100%" stopColor={settings.theme === 'cyber' ? '#34d399' : '#a855f7'} />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              className="text-border/40 dark:text-white/5"
              fill="transparent"
            />
            {/* Real progression stroke indicator */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#timerGrad)"
              strokeWidth={isRunning ? 5 : 4}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={mode === 'normal' ? (isRunning ? (isPaused ? circumference * 0.5 : 0) : circumference) : strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-300 ease-out ${isRunning && !isPaused && mode === 'normal' ? 'animate-[spin_24s_linear_infinite] origin-center' : ''}`}
              fill="transparent"
            />
          </svg>

          {/* Core glass ring overlay with inner shadow */}
          <div className="absolute w-[180px] h-[180px] rounded-full border border-border/60 bg-card/75 backdrop-blur-md flex flex-col items-center justify-center shadow-xs z-10">
            
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5 mb-1 bg-accent/20 px-2.5 py-0.5 rounded-full">
              {mode === 'normal' && <Timer className="w-3 h-3 text-indigo-500" />}
              {mode === 'pomodoro' && (pomodoroStage === 'work' ? <Award className="w-3 h-3 text-emerald-500 animate-bounce" /> : <Coffee className="w-3 h-3 text-orange-500" />)}
              {mode === 'test' && <BookOpen className="w-3 h-3 text-rose-500" />}
              {mode === 'normal' && 'Normal Study'}
              {mode === 'pomodoro' && `Pomodoro: ${pomodoroStage}`}
              {mode === 'test' && '3HR JEE TEST'}
            </span>

            {/* Timer String digits */}
            <div className="font-mono text-3xl font-semibold tracking-tight text-foreground flex gap-0.5 items-center my-1.5 transition-colors">
              <span>{hoursStr}</span>
              <span className={isRunning && !isPaused ? "animate-pulse text-indigo-500" : ""}>:</span>
              <span>{minutesStr}</span>
              <span className={isRunning && !isPaused ? "animate-pulse text-indigo-500" : ""}>:</span>
              <span>{secondsStr}</span>
            </div>

            <p className="text-[9px] text-muted-foreground/80 font-medium">
              {isRunning ? (isPaused ? 'Paused' : 'Active Study Session') : 'Prepared & Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Control panel and customization options */}
      <div className="flex-1 w-full space-y-5">
        <div className="grid grid-cols-3 gap-2.5">
          {(['normal', 'pomodoro', 'test'] as StudyMode[]).map((m) => (
            <button
              key={m}
              disabled={isRunning}
              onClick={() => {
                setMode(m);
                setTimeElapsed(0);
                setPomodoroStage('work');
              }}
              className={`py-3.5 px-3 rounded-2xl text-xs font-bold capitalize border cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === m
                  ? 'bg-primary border-primary text-primary-foreground shadow-[0_8px_24px_rgba(129,140,248,0.22)]'
                  : 'bg-accent/10 border-border/80 hover:bg-accent/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-sans">
                {m === 'normal' && 'Normal Study'}
                {m === 'pomodoro' && 'Pomodoro'}
                {m === 'test' && 'JEE Test (3h)'}
              </span>
            </button>
          ))}
        </div>

        {/* Audible notification options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-accent/5 border border-border/40 p-3 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-500" /> Pomodoro Alert:
            </span>
            <select
              value={alarmSound}
              onChange={(e) => setAlarmSound(e.target.value as any)}
              className="bg-accent/20 hover:bg-accent/35 border border-border text-[11px] rounded-lg px-2 py-1 outline-none font-bold text-foreground cursor-pointer transition-all"
            >
              <option value="chime">🎵 Electronic Chimes</option>
              <option value="beep">🌌 Classic Alert Beeps</option>
              <option value="zen">🧘 Cosmic Zen Gong</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
            <button
              onClick={() => playAudibleNotification('work_done')}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent/25 text-muted-foreground hover:text-foreground text-[10px] font-bold transition-all cursor-pointer"
            >
              Test Alert
            </button>
          </div>
        </div>

        {/* Configurations for Active Session labels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Session Block</label>
            <select
              disabled={isRunning}
              value={sessionSelected}
              onChange={(e) => setSessionSelected(e.target.value)}
              className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3 py-2.5 font-medium outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
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
              className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3 py-2.5 font-medium placeholder:text-muted-foreground/50 outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Timer Control CTA Buttons */}
        <div className="pt-2 flex flex-wrap gap-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 min-w-[120px] bg-primary hover:brightness-110 active:scale-[0.98] text-primary-foreground font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all duration-300 cursor-pointer"
            >
              <Play className="w-4.5 h-4.5 fill-current" /> Start Focused Study
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-4.5 h-4.5 fill-current" /> Resume Study
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  <Pause className="w-4.5 h-4.5 fill-current" /> Pause Block
                </button>
              )}

              <button
                onClick={handleStopAndSave}
                className="bg-primary hover:brightness-110 active:scale-[0.98] text-primary-foreground font-bold text-sm py-4 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/25"
                title="Stop and save session to local history Log"
              >
                <Square className="w-4.5 h-4.5 fill-current" /> Save Session
              </button>

              <button
                onClick={handleReset}
                className="border border-border bg-accent/10 hover:bg-accent/30 text-muted-foreground hover:text-foreground font-bold text-xs py-4 px-4 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-[0.98]"
                title="Discard study session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Interactive guidelines helpful hint */}
        <div className="text-[11px] text-muted-foreground flex gap-1.5 items-start mt-2">
          <AlertCircle className="w-4 h-4 text-indigo-500/80 shrink-0" />
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
                <div className="border border-border/80 rounded-xl px-3 py-2 bg-accent/15 inline-block mx-auto text-[10px] font-mono text-muted-foreground">
                  📊 Automatically saved <span className="font-bold text-foreground">{settings.pomodoroWorkDuration} mins</span> session to history logs.
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
    </div>
  );
}
