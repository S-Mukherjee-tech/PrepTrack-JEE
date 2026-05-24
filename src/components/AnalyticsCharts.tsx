import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { StudySession, DailyQuestions } from '../types';
import { BarChart, Clock, Hash, BookOpen } from 'lucide-react';

interface AnalyticsChartsProps {
  sessions: StudySession[];
  questions: DailyQuestions[];
}

type PeriodType = 'day' | 'week' | 'month';

export default function AnalyticsCharts({ sessions, questions }: AnalyticsChartsProps) {
  const [sessionPeriod, setSessionPeriod] = useState<PeriodType>('day');
  const [questionsPeriod, setQuestionsPeriod] = useState<PeriodType>('day');

  // --- STUDY SESSIONS AGGREGATION ---
  const studyChartData = useMemo(() => {
    const now = new Date();
    const dataMap: Record<string, number> = {};

    if (sessionPeriod === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        dataMap[key] = 0;
      }

      sessions.forEach((s) => {
        const dateStr = new Date(s.startTime).toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
        });
        if (dateStr in dataMap) {
          dataMap[dateStr] += s.duration / 3600; // hours
        }
      });
    } else if (sessionPeriod === 'week') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const key = `Wk -${i}`;
        dataMap[key] = 0;
      }

      sessions.forEach((s) => {
        const diffDays = Math.floor((now.getTime() - s.startTime) / (1000 * 3600 * 24));
        const wkIndex = Math.floor(diffDays / 7);
        if (wkIndex >= 0 && wkIndex < 4) {
          const key = `Wk -${wkIndex}`;
          dataMap[key] = (dataMap[key] || 0) + s.duration / 3600;
        }
      });

      // Reverse keys so oldest week is left, newest is right
      const orderedKeys = Object.keys(dataMap).reverse();
      const reorderedMap: Record<string, number> = {};
      orderedKeys.forEach((k, idx) => {
        reorderedMap[`Wk -${3 - idx}`] = dataMap[k];
      });
      return Object.entries(reorderedMap).map(([key, value]) => ({ key, value }));
    } else {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short' });
        dataMap[key] = 0;
      }

      sessions.forEach((s) => {
        const dateStr = new Date(s.startTime).toLocaleDateString('en-US', { month: 'short' });
        if (dateStr in dataMap) {
          dataMap[dateStr] += s.duration / 3600;
        }
      });
    }

    return Object.entries(dataMap).map(([key, value]) => ({ key, value }));
  }, [sessions, sessionPeriod]);

  // --- QUESTIONS SOLVED AGGREGATION ---
  const questionsChartData = useMemo(() => {
    const now = new Date();
    const dataMap: Record<string, { total: number; pyq: number; normal: number }> = {};

    if (questionsPeriod === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        dataMap[key] = { total: 0, pyq: 0, normal: 0 };
      }

      questions.forEach((q) => {
        const parts = q.date.split('-');
        if (parts.length === 3) {
          const qDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const key = qDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          if (key in dataMap) {
            const normal = (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
            const pyq = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                        (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                        (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
            dataMap[key].normal += normal;
            dataMap[key].pyq += pyq;
            dataMap[key].total += (normal + pyq);
          }
        }
      });
    } else if (questionsPeriod === 'week') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const key = `Wk -${i}`;
        dataMap[key] = { total: 0, pyq: 0, normal: 0 };
      }

      questions.forEach((q) => {
        const parts = q.date.split('-');
        if (parts.length === 3) {
          const qDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const diffDays = Math.floor((now.getTime() - qDate.getTime()) / (1000 * 3600 * 24));
          const wkIndex = Math.floor(diffDays / 7);
          if (wkIndex >= 0 && wkIndex < 4) {
            const key = `Wk -${wkIndex}`;
            const normal = (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
            const pyq = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                        (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                        (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
            dataMap[key].normal += normal;
            dataMap[key].pyq += pyq;
            dataMap[key].total += (normal + pyq);
          }
        }
      });

      const orderedKeys = Object.keys(dataMap).reverse();
      const reorderedMap: Record<string, { total: number; pyq: number; normal: number }> = {};
      orderedKeys.forEach((k, idx) => {
        reorderedMap[`Wk -${3 - idx}`] = dataMap[k];
      });
      return Object.entries(reorderedMap).map(([key, value]) => ({ key, ...value }));
    } else {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short' });
        dataMap[key] = { total: 0, pyq: 0, normal: 0 };
      }

      questions.forEach((q) => {
        const parts = q.date.split('-');
        if (parts.length === 3) {
          const qDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const key = qDate.toLocaleDateString('en-US', { month: 'short' });
          if (key in dataMap) {
            const normal = (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
            const pyq = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                        (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                        (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
            dataMap[key].normal += normal;
            dataMap[key].pyq += pyq;
            dataMap[key].total += (normal + pyq);
          }
        }
      });
    }

    return Object.entries(dataMap).map(([key, value]) => ({ key, ...value }));
  }, [questions, questionsPeriod]);

  // Aggregate stats
  const totalStudyHours = useMemo(() => {
    return sessions.reduce((acc, s) => acc + s.duration, 0) / 3600;
  }, [sessions]);

  const totalQuestionsSolved = useMemo(() => {
    return questions.reduce((acc, q) => {
      const normal = (q.physics || 0) + (q.chemistry || 0) + (q.math || 0);
      const pyq = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                  (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                  (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
      return acc + normal + pyq;
    }, 0);
  }, [questions]);

  const totalPYQsSolved = useMemo(() => {
    return questions.reduce((acc, q) => {
      const pyq = (q.physics_pyq_main || 0) + (q.physics_pyq_adv || 0) +
                  (q.chemistry_pyq_main || 0) + (q.chemistry_pyq_adv || 0) +
                  (q.math_pyq_main || 0) + (q.math_pyq_adv || 0);
      return acc + pyq;
    }, 0);
  }, [questions]);

  // Max value calculation for scaling charts
  const maxStudyValue = useMemo(() => {
    const values = studyChartData.map((d) => d.value);
    const maxVal = Math.max(...values, 1);
    return Math.ceil(maxVal * 1.1); // add 10% padding
  }, [studyChartData]);

  const maxQuestionsValue = useMemo(() => {
    const values = questionsChartData.map((d) => d.total);
    const maxVal = Math.max(...values, 1);
    return Math.ceil(maxVal * 1.1); // add 10% padding
  }, [questionsChartData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* STUDY HOURS CARD */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-accent/40 active-scale-99 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/15 text-indigo-500 rounded-lg">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-sans tracking-tight">Study Time Logs</h3>
              <p className="text-xs text-muted-foreground">Total: {totalStudyHours.toFixed(1)} hrs logged</p>
            </div>
          </div>

          <div className="flex bg-accent/20 border border-border p-0.5 rounded-lg text-xs gap-1">
            {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setSessionPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all duration-250 cursor-pointer ${
                  sessionPeriod === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="h-48 flex items-end gap-3 px-2 pt-6 relative border-b border-l border-border mt-2">
          {/* Y-Axis Indicator Lines */}
          <div className="absolute left-1 top-2 right-0 border-t border-border/40 pointer-events-none flex justify-end">
            <span className="text-[10px] font-mono text-muted-foreground opacity-60 bg-card px-1 -translate-y-2">{(maxStudyValue).toFixed(1)} hr</span>
          </div>
          <div className="absolute left-1 top-24 right-0 border-t border-border/40 pointer-events-none flex justify-end">
            <span className="text-[10px] font-mono text-muted-foreground opacity-60 bg-card px-1 -translate-y-2">{(maxStudyValue / 2).toFixed(1)} hr</span>
          </div>

          {studyChartData.map((d, index) => {
            const pct = (d.value / maxStudyValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-gray-900 border border-gray-800 text-gray-100 text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center z-20 whitespace-nowrap">
                  <span className="font-bold">{d.value.toFixed(2)} hr</span>
                  <span className="text-gray-400">{(d.value * 60).toFixed(0)} min</span>
                </div>

                {/* Animated Bar */}
                <div className="w-full bg-accent/10 rounded-t-lg overflow-hidden flex flex-col justify-end h-full relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg flex items-center justify-center group-hover:brightness-110 origin-bottom shadow-md relative"
                  >
                    {d.value > 0.3 && (
                      <span className="text-[9px] font-mono font-bold text-white mb-1 select-none pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                        {d.value.toFixed(1)}h
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* X-Axis string label */}
                <span className="absolute top-full mt-2 text-[10px] text-muted-foreground text-center font-mono font-medium truncate w-full px-0.5">
                  {d.key}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-xs text-muted-foreground flex gap-1 items-center justify-between italic bg-accent/15 py-2 px-3 rounded-xl border border-border/40">
          <span>Y-Axis represents study duration in hours</span>
          <span className="font-semibold text-foreground">Interactive Toggles Available</span>
        </div>
      </div>

      {/* QUESTIONS SOLVED CARD */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-accent/40 active-scale-99 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/15 text-emerald-500 rounded-lg">
              <Hash className="w-5 h-5 text-emerald-500 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-sans tracking-tight">Solved Questions</h3>
              <p className="text-xs text-muted-foreground">Total: {totalQuestionsSolved} Qs ({totalPYQsSolved} PYQs)</p>
            </div>
          </div>

          <div className="flex bg-accent/20 border border-border p-0.5 rounded-lg text-xs gap-1">
            {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setQuestionsPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all duration-250 cursor-pointer ${
                  questionsPeriod === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Bar Chart for Questions Solved */}
        <div className="h-48 flex items-end gap-3 px-2 pt-6 relative border-b border-l border-border mt-2">
          {/* Y-Axis Indicator Lines */}
          <div className="absolute left-1 top-2 right-0 border-t border-border/40 pointer-events-none flex justify-end">
            <span className="text-[10px] font-mono text-muted-foreground opacity-60 bg-card px-1 -translate-y-2">{maxQuestionsValue} Qs</span>
          </div>
          <div className="absolute left-1 top-24 right-0 border-t border-border/40 pointer-events-none flex justify-end">
            <span className="text-[10px] font-mono text-muted-foreground opacity-60 bg-card px-1 -translate-y-2">{Math.floor(maxQuestionsValue / 2)} Qs</span>
          </div>

          {questionsChartData.map((d, index) => {
            const total = d.total || 0;
            const pyq = d.pyq || 0;
            const normal = d.normal || 0;

            const totalPct = (total / maxQuestionsValue) * 100;
            const pyqSplitPct = total > 0 ? (pyq / total) * 100 : 0;
            const normalSplitPct = total > 0 ? (normal / total) * 100 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-gray-900 border border-gray-800 text-gray-100 text-[10px] px-3 py-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-start gap-0.5 z-20 whitespace-nowrap">
                  <span className="font-bold border-b border-gray-700/50 pb-0.5 mb-0.5 w-full">Total: {total} Qs</span>
                  <span className="text-emerald-400 flex items-center gap-1">🟢 PYQ: {pyq}</span>
                  <span className="text-indigo-400 flex items-center gap-1">🔵 Normal: {normal}</span>
                </div>

                {/* Animated Stacked Bar */}
                <div className="w-full bg-accent/10 rounded-t-lg overflow-hidden flex flex-col justify-end h-full relative">
                  {total > 0 ? (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${totalPct}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                      className="w-full rounded-t-lg flex flex-col origin-bottom shadow-md overflow-hidden h-full"
                    >
                      {/* Normal Questions (Top of stack) */}
                      <div
                        className="w-full bg-indigo-500 hover:brightness-110 transition-all"
                        style={{ height: `${normalSplitPct}%` }}
                        title={`Normal Questions: ${normal}`}
                      />
                      {/* PYQs (Bottom of stack) */}
                      <div
                        className="w-full bg-emerald-500 hover:brightness-110 transition-all"
                        style={{ height: `${pyqSplitPct}%` }}
                        title={`PYQs Solved: ${pyq}`}
                      />
                    </motion.div>
                  ) : null}
                </div>

                {/* X-Axis string label */}
                <span className="absolute top-full mt-2 text-[10px] text-muted-foreground text-center font-mono font-medium truncate w-full px-0.5">
                  {d.key}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-xs flex gap-4 items-center justify-between italic bg-accent/15 py-2 px-3 rounded-xl border border-border/40">
          <div className="flex gap-3 text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block"></span> Normal</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span> PYQ</span>
          </div>
          <span className="font-semibold text-foreground">Hover bar details</span>
        </div>
      </div>
    </div>
  );
}
