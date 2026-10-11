import { useState, useEffect, memo } from 'react';
import { DailyQuestions } from '../types';
import { Hash, Plus, Calendar, Save, Trash2, CheckCircle2, Atom, FlaskConical, Binary } from 'lucide-react';
import { validateNumber, validateDate } from '../utils/validators';

interface QuestionTrackerFormProps {
  questionsList: DailyQuestions[];
  onSaveQuestions: (record: DailyQuestions) => void;
}

const QuestionTrackerForm = memo(function QuestionTrackerForm({ questionsList, onSaveQuestions }: QuestionTrackerFormProps) {
  // Select active date (default is today YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Input states - integers (using '' by default so there is no leading zero and placeholders are shown)
  const [mathNormal, setMathNormal] = useState<number | ''>('');
  const [physicsNormal, setPhysicsNormal] = useState<number | ''>('');
  const [chemistryNormal, setChemistryNormal] = useState<number | ''>('');

  const [mathMain, setMathMain] = useState<number | ''>('');
  const [mathAdv, setMathAdv] = useState<number | ''>('');
  const [phyMain, setPhyMain] = useState<number | ''>('');
  const [phyAdv, setPhyAdv] = useState<number | ''>('');
  const [chemMain, setChemMain] = useState<number | ''>('');
  const [chemAdv, setChemAdv] = useState<number | ''>('');

  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Load existing questions when date changes
  useEffect(() => {
    const record = questionsList.find((q) => q.date === selectedDate);
    if (record) {
      setMathNormal(record.math === 0 ? '' : (record.math || ''));
      setPhysicsNormal(record.physics === 0 ? '' : (record.physics || ''));
      setChemistryNormal(record.chemistry === 0 ? '' : (record.chemistry || ''));
      setMathMain(record.math_pyq_main === 0 ? '' : (record.math_pyq_main || ''));
      setMathAdv(record.math_pyq_adv === 0 ? '' : (record.math_pyq_adv || ''));
      setPhyMain(record.physics_pyq_main === 0 ? '' : (record.physics_pyq_main || ''));
      setPhyAdv(record.physics_pyq_adv === 0 ? '' : (record.physics_pyq_adv || ''));
      setChemMain(record.chemistry_pyq_main === 0 ? '' : (record.chemistry_pyq_main || ''));
      setChemAdv(record.chemistry_pyq_adv === 0 ? '' : (record.chemistry_pyq_adv || ''));
    } else {
      setMathNormal('');
      setPhysicsNormal('');
      setChemistryNormal('');
      setMathMain('');
      setMathAdv('');
      setPhyMain('');
      setPhyAdv('');
      setChemMain('');
      setChemAdv('');
    }
  }, [selectedDate, questionsList]);

  // Calculations
  const parseNum = (val: number | '') => (val === '' ? 0 : val);

  // Helper handler for integer inputs
  const handleIntChange = (val: string, setter: (v: number | '') => void) => {
    if (val === '') {
      setter('');
      return;
    }
    const sliced = val.slice(0, 3);
    const cleaned = sliced.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setter('');
      return;
    }
    const num = validateNumber(cleaned, 0, 1000);
    setter(num === 0 ? '' : num);
  };

  const mathTotal = parseNum(mathNormal) + parseNum(mathMain) + parseNum(mathAdv);
  const physicsTotal = parseNum(physicsNormal) + parseNum(phyMain) + parseNum(phyAdv);
  const chemistryTotal = parseNum(chemistryNormal) + parseNum(chemMain) + parseNum(chemAdv);

  const totalNormal = parseNum(mathNormal) + parseNum(physicsNormal) + parseNum(chemistryNormal);

  const totalMainPYQs = parseNum(mathMain) + parseNum(phyMain) + parseNum(chemMain);
  const totalAdvPYQs = parseNum(mathAdv) + parseNum(phyAdv) + parseNum(chemAdv);
  const totalPYQs = totalMainPYQs + totalAdvPYQs;

  const grandTotal = totalNormal + totalPYQs;

  const handleSave = () => {
    const record: DailyQuestions = {
      date: validateDate(selectedDate),
      math: validateNumber(mathNormal, 0, 1000),
      physics: validateNumber(physicsNormal, 0, 1000),
      chemistry: validateNumber(chemistryNormal, 0, 1000),
      math_pyq_main: validateNumber(mathMain, 0, 1000),
      math_pyq_adv: validateNumber(mathAdv, 0, 1000),
      physics_pyq_main: validateNumber(phyMain, 0, 1000),
      physics_pyq_adv: validateNumber(phyAdv, 0, 1000),
      chemistry_pyq_main: validateNumber(chemMain, 0, 1000),
      chemistry_pyq_adv: validateNumber(chemAdv, 0, 1000),
    };

    onSaveQuestions(record);
    setSaveSuccessMessage(true);
    setTimeout(() => {
      setSaveSuccessMessage(false);
    }, 3000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear inputs for this date?')) {
      setMathNormal('');
      setPhysicsNormal('');
      setChemistryNormal('');
      setMathMain('');
      setMathAdv('');
      setPhyMain('');
      setPhyAdv('');
      setChemMain('');
      setChemAdv('');
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 hover:border-accent/30 active-scale-99 transition-all duration-300">
      
      {/* Date Header Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-5 gap-4">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
            Daily Practice Problem (DPP) Logger
          </span>
          <h3 className="text-lg font-bold font-sans tracking-tight text-foreground mt-0.5">Daily Question Solves</h3>
          <p className="text-xs text-muted-foreground">Log standard problems and PYQs solved per subject to measure daily output.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1 bg-accent/10 border border-border/60 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedDate === getTodayStr()
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
                setSelectedDate(yStr);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                (() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
                  return selectedDate === yStr;
                })()
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yesterday
            </button>
          </div>

          <div className="flex items-center gap-2 bg-accent/15 border border-border/70 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-numeric font-bold outline-none text-foreground select-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PHYSICS SECTION */}
        <div className="bg-accent/10 border border-border/70 hover:border-indigo-500/30 rounded-2xl p-5 space-y-4 transition-colors">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Atom className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground block leading-none">Physics</span>
                <span className="text-[10px] text-muted-foreground font-medium">Mechanics & Electrodynamics</span>
              </div>
            </div>
            <span className="text-xs font-numeric font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full tabular-nums">
              {physicsTotal} Qs
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Standard Problems</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={physicsNormal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleIntChange(e.target.value, setPhysicsNormal)}
                className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">JEE Main PYQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={phyMain}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleIntChange(e.target.value, setPhyMain)}
                  className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">JEE Adv PYQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={phyAdv}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleIntChange(e.target.value, setPhyAdv)}
                  className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CHEMISTRY SECTION */}
        <div className="bg-accent/10 border border-border/70 hover:border-emerald-500/30 rounded-2xl p-5 space-y-4 transition-colors">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground block leading-none">Chemistry</span>
                <span className="text-[10px] text-muted-foreground font-medium">Organic, Inorganic & Physical</span>
              </div>
            </div>
            <span className="text-xs font-numeric font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full tabular-nums">
              {chemistryTotal} Qs
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Standard Problems</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={chemistryNormal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleIntChange(e.target.value, setChemistryNormal)}
                className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">JEE Main PYQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={chemMain}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleIntChange(e.target.value, setChemMain)}
                  className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">JEE Adv PYQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={chemAdv}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleIntChange(e.target.value, setChemAdv)}
                  className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MATHS SECTION */}
        <div className="bg-accent/10 border border-border/70 hover:border-violet-500/30 rounded-2xl p-5 space-y-4 transition-colors">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Binary className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground block leading-none">Mathematics</span>
                <span className="text-[10px] text-muted-foreground font-medium">Calculus, Algebra & Vectors</span>
              </div>
            </div>
            <span className="text-xs font-numeric font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full tabular-nums">
              {mathTotal} Qs
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Standard Problems</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={mathNormal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleIntChange(e.target.value, setMathNormal)}
                className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-violet-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">JEE Main PYQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={mathMain}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleIntChange(e.target.value, setMathMain)}
                  className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2 outline-none focus:border-violet-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">JEE Adv PYQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={mathAdv}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleIntChange(e.target.value, setMathAdv)}
                  className="w-full bg-card border border-border/80 text-xs rounded-xl px-3 py-2 outline-none focus:border-violet-500/60 font-numeric font-semibold text-foreground transition-all tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Stats Summary Panel */}
      <div className="bg-accent/15 border border-border/70 rounded-2xl p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center sm:text-left">
          <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Standard Practice</span>
          <span className="text-xl sm:text-2xl font-bold font-numeric text-indigo-400 tabular-nums">{totalNormal}</span>
        </div>

        <div className="text-center sm:text-left border-l border-border/60 pl-0 sm:pl-4">
          <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">JEE Main PYQ</span>
          <span className="text-xl sm:text-2xl font-bold font-numeric text-emerald-400 tabular-nums">{totalMainPYQs}</span>
        </div>

        <div className="text-center sm:text-left border-l border-border/60 pl-0 sm:pl-4">
          <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">JEE Advanced PYQ</span>
          <span className="text-xl sm:text-2xl font-bold font-numeric text-amber-400 tabular-nums">{totalAdvPYQs}</span>
        </div>

        <div className="text-center sm:text-left border-l border-border/60 pl-0 sm:pl-4">
          <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Grand Total</span>
          <span className="text-xl sm:text-2xl font-bold font-numeric text-primary flex items-center justify-center sm:justify-start gap-1 tabular-nums">
            {grandTotal} <span className="text-xs font-normal text-muted-foreground font-sans">Qs</span>
          </span>
        </div>
      </div>

      {/* Button Drawer */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
        <div className="text-xs text-muted-foreground">
          {saveSuccessMessage ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Changes saved to local storage
            </span>
          ) : (
            <span className="text-muted-foreground/80 font-medium text-[11px]">Auto-buffered with IndexedDB persistence</span>
          )}
        </div>

        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleClear}
            className="flex-1 sm:flex-none border border-border bg-accent/15 hover:bg-accent/35 text-muted-foreground hover:text-foreground font-semibold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
          >
            Clear Inputs
          </button>
          
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground font-bold text-xs py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:opacity-90 active-scale-98 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Today's Logs
          </button>
        </div>
      </div>

    </div>
  );
});

export default QuestionTrackerForm;
