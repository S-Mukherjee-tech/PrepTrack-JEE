import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject, ErrorBookItem, SpecialImportanceItem } from '../types';
import { Trash2, AlertCircle, BookOpen, Star, Sparkles, Filter, Plus, Check } from 'lucide-react';
import { sanitizeInput, limitStringLength } from '../utils/security';

interface NotesAndErrorsProps {
  errorItems: ErrorBookItem[];
  importanceItems: SpecialImportanceItem[];
  onAddErrorItem: (item: ErrorBookItem) => void;
  onDeleteErrorItem: (id: string) => void;
  onAddImportanceItem: (item: SpecialImportanceItem) => void;
  onDeleteImportanceItem: (id: string) => void;
}

const NotesAndErrors = memo(function NotesAndErrors({
  errorItems,
  importanceItems,
  onAddErrorItem,
  onDeleteErrorItem,
  onAddImportanceItem,
  onDeleteImportanceItem,
}: NotesAndErrorsProps) {
  const [activeTab, setActiveTab] = useState<'error' | 'special'>('error');
  const [subjectFilter, setSubjectFilter] = useState<'all' | Subject>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [tagFilter, setTagFilter] = useState<'all' | string>('all');

  // New Error Item form states
  const [errSubject, setErrSubject] = useState<Subject>('physics');
  const [errChapter, setErrChapter] = useState('');
  const [errMistake, setErrMistake] = useState('');
  const [errCorrection, setErrCorrection] = useState('');
  const [errDifficulty, setErrDifficulty] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [errTags, setErrTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showErrorForm, setShowErrorForm] = useState(false);

  // New Special Importance Form states
  const [impSubject, setImpSubject] = useState<Subject>('physics');
  const [impTitle, setImpTitle] = useState('');
  const [impTopic, setImpTopic] = useState('');
  const [impContent, setImpContent] = useState('');
  const [showImpForm, setShowImpForm] = useState(false);

  // Get all unique tags from error items for filtering
  const allExistingTags = useMemo(() => {
    const tagsSet = new Set<string>();
    errorItems.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag) => {
          if (tag.trim()) tagsSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagsSet);
  }, [errorItems]);

  // Filtered lists
  const filteredErrors = useMemo(() => {
    return errorItems.filter((item) => {
      const matchSubject = subjectFilter === 'all' || item.subject === subjectFilter;
      const matchDifficulty = difficultyFilter === 'all' || item.difficulty === difficultyFilter;
      const matchTag = tagFilter === 'all' || (item.tags && item.tags.includes(tagFilter));
      return matchSubject && matchDifficulty && matchTag;
    });
  }, [errorItems, subjectFilter, difficultyFilter, tagFilter]);

  const filteredImportance = useMemo(() => {
    return importanceItems.filter((item) => subjectFilter === 'all' || item.subject === subjectFilter);
  }, [importanceItems, subjectFilter]);

  const togglePresetTag = (tag: string) => {
    if (errTags.includes(tag)) {
      setErrTags(errTags.filter((t) => t !== tag));
    } else {
      setErrTags([...errTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !errTags.includes(trimmed)) {
      setErrTags([...errTags, trimmed]);
      setTagInput('');
    }
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleCreateErrorItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errChapter.trim() || !errMistake.trim() || !errCorrection.trim()) {
      alert('Please fill out all the item fields.');
      return;
    }

    const newItem: ErrorBookItem = {
      id: `err_${Date.now()}_` + Math.floor(Math.random() * 100),
      subject: errSubject,
      chapter: limitStringLength(sanitizeInput(errChapter.trim()), 200),
      mistake: limitStringLength(sanitizeInput(errMistake.trim()), 2000),
      correction: limitStringLength(sanitizeInput(errCorrection.trim()), 2000),
      timestamp: Date.now(),
      difficulty: errDifficulty,
      tags: errTags.length > 0 ? errTags.map(t => limitStringLength(sanitizeInput(t.trim()), 50)) : undefined,
    };

    onAddErrorItem(newItem);
    setErrChapter('');
    setErrMistake('');
    setErrCorrection('');
    setErrDifficulty(undefined);
    setErrTags([]);
    setTagInput('');
    setShowErrorForm(false);
  };

  const handleCreateImportanceItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!impTitle.trim() || !impContent.trim() || !impTopic.trim()) {
      alert('Please fill out all the fields.');
      return;
    }

    const newItem: SpecialImportanceItem = {
      id: `imp_${Date.now()}_` + Math.floor(Math.random() * 105),
      subject: impSubject,
      title: limitStringLength(sanitizeInput(impTitle.trim()), 300),
      topic: limitStringLength(sanitizeInput(impTopic.trim()), 200),
      content: limitStringLength(sanitizeInput(impContent.trim()), 5000),
      timestamp: Date.now(),
    };

    onAddImportanceItem(newItem);
    setImpTitle('');
    setImpTopic('');
    setImpContent('');
    setShowImpForm(false);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
      
      {/* Tab Switchers and Subject Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between border-b border-border/60 pb-5">
        <div className="flex bg-accent/20 border border-border p-1 rounded-xl text-xs gap-1.5 self-start">
          <button
            onClick={() => setActiveTab('error')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'error'
                ? 'bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]'
                : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-500" /> Error Book (Mistakes Log)
          </button>
          
          <button
            onClick={() => setActiveTab('special')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'special'
                ? 'bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]'
                : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500/10" /> Special Importance Book
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-500" /> Filter Subject:
          </span>

          <div className="flex flex-wrap bg-accent/15 border border-border rounded-xl p-1 text-xs gap-1">
            {(['all', 'physics', 'chemistry', 'math', 'general'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-all ${
                  subjectFilter === sub
                    ? 'bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]'
                    : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
                }`}
              >
                {sub === 'general' ? 'general / common' : sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ERROR BOOK TAB */}
      {activeTab === 'error' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Log Your Mistake Patterns
              </span>
              <p className="text-[11px] text-muted-foreground">JEE is won by correcting errors. Review this book before exams to identify and tackle repeating traps.</p>
            </div>

            <button
              onClick={() => setShowErrorForm(!showErrorForm)}
              className="bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white font-bold text-xs py-2 px-4 rounded-xl border border-rose-500/20 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> {showErrorForm ? 'Close Editor' : 'Log New Mistake'}
            </button>
          </div>

          {/* Form to log error */}
          {showErrorForm && (
            <form onSubmit={handleCreateErrorItem} className="bg-accent/10 border border-border/80 rounded-2xl p-5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <h4 className="text-sm font-bold text-foreground">Log Mistake & Trap Info</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="err-subject-select" className="block text-xs font-semibold text-muted-foreground mb-1">Subject</label>
                  <select
                    id="err-subject-select"
                    value={errSubject}
                    onChange={(e) => setErrSubject(e.target.value as Subject)}
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50"
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="math">Math</option>
                    <option value="general">General / Common</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Topic / Chapter Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ionic Equilibrium solubility traps"
                    value={errChapter}
                    onChange={(e) => setErrChapter(e.target.value)}
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Difficulty Rating <span className="text-[10px] font-normal text-muted-foreground/60">(Optional)</span></label>
                  <div className="flex bg-card border border-border rounded-lg p-0.5 text-xs h-[34px] items-center">
                    {(['low', 'medium', 'high'] as const).map((level) => {
                      const isActive = errDifficulty === level;
                      const activeColors = {
                        low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                        medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                        high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                      };
                      return (
                        <button
                          type="button"
                          key={level}
                          onClick={() => setErrDifficulty(errDifficulty === level ? undefined : level)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all select-none cursor-pointer ${
                            isActive
                              ? `${activeColors[level]} border font-black`
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Specific Mistake / Crux of Trap</label>
                <textarea
                  required
                  placeholder="e.g. Forgot standard negative sign in entropy values, or missed the volume expansion variable."
                  value={errMistake}
                  onChange={(e) => setErrMistake(e.target.value)}
                  className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 h-20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Correct Approach / Key Concept Formula</label>
                <textarea
                  required
                  placeholder="e.g. Always take initial molar values to compute Ksp. Let S = Solubility, carefully double check exponents."
                  value={errCorrection}
                  onChange={(e) => setErrCorrection(e.target.value)}
                  className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 h-20 outline-none"
                />
              </div>

              {/* Tag labels input field */}
              <div className="space-y-3 bg-accent/5 p-3 rounded-xl border border-border/60">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-foreground">
                    Labels / Mistake Classification Tags
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Classify your mistake to track and filter your specific weaknesses effectively.
                  </span>
                </div>

                {/* Selected tags list */}
                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                  {errTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg text-xs font-semibold"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setErrTags(errTags.filter((t) => t !== tag))}
                        className="text-muted-foreground hover:text-rose-400 font-bold ml-1 hover:scale-110 active:scale-95 transition-all text-[11px] cursor-pointer"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {errTags.length === 0 && (
                    <span className="text-[11px] text-muted-foreground/50 italic font-mono">No labels selected yet</span>
                  )}
                </div>

                {/* Preset suggestions */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">Quick Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Conceptual', 'Silly Mistake', 'Calculation', 'Formula Error', 'Time Pressure', 'Reading Error'].map((preset) => {
                      const isSelected = errTags.includes(preset);
                      return (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => togglePresetTag(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-card border-border/80 text-muted-foreground hover:border-indigo-400/50 hover:text-foreground'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type custom label tag and press Enter/Add"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDownTag}
                    className="flex-1 bg-card border border-border text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="bg-accent/30 hover:bg-accent/50 border border-border text-foreground font-semibold text-xs px-3 rounded-lg cursor-pointer transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowErrorForm(false)}
                  className="border border-border text-muted-foreground hover:bg-card text-xs py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-5 rounded-xl"
                >
                  Save to Error Book
                </button>
              </div>
            </form>
          )}

          {/* Difficulty & Tag Filter Bar */}
          {errorItems.length > 0 && (
            <div className="flex flex-col gap-3 text-xs border-b border-border/40 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                    <Filter className="w-3 h-3 text-rose-500" /> Difficulty:
                  </span>
                  <div className="flex bg-accent/15 border border-border rounded-lg p-1 gap-1 flex-wrap">
                    {(['all', 'low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficultyFilter(level)}
                        className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase cursor-pointer transition-all ${
                          difficultyFilter === level
                            ? 'bg-primary text-primary-foreground shadow-xs scale-[1.01]'
                            : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Showing {filteredErrors.length} of {errorItems.length} logged traps
                </div>
              </div>

              {/* Tags filter row */}
              {allExistingTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/10">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                    <Filter className="w-3 h-3 text-indigo-500" /> Weakness Label:
                  </span>
                  <div className="flex flex-wrap gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => setTagFilter('all')}
                      className={`px-2.5 py-1 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        tagFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-indigo-400 hover:bg-accent/35 hover:border-border/60'
                      }`}
                    >
                      All Labels
                    </button>
                    {allExistingTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagFilter(tag)}
                        className={`px-2.5 py-1 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                          tagFilter === tag
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-accent/10 border border-border/30 text-muted-foreground hover:text-indigo-400 hover:bg-accent/35 hover:border-border/60'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List display */}
          {filteredErrors.length === 0 ? (
            <div className="text-center py-10 bg-accent/5 border border-border border-dashed rounded-2xl">
              <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <span className="block text-xs font-semibold text-muted-foreground">Error Journal Empty</span>
              <p className="text-[10px] text-muted-foreground/50 mt-1">No logged traps recorded representing this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 dashboard-card-gpu">
              {filteredErrors.map((item) => (
                <div
                  key={item.id}
                  className="border border-border bg-card hover:border-rose-400/20 active:scale-[0.99] transition-all duration-150 p-4 rounded-2xl space-y-3 relative group"
                >
                  <button
                    onClick={() => onDeleteErrorItem(item.id)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                    title="Delete record"
                    aria-label="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        item.subject === 'physics' ? 'bg-indigo-500/10 text-indigo-500' :
                        item.subject === 'chemistry' ? 'bg-emerald-500/10 text-emerald-500' :
                        item.subject === 'math' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                      }`}>
                        {item.subject === 'general' ? 'general / common' : item.subject}
                      </span>
                      {item.difficulty && (
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                          item.difficulty === 'low' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          item.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {item.difficulty}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Display Item Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="bg-indigo-500/5 border border-indigo-500/15 text-[10px] font-semibold text-indigo-400 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h5 className="text-xs font-bold text-foreground pr-6 leading-tight pt-0.5">{item.chapter}</h5>
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-border/50 pt-2.5 text-xs">
                    <div className="bg-rose-500/5 border border-rose-500/10 p-2 rounded-xl">
                      <span className="block text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">⚠️ The Mistake</span>
                      <p className="text-muted-foreground font-medium leading-relaxed">{item.mistake}</p>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl">
                      <span className="block text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">✅ Corrective Formula / Crux</span>
                      <p className="text-muted-foreground font-medium leading-relaxed">{item.correction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SPECIAL IMPORTANCE BOOK TAB */}
      {activeTab === 'special' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Capture Core Formulas & Shortcuts
              </span>
              <p className="text-[11px] text-muted-foreground">Store vital theorems, tricks, formulas, or tricky derivations of high priority.</p>
            </div>

            <button
              onClick={() => setShowImpForm(!showImpForm)}
              className="bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white font-bold text-xs py-2 px-4 rounded-xl border border-amber-500/20 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> {showImpForm ? 'Close Editor' : 'Record Concept'}
            </button>
          </div>

          {/* Form to log concept */}
          {showImpForm && (
            <form onSubmit={handleCreateImportanceItem} className="bg-accent/10 border border-border/80 rounded-2xl p-5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <h4 className="text-sm font-bold text-foreground">Record Special Concept formula</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="imp-subject-select" className="block text-xs font-semibold text-muted-foreground mb-1">Subject</label>
                  <select
                    id="imp-subject-select"
                    value={impSubject}
                    onChange={(e) => setImpSubject(e.target.value as Subject)}
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 focus:border-amber-500/50"
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="math">Math</option>
                    <option value="general">General / Common</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Chapter / Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Conic Sections - Tangents"
                    value={impTopic}
                    onChange={(e) => setImpTopic(e.target.value)}
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Title / Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T=S1 locus property parameters"
                    value={impTitle}
                    onChange={(e) => setImpTitle(e.target.value)}
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Note / Concept explanation / Formulas</label>
                <textarea
                  required
                  placeholder="e.g. Equation of tangent to parabola y^2=4ax is T=0 => yy1 = 2a(x+x1). Useful shortcut for normal derivations."
                  value={impContent}
                  onChange={(e) => setImpContent(e.target.value)}
                  className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 h-24 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowImpForm(false)}
                  className="border border-border text-muted-foreground hover:bg-card text-xs py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 px-5 rounded-xl"
                >
                  Record to Importance Book
                </button>
              </div>
            </form>
          )}

          {/* List display */}
          {filteredImportance.length === 0 ? (
            <div className="text-center py-10 bg-accent/5 border border-border border-dashed rounded-2xl">
              <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <span className="block text-xs font-semibold text-muted-foreground">Importance Notes Empty</span>
              <p className="text-[10px] text-muted-foreground/50 mt-1">No recorded high importance concepts represent this subject.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 dashboard-card-gpu">
              {filteredImportance.map((item) => (
                <div
                  key={item.id}
                  className="border border-border bg-card hover:border-amber-400/20 active:scale-[0.99] transition-all duration-150 p-4 rounded-2xl relative group flex flex-col justify-between"
                >
                  <div>
                    <button
                      onClick={() => onDeleteImportanceItem(item.id)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                      title="Delete record"
                      aria-label="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex gap-2 items-center">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.subject === 'physics' ? 'bg-indigo-500/10 text-indigo-500' :
                          item.subject === 'chemistry' ? 'bg-emerald-500/10 text-emerald-500' :
                          item.subject === 'math' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                        }`}>
                          {item.subject === 'general' ? 'general / common' : item.subject}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">{item.topic}</span>
                      </div>
                      <h5 className="text-xs font-bold text-foreground pr-6 leading-tight flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {item.title}
                      </h5>
                    </div>

                    <div className="mt-3 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-xs">
                      <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-line">{item.content}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-[9px] font-mono text-muted-foreground text-right">
                    {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
});

export default NotesAndErrors;
