import { useState, useEffect, useRef, KeyboardEvent, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Edit3, 
  RotateCcw, 
  AlertTriangle, 
  Trophy, 
  Sparkles, 
  Lock, 
  FileText, 
  Check, 
  Save, 
  Flame, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { StudyTarget, TargetCadence, TargetCategory } from '../types';
import { secureJsonParse, sanitizeInput, limitStringLength, secureStorage } from '../utils/security';

interface TargetTrackerProps {
  theme: 'slate' | 'cyber' | 'light' | 'glass';
  cardBgClass: string;
  onTargetsCountChange?: (activeCount: number, pendingCount: number) => void;
}

// Helpers to compute deadlines
export function getEndOfToday(): number {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.getTime();
}

export function getEndOfWeek(): number {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  sunday.setHours(23, 59, 59, 999);
  return sunday.getTime();
}

export function getEndOfMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  return lastDay.getTime();
}

export function formatRemainingTime(deadlineMs: number): { text: string; isOverdue: boolean; urgent: boolean } {
  const diff = deadlineMs - Date.now();
  if (diff <= 0) {
    const overdueMins = Math.floor(Math.abs(diff) / (1000 * 60));
    if (overdueMins < 60) {
      return { text: `Deadline elapsed ${overdueMins}m ago`, isOverdue: true, urgent: true };
    }
    const overdueHrs = Math.floor(overdueMins / 60);
    if (overdueHrs < 24) {
      return { text: `Deadline elapsed ${overdueHrs}h ago`, isOverdue: true, urgent: true };
    }
    const overdueDays = Math.floor(overdueHrs / 24);
    return { text: `Deadline elapsed ${overdueDays}d ago`, isOverdue: true, urgent: true };
  }

  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) {
    return { text: `${mins}m remaining`, isOverdue: false, urgent: true };
  }
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs < 24) {
    return { 
      text: `${hrs}h ${remainingMins}m left`, 
      isOverdue: false, 
      urgent: hrs < 3 
    };
  }
  const days = Math.floor(hrs / 24);
  const remainingHrs = hrs % 24;
  return { 
    text: `${days}d ${remainingHrs}h left`, 
    isOverdue: false, 
    urgent: false 
  };
}

const VICTORY_MESSAGES = [
  "🎉 Target Accomplished! Incredible focus and grit. You're building true rank-winning consistency!",
  "⭐ Mission Complete! You set the bar high and conquered it before the deadline.",
  "🚀 Flawless Execution! Every target crossed off compounds into immense exam-day confidence.",
  "🏆 Champion Mindset! That's how future IITians train: discipline over mood.",
];

const ENCOURAGING_FAILURE_MESSAGES = [
  "⚡ Deadline elapsed without completion. Remember: setbacks are merely diagnostics for champions. Reset your target and strike back with unrelenting focus!",
  "💪 Stumbled on this target? Top rankers miss goals too, but they reset in seconds. Analyze what stalled your pace and start the new cycle!",
  "🔥 Time ran out, but your potential didn't. Reset your target now and attack today's preparation with doubled velocity.",
  "🎯 Don't look back in frustration. The only real loss is quitting. Hit Reset and make this cycle your strongest yet!",
];

const TargetTracker = memo(function TargetTracker({ theme, cardBgClass, onTargetsCountChange }: TargetTrackerProps) {
  const [targets, setTargets] = useState<StudyTarget[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'achieved' | 'scratchpad'>('active');
  const [loaded, setLoaded] = useState(false);

  // New target input state
  const [inputTitle, setInputTitle] = useState('');
  const [cadence, setCadence] = useState<TargetCadence>('daily');
  const [customDeadlineDate, setCustomDeadlineDate] = useState('');
  const [category, setCategory] = useState<TargetCategory>('general');
  const [isAddingExpanded, setIsAddingExpanded] = useState(false);

  // Editing state
  const [editingTarget, setEditingTarget] = useState<StudyTarget | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editCategory, setEditCategory] = useState<TargetCategory>('general');
  const [editNotes, setEditNotes] = useState('');

  // Scratchpad state
  const [scratchpadText, setScratchpadText] = useState('');
  const [isSavingScratchpad, setIsSavingScratchpad] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Success toast/message state
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'resilience' } | null>(null);

  // Live countdown ticker updater every 30 seconds
  const [, setClockTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setClockTicker((c) => c + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load from persistent storage on mount
  useEffect(() => {
    try {
      const savedTargets = secureStorage.getItem('preptrack_study_targets');
      if (savedTargets) {
        const parsed = secureJsonParse<StudyTarget[]>(savedTargets, []);
        setTargets(parsed);
      } else {
        // Fallback: Check if there were legacy quick notes and migrate them seamlessly
        const legacyNotes = secureStorage.getItem('preptrack_quick_notes');
        if (legacyNotes) {
          const parsedNotes = secureJsonParse<any[]>(legacyNotes, []);
          if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
            const migrated: StudyTarget[] = parsedNotes.map((n) => ({
              id: n.id || Math.random().toString(36).substring(2, 9),
              title: n.text || 'Study Target',
              cadence: 'daily',
              deadline: getEndOfToday(),
              createdAt: n.timestamp || Date.now(),
              completed: Boolean(n.completed),
              status: n.completed ? 'achieved' : 'active',
              resetCount: 0,
              category: 'general'
            }));
            setTargets(migrated);
            secureStorage.setItem('preptrack_study_targets', JSON.stringify(migrated));
          }
        }
      }

      const savedScratchpad = secureStorage.getItem('preptrack_quick_notes_scratchpad');
      if (savedScratchpad) {
        setScratchpadText(limitStringLength(sanitizeInput(savedScratchpad), 10000));
      }
    } catch (e) {
      console.error('Failed to load study targets:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save targets to local storage whenever changed
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      try {
        secureStorage.setItem('preptrack_study_targets', JSON.stringify(targets));
        if (onTargetsCountChange) {
          const active = targets.filter((t) => !t.completed && t.deadline > Date.now()).length;
          const pending = targets.filter((t) => !t.completed).length;
          onTargetsCountChange(active, pending);
        }
      } catch (e) {
        console.error('Failed to save study targets:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [targets, loaded, onTargetsCountChange]);

  // Scratchpad auto-save
  useEffect(() => {
    if (!loaded) return;
    setIsSavingScratchpad(true);
    const timer = setTimeout(() => {
      try {
        secureStorage.setItem('preptrack_quick_notes_scratchpad', scratchpadText);
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Failed to auto-save scratchpad:', e);
      } finally {
        setIsSavingScratchpad(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [scratchpadText, loaded]);

  // Add new target
  const handleAddTarget = () => {
    const trimmed = inputTitle.trim();
    if (!trimmed) return;

    let targetDeadline = getEndOfToday();
    if (cadence === 'weekly') {
      targetDeadline = getEndOfWeek();
    } else if (cadence === 'monthly') {
      targetDeadline = getEndOfMonth();
    } else if (cadence === 'custom') {
      if (customDeadlineDate) {
        const parsed = new Date(customDeadlineDate).getTime();
        if (!isNaN(parsed) && parsed > Date.now()) {
          targetDeadline = parsed;
        } else {
          targetDeadline = Date.now() + 24 * 3600 * 1000; // default 24h
        }
      } else {
        targetDeadline = getEndOfToday();
      }
    }

    const newTarget: StudyTarget = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      title: limitStringLength(sanitizeInput(trimmed), 200),
      cadence,
      deadline: targetDeadline,
      createdAt: Date.now(),
      completed: false,
      status: 'active',
      resetCount: 0,
      category
    };

    setTargets([newTarget, ...targets]);
    setInputTitle('');
    setCustomDeadlineDate('');
    setIsAddingExpanded(false);

    setToastMessage({
      title: '🎯 Target Locked & Committed',
      desc: 'Target locked into accountability tracker. Once set, it cannot be deleted—only edited or conquered!',
      type: 'success'
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Toggle completion with verdict messages
  const handleToggleComplete = (id: string) => {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const now = Date.now();
        const nextCompleted = !t.completed;
        let nextStatus = t.status;
        let verdict = t.resultMessage;

        if (nextCompleted) {
          nextStatus = 'achieved';
          verdict = VICTORY_MESSAGES[Math.floor(Math.random() * VICTORY_MESSAGES.length)];
          setToastMessage({
            title: '🏆 Target Accomplished!',
            desc: verdict,
            type: 'success'
          });
          setTimeout(() => setToastMessage(null), 6000);
        } else {
          nextStatus = now > t.deadline ? 'failed' : 'active';
        }

        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? now : undefined,
          status: nextStatus,
          resultMessage: verdict
        };
      })
    );
  };

  // Reset target for new cycle when deadline is over or accomplished
  const handleResetTarget = (target: StudyTarget) => {
    let nextDeadline = getEndOfToday();
    if (target.cadence === 'weekly') {
      nextDeadline = getEndOfWeek();
    } else if (target.cadence === 'monthly') {
      nextDeadline = getEndOfMonth();
    } else if (target.cadence === 'custom') {
      // For custom, extend by 24h or allow editing
      nextDeadline = Date.now() + 24 * 3600 * 1000;
    }

    const wasAchieved = target.completed;
    const verdict = wasAchieved
      ? VICTORY_MESSAGES[Math.floor(Math.random() * VICTORY_MESSAGES.length)]
      : ENCOURAGING_FAILURE_MESSAGES[Math.floor(Math.random() * ENCOURAGING_FAILURE_MESSAGES.length)];

    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== target.id) return t;
        return {
          ...t,
          completed: false,
          completedAt: undefined,
          deadline: nextDeadline,
          status: 'active',
          resetCount: (t.resetCount || 0) + 1,
          lastResetAt: Date.now(),
          resultMessage: verdict
        };
      })
    );

    setToastMessage({
      title: wasAchieved ? '🔄 Reset for Next Milestone!' : '⚡ New Cycle Activated!',
      desc: wasAchieved
        ? 'Target reset with a clean slate for your next cycle. Keep compounding your mastery!'
        : 'Previous cycle archived. Clean slate initialized. Go crush this round!',
      type: wasAchieved ? 'success' : 'resilience'
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Open Edit Modal
  const handleStartEdit = (target: StudyTarget) => {
    setEditingTarget(target);
    setEditTitle(target.title);
    setEditCategory(target.category || 'general');
    setEditNotes(target.notes || '');

    // Format current deadline for datetime-local input
    const d = new Date(target.deadline);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditDeadline(localIso);
  };

  // Save Edits (CRITICAL: Can edit, CANNOT delete!)
  const handleSaveEdit = () => {
    if (!editingTarget) return;
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    let updatedDeadline = editingTarget.deadline;
    if (editDeadline) {
      const parsed = new Date(editDeadline).getTime();
      if (!isNaN(parsed)) {
        updatedDeadline = parsed;
      }
    }

    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== editingTarget.id) return t;
        return {
          ...t,
          title: limitStringLength(sanitizeInput(trimmed), 200),
          category: editCategory,
          deadline: updatedDeadline,
          notes: limitStringLength(sanitizeInput(editNotes), 500),
          // Recalculate status based on new deadline
          status: t.completed ? 'achieved' : (Date.now() > updatedDeadline ? 'failed' : 'active')
        };
      })
    );

    setEditingTarget(null);
    setToastMessage({
      title: '✏️ Target Updated',
      desc: 'Target details and deadline rescheduled successfully.',
      type: 'success'
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered lists
  const activeTargets = useMemo(() => {
    return targets.filter((t) => !t.completed);
  }, [targets]);

  const completedTargets = useMemo(() => {
    return targets.filter((t) => t.completed);
  }, [targets]);

  // Theme accents
  const activeTabAccent = 
    theme === 'cyber' ? 'bg-emerald-500 text-black font-extrabold shadow-sm' :
    theme === 'light' ? 'bg-rose-500 text-white font-bold shadow-sm' :
    theme === 'slate' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' :
    'bg-indigo-600 text-white font-bold shadow-sm';

  const outlineBorder = 
    theme === 'cyber' ? 'border-emerald-500/25' :
    theme === 'light' ? 'border-rose-500/25' :
    theme === 'slate' ? 'border-cyan-500/25' :
    'border-border/80';

  const categoryBadgeColors: Record<TargetCategory, string> = {
    general: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    physics: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    chemistry: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    math: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    revision: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    mock_test: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  return (
    <div id="target-tracker-section" className={`rounded-3xl p-6 sm:p-7.5 shadow-sm border ${outlineBorder} ${cardBgClass} dashboard-card-gpu relative overflow-hidden`}>
      
      {/* Decorative ambient background aura */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER WITH COMMITMENT BADGE & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5 mb-6 select-none relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 shrink-0">
              <Target className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display tracking-tight text-foreground">
                  Target & Deadline Tracker
                </h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <Lock className="w-2.5 h-2.5" /> Locked Accountability
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Set daily, weekly, or custom milestones. Once set, targets can only be edited or conquered—never deleted!
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-accent/15 dark:bg-black/40 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all font-sans cursor-pointer ${
              activeTab === 'active' ? activeTabAccent : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Active Targets ({activeTargets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('achieved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all font-sans cursor-pointer ${
              activeTab === 'achieved' ? activeTabAccent : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Achievements ({completedTargets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all font-sans cursor-pointer ${
              activeTab === 'scratchpad' ? activeTabAccent : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formulas Whiteboard</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC TOAST / ENCOURAGEMENT BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 shadow-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-0.5 flex-1">
              <span className="text-xs font-bold font-display block">{toastMessage.title}</span>
              <p className="text-[11px] leading-relaxed opacity-90">{toastMessage.desc}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'active' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* QUICK TARGET CREATOR */}
          <div className="p-4.5 rounded-2xl bg-accent/10 border border-white/10 space-y-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTarget()}
                placeholder="Lock in a target (e.g. 50 Optics PYQs, HC Verma Ch 3, Organic Revision)..."
                className="flex-1 text-xs px-3.5 py-3 rounded-xl bg-card border border-border/80 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-500/60 transition-all font-medium"
              />
              <button
                onClick={handleAddTarget}
                disabled={!inputTitle.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" /> Set Target
              </button>
            </div>

            {/* CADENCE & CATEGORY TOGGLE SELECTORS */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              {/* Cadence picker buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 font-mono">Cadence:</span>
                {(['daily', 'weekly', 'monthly', 'custom'] as TargetCadence[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCadence(c);
                      if (c === 'custom') setIsAddingExpanded(true);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize border transition-all cursor-pointer ${
                      cadence === c
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-card/60 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {c === 'daily' && '⚡ Daily (Tonight)'}
                    {c === 'weekly' && '📅 Weekly (Sunday)'}
                    {c === 'monthly' && '🗓️ Monthly'}
                    {c === 'custom' && '🎯 Custom Deadline'}
                  </button>
                ))}
              </div>

              {/* Subject Category selector */}
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TargetCategory)}
                  aria-label="Target subject category"
                  className="bg-card text-foreground border border-border/80 text-[11px] rounded-lg px-2.5 py-1 font-medium outline-none cursor-pointer"
                >
                  <option value="general">General Topic</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="math">Mathematics</option>
                  <option value="revision">Revision Sprint</option>
                  <option value="mock_test">Mock Test</option>
                </select>
              </div>
            </div>

            {/* Custom Date Picker row when custom is picked */}
            {cadence === 'custom' && (
              <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Pick precise deadline date & time:</span>
                <input
                  type="datetime-local"
                  value={customDeadlineDate}
                  onChange={(e) => setCustomDeadlineDate(e.target.value)}
                  className="bg-card border border-border/80 text-foreground text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer font-numeric"
                />
              </div>
            )}
          </div>

          {/* ACTIVE TARGETS LIST */}
          <div className="space-y-3">
            {activeTargets.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2.5">
                <Target className="w-8 h-8 text-indigo-500/30 animate-pulse" />
                <div className="space-y-1">
                  <span className="font-bold text-foreground block text-sm">No Active Targets Pending</span>
                  <p className="text-muted-foreground/70 max-w-sm">
                    Lock in your first daily, weekly, or monthly milestone above to build peak momentum!
                  </p>
                </div>
              </div>
            ) : (
              activeTargets.map((target) => {
                const remaining = formatRemainingTime(target.deadline);
                const isOverdue = remaining.isOverdue;

                return (
                  <div
                    key={target.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 relative group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                      isOverdue
                        ? 'bg-rose-500/[0.04] border-rose-500/30 hover:border-rose-500/50'
                        : remaining.urgent
                        ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-card border-border hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Completion check button */}
                      <button
                        onClick={() => handleToggleComplete(target.id)}
                        className={`mt-0.5 text-muted-foreground hover:text-emerald-400 transition-colors cursor-pointer shrink-0 ${
                          target.completed ? 'text-emerald-400' : ''
                        }`}
                        title="Mark target as achieved"
                      >
                        {target.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${categoryBadgeColors[target.category || 'general']}`}>
                            {target.category || 'General'}
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-md bg-accent/20 border border-white/5 text-muted-foreground">
                            {target.cadence}
                          </span>
                          {target.resetCount > 0 && (
                            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              Cycle {target.resetCount + 1}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-foreground leading-snug break-words">
                          {target.title}
                        </h4>

                        {target.notes && (
                          <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                            "{target.notes}"
                          </p>
                        )}

                        {/* Motivational failure / overdue banner if deadline passed */}
                        {isOverdue && (
                          <div className="pt-1 text-[11px] text-rose-400 font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Deadline passed without completion. Top rankers reset instantly!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DEADLINE COUNTDOWN & ACTIONS */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Time Remaining Badge */}
                      <div className={`flex items-center gap-1.5 text-xs font-numeric font-bold px-3 py-1 rounded-full border ${
                        isOverdue
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                          : remaining.urgent
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{remaining.text}</span>
                      </div>

                      {/* ACTIONS: Edit & Reset (NO DELETE BUTTON) */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(target)}
                          className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-accent/15 hover:bg-accent/30 rounded-lg border border-white/5 flex items-center gap-1 transition-all cursor-pointer"
                          title="Edit target title or deadline"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>

                        {/* Reset button active when deadline elapsed */}
                        {isOverdue && (
                          <button
                            onClick={() => handleResetTarget(target)}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                            title="Reset this target for the next cycle"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset Cycle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* COMMITMENT FOOTER NOTICE */}
          <div className="pt-2 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground border-t border-white/5 gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Targets cannot be deleted once set. Only edit or conquer. Accountability engine active.</span>
            </span>
            <span className="font-mono text-[10px]">
              {activeTargets.length} active • {completedTargets.length} accomplished
            </span>
          </div>
        </div>
      )}

      {/* RENDER ACHIEVED TAB */}
      {activeTab === 'achieved' && (
        <div className="space-y-4 animate-fade-in">
          {completedTargets.length === 0 ? (
            <div className="py-14 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500/30" />
              <span className="font-bold text-foreground">No Conquered Targets Yet</span>
              <p className="text-muted-foreground/70 max-w-sm text-[11px]">
                Complete your active targets to unlock rank momentum awards and recorded achievements!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTargets.map((target) => (
                <div
                  key={target.id}
                  className="p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${categoryBadgeColors[target.category || 'general']}`}>
                          {target.category || 'General'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold font-numeric flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Accomplished
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground line-through opacity-85">
                        {target.title}
                      </h4>
                      {target.resultMessage && (
                        <p className="text-[11px] text-emerald-300 font-medium leading-relaxed">
                          "{target.resultMessage}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleResetTarget(target)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/35 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Reset for a new study cycle"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-arm for New Cycle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER SCRATCHPAD TAB */}
      {activeTab === 'scratchpad' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span className="font-semibold text-foreground">Formula & Concept Whiteboard</span>
            <span className="text-[10px] font-numeric text-muted-foreground">
              {isSavingScratchpad ? (
                <span className="text-amber-400 font-bold animate-pulse">Auto-saving...</span>
              ) : lastSaved ? (
                <span className="text-emerald-400">Saved at {lastSaved}</span>
              ) : (
                'Continuous auto-save'
              )}
            </span>
          </div>

          <textarea
            value={scratchpadText}
            onChange={(e) => setScratchpadText(e.target.value)}
            placeholder="💡 Jot down formulas, high-yield organic reactions, difficult physics integrations, or daily strategic notes... Saved permanently to your device."
            rows={7}
            className="w-full text-xs font-mono p-4 rounded-2xl bg-card border border-border/80 text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-indigo-500/50 transition-all leading-relaxed resize-none"
          />
        </div>
      )}

      {/* EDIT TARGET MODAL (CRITICAL: Can edit, CANNOT delete!) */}
      <AnimatePresence>
        {editingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-indigo-400" />
                  <h3 className="text-base font-bold text-foreground">Edit Target & Deadline</h3>
                </div>
                <button
                  onClick={() => setEditingTarget(null)}
                  className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3.5 py-2.5 font-medium text-foreground outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as TargetCategory)}
                      className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3 py-2.5 font-medium text-foreground outline-none cursor-pointer"
                    >
                      <option value="general">General</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="math">Mathematics</option>
                      <option value="revision">Revision</option>
                      <option value="mock_test">Mock Test</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Deadline</label>
                    <input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3 py-2 font-medium text-foreground outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Strategy / Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Focus on accuracy over speed..."
                    className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3.5 py-2.5 font-medium text-foreground outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Cannot be deleted. Discipline is commitment.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TargetTracker;
