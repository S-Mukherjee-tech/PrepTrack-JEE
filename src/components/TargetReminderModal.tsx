import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Clock, Trophy, AlertTriangle, ArrowRight, Sparkles, CheckCircle2, Shield, Calendar, Zap, X } from 'lucide-react';
import { StudyTarget } from '../types';
import { secureJsonParse, secureStorage } from '../utils/security';
import { formatRemainingTime } from './TargetTracker';

interface TargetReminderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToTargets?: () => void;
  theme?: string;
}

const MOTIVATIONAL_QUOTES = [
  "\"Consistency isn't about perfection; it's about refusing to let a single day pass without moving the needle forward.\" — JEE Rankers' Creed",
  "\"The difference between rank 1000 and rank 100 is what you do in the hours when nobody is watching.\" — IITian Mindset",
  "\"Discipline is simply choosing between what you want now and what you want most.\" — Prep Principle",
  "\"Tackle your hardest concept first. When the mind wants to wander, anchor it to your daily target.\"",
];

export const TargetReminderModal = memo(function TargetReminderModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onNavigateToTargets,
  theme
}: TargetReminderModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [targets, setTargets] = useState<StudyTarget[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Check on initial mount if this is an app launch / new website opening
  useEffect(() => {
    try {
      const hasShownThisSession = sessionStorage.getItem('preptrack_session_reminder_seen');
      const savedTargets = secureStorage.getItem('preptrack_study_targets');
      const parsedTargets: StudyTarget[] = savedTargets ? secureJsonParse<StudyTarget[]>(savedTargets, []) : [];
      setTargets(parsedTargets);

      // If user hasn't seen it this session and there are targets (or first time visiting)
      if (!hasShownThisSession) {
        // Small delay so page renders gracefully first
        const timer = setTimeout(() => {
          setInternalIsOpen(true);
          sessionStorage.setItem('preptrack_session_reminder_seen', 'true');
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Failed to initialize target reminder check:', e);
    }
  }, []);

  // Update targets if controlled open is triggered
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setInternalIsOpen(controlledIsOpen);
      if (controlledIsOpen) {
        try {
          const savedTargets = secureStorage.getItem('preptrack_study_targets');
          const parsedTargets: StudyTarget[] = savedTargets ? secureJsonParse<StudyTarget[]>(savedTargets, []) : [];
          setTargets(parsedTargets);
        } catch {
          // ignore
        }
      }
    }
  }, [controlledIsOpen]);

  // Pick a random quote
  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, [internalIsOpen]);

  const handleClose = () => {
    setInternalIsOpen(false);
    if (controlledOnClose) controlledOnClose();
  };

  const handleGoToTargets = () => {
    handleClose();
    if (onNavigateToTargets) {
      onNavigateToTargets();
    } else {
      const el = document.getElementById('target-tracker-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const activeTargets = targets.filter((t) => !t.completed);
  const achievedTargets = targets.filter((t) => t.completed);
  const overdueCount = activeTargets.filter((t) => t.deadline <= Date.now()).length;

  if (!internalIsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="w-full max-w-xl bg-card border border-border/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden dashboard-card-gpu"
        >
          {/* Subtle Ambient Radial Aura */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close reminder modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-3 border-b border-white/10 pb-5 mb-5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-bold tracking-wide select-none">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-indigo-400" />
              Mission Briefing • Active Targets
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-foreground flex items-center gap-2">
                <span>Welcome Back, Aspirant.</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review your committed study deadlines for today. Targets are locked in for accountability!
              </p>
            </div>
          </div>

          {/* Target Status Overview Cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 relative z-10">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">Active</span>
              <span className="text-lg font-bold font-numeric text-white">{activeTargets.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">Achieved</span>
              <span className="text-lg font-bold font-numeric text-white">{achievedTargets.length}</span>
            </div>
            <div className={`p-3 rounded-2xl border text-center space-y-0.5 ${
              overdueCount > 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 animate-pulse' : 'bg-accent/15 border-border text-muted-foreground'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider block font-mono">Overdue</span>
              <span className="text-lg font-bold font-numeric text-white">{overdueCount}</span>
            </div>
          </div>

          {/* Targets Snapshot List */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mb-5 relative z-10">
            {activeTargets.length === 0 ? (
              <div className="p-4 rounded-2xl bg-accent/10 border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                <p>No active targets currently locked in. Set your daily goals to ignite high productivity!</p>
              </div>
            ) : (
              activeTargets.map((target) => {
                const remaining = formatRemainingTime(target.deadline);
                return (
                  <div
                    key={target.id}
                    className="p-3 rounded-xl bg-accent/10 border border-border/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground truncate block">{target.title}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{target.cadence} target</span>
                      </div>
                    </div>
                    <div className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      remaining.isOverdue
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : remaining.urgent
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {remaining.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inspirational Daily Quote */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 mb-6 text-xs text-muted-foreground italic leading-relaxed text-center relative z-10">
            {MOTIVATIONAL_QUOTES[quoteIndex]}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 relative z-10 border-t border-white/5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 select-none">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Locked Commitment Engine Active
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-accent/20 hover:bg-accent/35 text-foreground text-xs font-semibold transition-all cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleGoToTargets}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <span>Open Target Tracker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default TargetReminderModal;
