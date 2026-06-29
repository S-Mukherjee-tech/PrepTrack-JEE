import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject, ErrorBookItem, SpecialImportanceItem } from '../types';
import { Trash2, AlertCircle, BookOpen, Star, Sparkles, Filter, Plus, Check } from 'lucide-react';

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

  // New Error Item form states
  const [errSubject, setErrSubject] = useState<Subject>('physics');
  const [errChapter, setErrChapter] = useState('');
  const [errMistake, setErrMistake] = useState('');
  const [errCorrection, setErrCorrection] = useState('');
  const [showErrorForm, setShowErrorForm] = useState(false);

  // New Special Importance Form states
  const [impSubject, setImpSubject] = useState<Subject>('physics');
  const [impTitle, setImpTitle] = useState('');
  const [impTopic, setImpTopic] = useState('');
  const [impContent, setImpContent] = useState('');
  const [showImpForm, setShowImpForm] = useState(false);

  // Filtered lists
  const filteredErrors = useMemo(() => {
    return errorItems.filter((item) => subjectFilter === 'all' || item.subject === subjectFilter);
  }, [errorItems, subjectFilter]);

  const filteredImportance = useMemo(() => {
    return importanceItems.filter((item) => subjectFilter === 'all' || item.subject === subjectFilter);
  }, [importanceItems, subjectFilter]);

  const handleCreateErrorItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errChapter.trim() || !errMistake.trim() || !errCorrection.trim()) {
      alert('Please fill out all the item fields.');
      return;
    }

    const newItem: ErrorBookItem = {
      id: `err_${Date.now()}_` + Math.floor(Math.random() * 100),
      subject: errSubject,
      chapter: errChapter.trim(),
      mistake: errMistake.trim(),
      correction: errCorrection.trim(),
      timestamp: Date.now(),
    };

    onAddErrorItem(newItem);
    setErrChapter('');
    setErrMistake('');
    setErrCorrection('');
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
      title: impTitle.trim(),
      topic: impTopic.trim(),
      content: impContent.trim(),
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
        <div className="flex bg-accent/20 border border-border p-0.5 rounded-xl text-xs gap-1 self-start">
          <button
            onClick={() => setActiveTab('error')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'error'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-500" /> Error Book (Mistakes Log)
          </button>
          
          <button
            onClick={() => setActiveTab('special')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'special'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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

          <div className="flex bg-accent/15 border border-border rounded-xl p-0.5 text-xs">
            {(['all', 'physics', 'chemistry', 'math'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-all ${
                  subjectFilter === sub
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sub}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="err-subject-select" className="block text-xs font-semibold text-muted-foreground mb-1">Subject</label>
                  <select
                    id="err-subject-select"
                    value={errSubject}
                    onChange={(e) => setErrSubject(e.target.value as Subject)}
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2"
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="math">Math</option>
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

          {/* List display */}
          {filteredErrors.length === 0 ? (
            <div className="text-center py-10 bg-accent/5 border border-border border-dashed rounded-2xl">
              <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <span className="block text-xs font-semibold text-muted-foreground">Error Journal Empty</span>
              <p className="text-[10px] text-muted-foreground/50 mt-1">No logged traps recorded representing this subject.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filteredErrors.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -12 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    className="border border-border bg-card hover:border-rose-400/20 active-scale-99.5 p-4 rounded-2xl space-y-3 relative group"
                  >
                    <button
                      onClick={() => onDeleteErrorItem(item.id)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                      title="Delete record"
                      aria-label="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1">
                      <div className="flex gap-2 items-center">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.subject === 'physics' ? 'bg-indigo-500/10 text-indigo-500' :
                          item.subject === 'chemistry' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-foreground pr-6 leading-tight">{item.chapter}</h5>
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
                  </motion.div>
                ))}
              </AnimatePresence>
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
                    className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2"
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="math">Math</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filteredImportance.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -12 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    className="border border-border bg-card hover:border-amber-400/20 active-scale-99.5 p-4 rounded-2xl relative group flex flex-col justify-between"
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
                            'bg-purple-500/10 text-purple-500'
                          }`}>
                            {item.subject}
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

    </div>
  );
});

export default NotesAndErrors;
