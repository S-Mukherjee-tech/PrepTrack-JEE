import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, Subject } from '../types';
import { CLASS_11_SYLLABUS, CLASS_12_SYLLABUS } from '../data/syllabus';
import { 
  CheckSquare, 
  Square, 
  Search, 
  BookOpen, 
  Download, 
  Trash2, 
  ArrowUpRight, 
  HelpCircle, 
  Flame, 
  Zap, 
  Layers, 
  Sparkles 
} from 'lucide-react';

interface SyllabusTrackerProps {
  completions: Record<string, boolean>;
  onToggleChapter: (id: string, completed: boolean) => void;
  onClearAll: () => void;
}

const SyllabusChapterItem = memo(function SyllabusChapterItem({
  ch,
  isCompleted,
  onToggleChapter,
}: {
  ch: Chapter;
  isCompleted: boolean;
  onToggleChapter: (id: string, completed: boolean) => void;
}) {
  // Exquisite theme-adaptive color specs for each subject type
  const subjectStyles = {
    physics: {
      stroke: isCompleted ? 'border-l-emerald-500' : 'border-l-indigo-500',
      text: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    },
    chemistry: {
      stroke: isCompleted ? 'border-l-emerald-500' : 'border-l-emerald-500',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    },
    math: {
      stroke: isCompleted ? 'border-l-emerald-500' : 'border-l-purple-500',
      text: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    }
  };
  const currentStyle = subjectStyles[ch.subject] || subjectStyles.physics;

  return (
    <button
      onClick={() => onToggleChapter(ch.id, !isCompleted)}
      className={`p-3.5 rounded-xl border border-l-4 text-left cursor-pointer flex items-start gap-3 select-none transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] ${currentStyle.stroke} ${
        isCompleted
          ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/8 hover:border-emerald-500/50 shadow-xs'
          : 'bg-card border-border/80 hover:bg-accent/15 hover:border-accent/80 shadow-2xs'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckSquare className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
        ) : (
          <Square className="w-4 h-4 text-muted-foreground/60" />
        )}
      </div>

      <div className="space-y-1.5 flex-1 min-w-0">
        <span className={`text-xs font-semibold block leading-tight truncate ${isCompleted ? 'text-emerald-400 line-through opacity-75' : 'text-foreground'}`}>
          {ch.name}
        </span>
        
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${currentStyle.badgeBg}`}>
            {ch.subject}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">Class {ch.classLevel}</span>
          {ch.weightage === 'high' && (
            <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-rose-400" /> High Yield
            </span>
          )}
          {ch.weightage === 'medium' && (
            <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400" /> Medium
            </span>
          )}
          {ch.weightage === 'low' && (
            <span className="text-[9px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Layers className="w-2.5 h-2.5 text-sky-400" /> Standard
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

const SyllabusTracker = memo(function SyllabusTracker({ completions, onToggleChapter, onClearAll }: SyllabusTrackerProps) {
  const [activeClass, setActiveClass] = useState<'all' | '11' | '12'>('all');
  const [activeSubject, setActiveSubject] = useState<'all' | Subject>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusHighYield, setFocusHighYield] = useState(false);

  const fullSyllabus = useMemo(() => {
    return [...CLASS_11_SYLLABUS, ...CLASS_12_SYLLABUS];
  }, []);

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    return fullSyllabus.filter((ch) => {
      const matchClass = activeClass === 'all' || ch.classLevel === activeClass;
      const matchSubject = activeSubject === 'all' || ch.subject === activeSubject;
      const matchSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchHighYield = !focusHighYield || ch.weightage === 'high';
      return matchClass && matchSubject && matchSearch && matchHighYield;
    });
  }, [fullSyllabus, activeClass, activeSubject, searchQuery, focusHighYield]);

  // Total syllabus stats
  const stats = useMemo(() => {
    const total = fullSyllabus.length;
    const completed = fullSyllabus.filter((ch) => completions[ch.id]).length;
    const pct = total > 0 ? (completed / total) * 100 : 0;

    const class11Total = CLASS_11_SYLLABUS.length;
    const class11Completed = CLASS_11_SYLLABUS.filter((ch) => completions[ch.id]).length;
    const class11Pct = class11Total > 0 ? (class11Completed / class11Total) * 105 / 1.05 : 0; // wait, let's keep clean arithmetic

    return {
      total,
      completed,
      pct,
      class11Total,
      class11Completed,
      class12Total: CLASS_12_SYLLABUS.length,
      class12Completed: CLASS_12_SYLLABUS.filter((ch) => completions[ch.id]).length,
    };
  }, [fullSyllabus, completions]);

  const handleDownloadSyllabus = (type: 'main' | 'advanced') => {
    const path = type === 'main'
      ? 'syllabus/JEE_Main_Syllabus_2026.pdf'
      : 'syllabus/JEE_Advanced_Syllabus_2026.pdf';
    
    // Trigger download
    const link = document.createElement('a');
    link.href = path;
    link.download = type === 'main' ? 'JEE_Main_Syllabus_2026.pdf' : 'JEE_Advanced_Syllabus_2026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
      
      {/* Syllabus Header and percentage bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-sans tracking-tight">JEE Syllabus Progress Tracker</h3>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full uppercase">NCERT Core</span>
          </div>
          <p className="text-xs text-muted-foreground">Monitor topic-by-topic completion dynamically across Class 11 & 12</p>
        </div>

        {/* Global Progress Radial/Bar card */}
        <div className="bg-accent/15 border border-border p-4 rounded-2xl flex items-center gap-4 min-w-[245px]">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" className="text-border/40" fill="transparent" />
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3.5" className="text-indigo-500 transition-all duration-500" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - stats.pct / 100)}`} fill="transparent" />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-foreground">{Math.round(stats.pct)}%</span>
          </div>

          <div className="space-y-0.5">
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Overall Syllabus Done</span>
            <span className="text-sm font-bold font-mono text-indigo-500">{stats.completed} <span className="text-muted-foreground text-xs font-normal">/ {stats.total} Chapters</span></span>
          </div>
        </div>
      </div>

      {/* Control Actions & Filter Header */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch">
        
        {/* Search and subject selectors */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] bg-accent/20 border border-border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search syllabus chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs outline-none text-foreground w-full placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Class Filter */}
          <div className="flex bg-accent/15 border border-border rounded-xl p-1 text-xs gap-1">
            {(['all', '11', '12'] as const).map((cl) => (
              <button
                key={cl}
                onClick={() => setActiveClass(cl)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-all ${
                  activeClass === cl
                    ? 'bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]'
                    : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
                }`}
              >
                {cl === 'all' ? 'All Classes' : `Class ${cl}`}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex bg-accent/15 border border-border rounded-xl p-1 text-xs gap-1">
            {(['all', 'physics', 'chemistry', 'math'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-all ${
                  activeSubject === sub
                    ? 'bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]'
                    : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* High Yield Filter */}
          <button
            onClick={() => setFocusHighYield(!focusHighYield)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              focusHighYield
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-xs'
                : 'bg-accent/15 border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent/30'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${focusHighYield ? 'text-amber-400' : 'text-muted-foreground'}`} />
            High-Yield Focus (35%)
          </button>
        </div>

        {/* Download links */}
        <div className="flex bg-accent/10 border border-border/70 rounded-2xl p-1.5 items-center gap-2 lg:self-start xl:self-auto shrink-0">
          <button
            onClick={() => handleDownloadSyllabus('main')}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-400 hover:text-white cursor-pointer bg-card hover:bg-indigo-600 px-3 py-1.5 rounded-xl border border-border/80 hover:border-indigo-500 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" /> Main Syllabus
          </button>
          <button
            onClick={() => handleDownloadSyllabus('advanced')}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 hover:text-white cursor-pointer bg-card hover:bg-emerald-600 px-3 py-1.5 rounded-xl border border-border/80 hover:border-emerald-500 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" /> Adv Syllabus
          </button>
        </div>

      </div>

      {/* Chapters Grid view */}
      {filteredChapters.length === 0 ? (
        <div className="text-center py-12 bg-accent/10 rounded-2xl border border-border border-dashed">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <span className="block text-xs font-semibold text-muted-foreground">No matches found for active filters</span>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Try resetting search string or class selectors</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 dashboard-card-gpu">
          {filteredChapters.map((ch) => (
            <SyllabusChapterItem
              key={ch.id}
              ch={ch}
              isCompleted={completions[ch.id] || false}
              onToggleChapter={onToggleChapter}
            />
          ))}
        </div>
      )}

      {/* NCERT statement and Clear Checked Chapter buttons */}
      <div className="border-t border-border/50 pt-5 flex flex-wrap gap-4 items-center justify-between">
        <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> Syllabus curriculum is completely configured based on active NCERT patterns.
        </span>

        <button
          onClick={onClearAll}
          className="text-xs font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/25 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Ticked Syllabus
        </button>
      </div>

    </div>
  );
});

export default SyllabusTracker;
