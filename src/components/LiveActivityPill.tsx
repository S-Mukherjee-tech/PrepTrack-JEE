import React, { useState, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause } from 'lucide-react';
import { secureStorage } from '../utils/security';

interface LiveActivityPillProps {
  onOpenTimerTab?: () => void;
  theme?: string;
}

export const LiveActivityPill = memo(function LiveActivityPill({
  onOpenTimerTab,
}: LiveActivityPillProps) {
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
      const name = secureStorage.getItem('preptrack_timer_nameInput') || 
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
      <motion.div
        layout
        onClick={handlePillClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 dark:bg-black/80 border border-white/10 hover:border-white/20 text-white backdrop-blur-2xl shadow-sm cursor-pointer select-none transition-colors group"
        title="Click to open Pomodoro & Stopwatch"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-medium tracking-tight text-white/90 group-hover:text-white transition-colors">
          Ready to Focus
        </span>
        <span className="text-[9px] font-semibold font-numeric px-2 py-0.5 rounded-full bg-white/10 text-white/70">
          Focus Timer
        </span>
      </motion.div>
    );
  }

  // Active / Paused Focus Tracker Capsule
  const isBreak = mode === 'pomodoro' && pomodoroStage === 'break';
  const pulseColor = isPaused ? 'bg-amber-400' : isBreak ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 450, damping: 32, mass: 0.7 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={handlePillClick}
      className={`relative flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-full bg-slate-950/90 dark:bg-black/95 border border-white/15 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl cursor-pointer select-none transition-all duration-300 transform-gpu ${
        isExpanded ? 'ring-2 ring-white/20 px-4 py-2' : ''
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
            <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
            <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-tight text-white leading-none">
            {isBreak ? 'Break Interval' : sessionName}
          </span>
          {isExpanded && (
            <span className="text-[9px] text-white/60 tracking-tight leading-none mt-0.5">
              {isPaused ? 'Paused' : isBreak ? 'Resting' : 'Focus Active'}
            </span>
          )}
        </div>
      </div>

      {/* Live Timer Counter (Sleek Numeric Font) */}
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-numeric font-bold tracking-tight text-white tabular-nums">
          {formatSeconds(timeElapsed)}
        </span>

        {/* Quick Micro Play/Pause Button */}
        <button
          onClick={handleTogglePlayPause}
          className="p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
          title={isPaused ? 'Resume' : 'Pause'}
          aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
        >
          {isPaused ? (
            <Play className="w-3 h-3 fill-current text-emerald-400" />
          ) : (
            <Pause className="w-3 h-3 fill-current text-white" />
          )}
        </button>
      </div>
    </motion.div>
  );
});

export default LiveActivityPill;
