import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ArrowRight, Sparkles, Shield, X } from 'lucide-react';
import { StudyTarget } from '../types';
import { secureJsonParse, secureStorage } from '../utils/security';
import { formatRemainingTime } from './TargetTracker';

interface TargetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
  onNavigateToTargets,
  theme
}: TargetReminderModalProps) {
  const [targets, setTargets] = useState<StudyTarget[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync targets whenever modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const savedTargets = secureStorage.getItem('preptrack_study_targets');
        const parsedTargets: StudyTarget[] = savedTargets ? secureJsonParse<StudyTarget[]>(savedTargets, []) : [];
        setTargets(parsedTargets);
        setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  // Lock document body scroll when modal is open to prevent page scrolling behind it
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleGoToTargets = () => {
    onClose();
    if (onNavigateToTargets) {
      onNavigateToTargets();
    } else {
      setTimeout(() => {
        const el = document.getElementById('target-tracker-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    }
  };

  const activeTargets = targets.filter((t) => !t.completed);
  const achievedTargets = targets.filter((t) => t.completed);
  const overdueCount = activeTargets.filter((t) => t.deadline <= Date.now()).length;

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm sm:backdrop-blur-md select-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Target Reminder Mission Briefing"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="w-full max-w-[480px] max-h-[82dvh] sm:max-h-[80dvh] bg-card border border-border/90 rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Radial Aura */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header (Pinned Top - Compact & Proportionate) */}
            <div className="p-3.5 sm:p-5 pb-2.5 sm:pb-3 border-b border-border/70 shrink-0 relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold tracking-wide select-none">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Mission Briefing • Active Targets
                </div>
                <h2 className="text-base sm:text-lg font-black font-display tracking-tight text-foreground leading-tight">
                  Welcome Back, Aspirant.
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-1 sm:line-clamp-2">
                  Review your locked targets for today. Stay disciplined and hit your milestones!
                </p>
              </div>

              {/* Close Button with generous touch target */}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0 touch-target-expand"
                aria-label="Close reminder modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Body (Internal scroll only when content exceeds screen) */}
            <div className="overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-3 sm:space-y-4 flex-1">
              {/* Target Status Overview Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">Active</span>
                  <span className="text-sm sm:text-base font-bold font-numeric text-white">{activeTargets.length}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">Achieved</span>
                  <span className="text-sm sm:text-base font-bold font-numeric text-white">{achievedTargets.length}</span>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-xl border text-center space-y-0.5 ${
                  overdueCount > 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 animate-pulse' : 'bg-accent/15 border-border text-muted-foreground'
                }`}>
                  <span className="text-[9px] uppercase font-bold tracking-wider block font-mono">Overdue</span>
                  <span className="text-sm sm:text-base font-bold font-numeric text-white">{overdueCount}</span>
                </div>
              </div>

              {/* Targets Snapshot List */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Committed Deadlines ({activeTargets.length})
                </div>

                {activeTargets.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-accent/10 border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                    <p>No active targets currently locked in. Set your daily goals to ignite high productivity!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] sm:max-h-[180px] overflow-y-auto pr-1">
                    {activeTargets.map((target) => {
                      const remaining = formatRemainingTime(target.deadline);
                      return (
                        <div
                          key={target.id}
                          className="p-2.5 sm:p-3 rounded-xl bg-accent/10 border border-border/70 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground truncate block text-xs">{target.title}</span>
                              <span className="text-[9.5px] text-muted-foreground uppercase font-mono">{target.cadence} target</span>
                            </div>
                          </div>
                          <div className={`shrink-0 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
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
                    })}
                  </div>
                )}
              </div>

              {/* Inspirational Daily Quote - Compact */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-muted-foreground italic leading-relaxed text-center">
                {MOTIVATIONAL_QUOTES[quoteIndex]}
              </div>
            </div>

            {/* Footer (Pinned Bottom - ALWAYS visible without scroll) */}
            <div className="p-3 sm:p-4 border-t border-border/70 shrink-0 relative z-10 bg-card/95 flex items-center justify-between gap-2.5">
              <span className="text-[10px] text-muted-foreground items-center gap-1.5 select-none hidden sm:flex">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Locked Commitment
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-accent/20 hover:bg-accent/35 active:scale-95 text-foreground text-xs font-semibold transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleGoToTargets}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md min-h-[40px]"
                >
                  <span>Open Target Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export default TargetReminderModal;
