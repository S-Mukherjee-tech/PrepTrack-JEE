import React, { useState, useEffect, memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { secureStorage } from '../utils/security';

interface LiveActivityPillProps {
  onOpenTimerTab?: () => void;
  theme?: string;
}

export const LiveActivityPill = memo(function LiveActivityPill({
  onOpenTimerTab,
  theme = 'glass',
}: LiveActivityPillProps) {
  const isLight = theme === 'light';
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<'normal' | 'pomodoro' | 'stopwatch'>('normal');
  const [pomodoroStage, setPomodoroStage] = useState<'work' | 'break'>('work');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionName, setSessionName] = useState('Deep Focus');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync state with local storage on a fast interval
  useEffect(() => {
    const updateFromStorage = () => {
      const running = secureStorage.getItem('preptrack_timer_isRunning') === 'true';
      const paused = secureStorage.getItem('preptrack_timer_isPaused') === 'true';
      const timerMode = (secureStorage.getItem('preptrack_timer_mode') as any) || 'normal';
      const stage = (secureStorage.getItem('preptrack_timer_pomodoroStage') as any) || 'work';
      const rawName = secureStorage.getItem('preptrack_timer_nameInput');
      const validName = (rawName && !rawName.startsWith('U2FsdGVkX1')) ? rawName : '';
      const name = validName || 
                   secureStorage.getItem('preptrack_timer_selected') || 'Deep Focus';
      
      const savedTime = parseInt(secureStorage.getItem('preptrack_timer_timeElapsed') || '0', 10);
      const savedLastTS = parseInt(secureStorage.getItem('preptrack_timer_lastTS') || '0', 10);

      setIsRunning(running);
      setIsPaused(paused);
      setMode(timerMode);
      setPomodoroStage(stage);
      setSessionName(name.length > 18 ? name.substring(0, 16) + '...' : name);

      if (running && !paused && savedLastTS > 0) {
        const deltaSec = Math.floor((Date.now() - savedLastTS) / 1000);
        setTimeElapsed(savedTime + deltaSec);
      } else {
        setTimeElapsed(savedTime);
      }
    };

    updateFromStorage();
    const interval = setInterval(updateFromStorage, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRunning) {
      secureStorage.setItem('preptrack_timer_isRunning', 'true');
      secureStorage.setItem('preptrack_timer_isPaused', 'false');
      secureStorage.setItem('preptrack_timer_lastTS', Date.now().toString());
      setIsRunning(true);
      setIsPaused(false);
    } else {
      const nextPaused = !isPaused;
      secureStorage.setItem('preptrack_timer_isPaused', nextPaused.toString());
      secureStorage.setItem('preptrack_timer_lastTS', Date.now().toString());
      setIsPaused(nextPaused);
    }
  };

  const handlePillClick = () => {
    if (onOpenTimerTab) {
      onOpenTimerTab();
    }
  };

  // Idle state: sleek status badge
  if (!isRunning && timeElapsed === 0) {
    return (
      <button
        type="button"
        onClick={handlePillClick}
        className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm cursor-pointer select-none transition-colors duration-150 active:scale-95 group ${
          isLight
            ? 'bg-white border-indigo-200/90 hover:border-indigo-400 text-slate-800'
            : 'bg-slate-900/90 dark:bg-black/85 border-white/10 hover:border-emerald-400/70 text-white'
        }`}
        title="Click to open Pomodoro & Stopwatch"
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className={`text-[11px] font-medium tracking-tight transition-colors ${
          isLight ? 'text-slate-700 group-hover:text-slate-950' : 'text-white/90 group-hover:text-white'
        }`}>
          Ready to Focus
        </span>
        <span className={`text-[9px] font-semibold font-numeric px-2 py-0.5 rounded-full ${
          isLight
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
            : 'bg-white/10 text-white/70'
        }`}>
          Focus Timer
        </span>
      </button>
    );
  }

  // Active / Paused Focus Tracker Capsule
  const isBreak = mode === 'pomodoro' && pomodoroStage === 'break';
  const pulseColor = isPaused ? 'bg-amber-400' : isBreak ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={handlePillClick}
      className={`relative flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-full border shadow-md cursor-pointer select-none transition-colors duration-150 active:scale-95 ${
        isLight
          ? 'bg-white border-indigo-300/90 hover:border-indigo-500 text-slate-900'
          : 'bg-slate-950/95 dark:bg-black/95 border-white/15 hover:border-emerald-400/60 text-white'
      } ${
        isExpanded ? (isLight ? 'ring-1 ring-indigo-300 px-3.5' : 'ring-1 ring-white/25 px-3.5') : ''
      }`}
      title="Click to open timer"
    >
      {/* Soundwave / Status Pulse */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {!isPaused && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseColor}`}></span>
        </span>

        {/* Live Focus Wave Bars */}
        {!isPaused && (
          <div className="flex items-center gap-0.5 h-3 px-0.5">
            <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
            <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="hidden sm:flex flex-col">
          <span className={`text-[10px] font-bold tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isBreak ? 'Break Interval' : sessionName}
          </span>
          {isExpanded && (
            <span className={`text-[9px] tracking-tight leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              {isPaused ? 'Paused' : isBreak ? 'Resting' : 'Focus Active'}
            </span>
          )}
        </div>
      </div>

      {/* Live Timer Counter (Sleek Numeric Font) */}
      <div className="flex items-center gap-2">
        <span className={`text-xs sm:text-sm font-numeric font-bold tracking-tight tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {formatSeconds(timeElapsed)}
        </span>

        {/* Quick Micro Play/Pause Button */}
        <button
          onClick={handleTogglePlayPause}
          className={`p-1 rounded-full active:scale-90 transition-all cursor-pointer ${
            isLight
              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isPaused ? 'Resume' : 'Pause'}
          aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
        >
          {isPaused ? (
            <Play className="w-3 h-3 fill-current text-emerald-500" />
          ) : (
            <Pause className={`w-3 h-3 fill-current ${isLight ? 'text-indigo-700' : 'text-white'}`} />
          )}
        </button>
      </div>
    </div>
  );
});

export default LiveActivityPill;
