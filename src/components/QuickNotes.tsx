import { useState, useEffect, useRef, KeyboardEvent, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, CheckCircle2, Circle, ListTodo, Sparkles, FileText, Check, Edit3, Save, Clock } from 'lucide-react';
import { secureJsonParse, sanitizeInput, limitStringLength, secureStorage } from '../utils/security';

interface QuickNote {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
}

interface QuickNotesProps {
  theme: 'slate' | 'cyber' | 'light' | 'glass';
  cardBgClass: string;
}

const QuickNotes = memo(function QuickNotes({ theme, cardBgClass }: QuickNotesProps) {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // New Auto-saving Scratchpad State
  const [scratchpadText, setScratchpadText] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'scratchpad'>('tasks');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Note inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [loaded, setLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = secureStorage.getItem('preptrack_quick_notes');
      setNotes(secureJsonParse<QuickNote[]>(saved, []));
      
      const savedScratchpad = secureStorage.getItem('preptrack_quick_notes_scratchpad');
      if (savedScratchpad) {
        setScratchpadText(limitStringLength(sanitizeInput(savedScratchpad), 10000));
      }

      const savedDraft = secureStorage.getItem('preptrack_quick_notes_draft');
      if (savedDraft) {
        setInputText(limitStringLength(sanitizeInput(savedDraft), 1000));
      }
    } catch (e) {
      console.error('Failed to load quick notes from local storage:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save to local storage when notes change (Debounced to avoid storage lag on typing)
  useEffect(() => {
    if (!loaded) return;

    const timer = setTimeout(() => {
      try {
        secureStorage.setItem('preptrack_quick_notes', JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to save quick notes:', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [notes, loaded]);

  // Debounced auto-save for the input draft text
  useEffect(() => {
    if (!loaded) return;

    const timer = setTimeout(() => {
      try {
        if (inputText) {
          secureStorage.setItem('preptrack_quick_notes_draft', inputText);
        } else {
          secureStorage.removeItem('preptrack_quick_notes_draft');
        }
      } catch (e) {
        console.error('Failed to save quick draft:', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText, loaded]);

  // Save to local storage when notes change
  const saveNotes = (updatedNotes: QuickNote[]) => {
    setNotes(updatedNotes);
  };

  // Auto-save the input draft text as the user types
  const handleInputChange = (val: string) => {
    setInputText(val);
  };

  // Debounced auto-save for the freeform whiteboard scratchpad
  useEffect(() => {
    if (!loaded) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        secureStorage.setItem('preptrack_quick_notes_scratchpad', scratchpadText);
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        console.error('Failed to auto-save scratchpad:', e);
      } finally {
        setIsSaving(false);
      }
    }, 500); // 500ms debounce after typing ceases

    return () => clearTimeout(timer);
  }, [scratchpadText, loaded]);

  const handleAddNote = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const safeText = limitStringLength(sanitizeInput(trimmed), 1000);
    const newNote: QuickNote = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      text: safeText,
      completed: false,
      timestamp: Date.now(),
    };

    saveNotes([newNote, ...notes]);
    setInputText('');
    try {
      secureStorage.removeItem('preptrack_quick_notes_draft');
    } catch {
      // Ignore
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddNote();
    }
  };

  const handleToggleComplete = (id: string) => {
    const updated = notes.map((note) =>
      note.id === id ? { ...note, completed: !note.completed } : note
    );
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((note) => note.id !== id);
    saveNotes(updated);
  };

  const handleClearCompleted = () => {
    const updated = notes.filter((note) => !note.completed);
    saveNotes(updated);
  };

  // Inline Note Editor
  const startEditing = (note: QuickNote) => {
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const saveInlineEdit = (id: string) => {
    if (!editingText.trim()) {
      handleDeleteNote(id);
    } else {
      const updated = notes.map((note) =>
        note.id === id ? { ...note, text: editingText.trim() } : note
      );
      saveNotes(updated);
    }
    setEditingId(null);
  };

  const handleInlineEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveInlineEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Auto-save edited notes on change as well
  const handleInlineTextChange = (text: string, id: string) => {
    setEditingText(text);
    // Instant update to list for responsive feel
    const updated = notes.map((note) =>
      note.id === id ? { ...note, text: text } : note
    );
    saveNotes(updated);
  };

  const filteredNotes = notes.filter((note) => {
    if (filter === 'active') return !note.completed;
    if (filter === 'completed') return note.completed;
    return true;
  });

  // Theme styling helpers
  const activeBadgeColor = 
    theme === 'cyber' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
    theme === 'light' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
    theme === 'slate' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
    'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';

  const buttonHoverColor = 
    theme === 'cyber' ? 'hover:bg-emerald-500/20 text-emerald-400' :
    theme === 'light' ? 'hover:bg-rose-500/20 text-rose-600' :
    theme === 'slate' ? 'hover:bg-cyan-500/20 text-cyan-400' :
    'hover:bg-indigo-500/25 text-[#6366f1]';

  const inputBorderFocus = 
    theme === 'cyber' ? 'focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/35' :
    theme === 'light' ? 'focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/35' :
    theme === 'slate' ? 'focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/35' :
    'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/35';

  const activeTabAccent = 
    theme === 'cyber' ? 'bg-emerald-500 text-black font-extrabold shadow-sm' :
    theme === 'light' ? 'bg-rose-500 text-white font-bold shadow-sm' :
    theme === 'slate' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' :
    'bg-indigo-650 text-white font-bold shadow-sm';

  const accentColorText = 
    theme === 'cyber' ? 'text-emerald-400' :
    theme === 'light' ? 'text-rose-500' :
    theme === 'slate' ? 'text-cyan-400' :
    'text-[#6366f1]';

  const outlineBorder = 
    theme === 'cyber' ? 'border-emerald-500/20' :
    theme === 'light' ? 'border-rose-500/20' :
    theme === 'slate' ? 'border-cyan-500/20' :
    'border-border';

  return (
    <div className={`rounded-3xl p-6 shadow-sm border border-border ${cardBgClass} dashboard-card-gpu`}>
      
      {/* HEADER TABS SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4.5 mb-5 select-none">
        <div className="flex items-center gap-2">
          <div className="flex bg-accent/15 dark:bg-black/30 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-sans cursor-pointer ${
                activeTab === 'tasks'
                  ? activeTabAccent
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Reminders List</span>
            </button>
            <button
              onClick={() => setActiveTab('scratchpad')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-sans cursor-pointer ${
                activeTab === 'scratchpad'
                  ? activeTabAccent
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Freeform Scratchpad</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Status indicators */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {activeTab === 'tasks' ? (
            <div className="flex items-center gap-1 bg-accent/15 dark:bg-black/30 p-1 rounded-xl border border-white/5">
              {(['all', 'active', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-lg transition-all font-mono leading-none cursor-pointer ${
                    filter === tab
                      ? theme === 'cyber' ? 'bg-emerald-500/20 text-emerald-400' :
                        theme === 'light' ? 'bg-rose-500/20 text-rose-600' :
                        theme === 'slate' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-indigo-500/20 text-[#6366f1]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              {isSaving ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-400 font-extrabold">Auto-saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-medium">Auto-saved at {lastSaved}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span>Continuous database auto-save</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="transition-all duration-150">
        {activeTab === 'tasks' ? (
          <div className="space-y-4 animate-fade-in">
            {/* Input area with auto-saving draft */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type quick task or reminder... (auto-saved draft)"
                className={`flex-1 text-xs px-4 py-3 rounded-xl bg-accent/15 border ${outlineBorder} text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all ${inputBorderFocus}`}
              />
              <button
                onClick={handleAddNote}
                className={`p-3 rounded-xl bg-accent/15 border ${outlineBorder} transition-all cursor-pointer ${buttonHoverColor}`}
                title="Add Reminder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 dashboard-card-gpu">
              {filteredNotes.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground/30 animate-pulse" />
                  <span>
                    {filter === 'completed'
                      ? 'No completed tasks yet.'
                      : filter === 'active'
                      ? 'All tasks completed! Masterclass status.'
                      : 'Your dynamic workspace is ready. Jot a reminder above!'}
                  </span>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`flex items-start justify-between p-3 rounded-xl bg-accent/5 dark:bg-white/[0.02] border ${outlineBorder} hover:bg-accent/10 dark:hover:bg-white/[0.04] transition-all duration-150 active:scale-[0.99] group`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                      <button
                        onClick={() => handleToggleComplete(note.id)}
                        className={`text-muted-foreground mt-0.5 transition-colors cursor-pointer shrink-0 ${
                          note.completed
                            ? 'text-emerald-500'
                            : theme === 'cyber'
                            ? 'hover:text-emerald-400'
                            : 'hover:text-[#6366f1]'
                        }`}
                        aria-label={note.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {note.completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      
                      {editingId === note.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => handleInlineTextChange(e.target.value, note.id)}
                          onKeyDown={(e) => handleInlineEditKeyDown(e, note.id)}
                          onBlur={() => saveInlineEdit(note.id)}
                          autoFocus
                          className={`flex-1 text-xs text-foreground bg-accent/25 px-2.5 py-1 rounded-lg border-2 ${outlineBorder} focus:outline-none ${inputBorderFocus}`}
                        />
                      ) : (
                        <span
                          className={`text-xs leading-relaxed break-words min-w-0 flex-1 pr-2 cursor-text select-text ${
                            note.completed
                              ? 'text-muted-foreground line-through opacity-60'
                              : 'text-foreground'
                          }`}
                          onDoubleClick={() => startEditing(note)}
                          title="Double-click to edit line"
                        >
                          {note.text}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground shrink-0 select-none">
                      {editingId === note.id ? (
                        <button
                          onClick={() => saveInlineEdit(note.id)}
                          className="text-emerald-400 hover:text-emerald-300 p-1 rounded-lg cursor-pointer transition-all"
                          title="Save changes"
                          aria-label="Save changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditing(note)}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-foreground p-1 rounded-lg cursor-pointer transition-all"
                          title="Edit reminder"
                          aria-label="Edit reminder"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-rose-500 p-1 rounded-lg cursor-pointer transition-all"
                        title="Delete"
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer counts */}
            {notes.length > 0 && (
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-white/5 pt-3 select-none">
                <span>
                  {notes.filter((n) => !n.completed).length} pending • {notes.filter((n) => n.completed).length} completed
                </span>
                {notes.some((n) => n.completed) && (
                  <button
                    onClick={handleClearCompleted}
                    className="hover:text-rose-500 tracking-wide font-extrabold uppercase transition-colors cursor-pointer"
                  >
                    Clear Completed
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Whiteboard / Freeform Text Area */}
            <div className="relative">
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="💡 Click here to write down formulas, high-yield topics, complex equations, or overall daily reminders... 
Changes are saved to the persistent database automatically as you type."
                rows={7}
                className={`w-full text-xs font-mono p-4 rounded-2xl bg-accent/15 border ${outlineBorder} text-foreground placeholder:text-muted-foreground/45 focus:outline-none transition-all leading-relaxed resize-none ${inputBorderFocus}`}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 pointer-events-none select-none text-[9px] font-mono text-muted-foreground tracking-wider">
                <Clock className="w-2.5 h-2.5" />
                <span>{scratchpadText.length} chars</span>
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-relaxed italic pl-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              Protip: Double-click items under the "Reminders List" tab to edit them inline. Notes in both tabs are persistent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default QuickNotes;
