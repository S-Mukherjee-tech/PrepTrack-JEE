import { useState, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { StudySession, DailyQuestions, ErrorBookItem } from '../types';
import { BarChart, Clock, Hash, BookOpen, Target, Sparkles, Award } from 'lucide-react';

interface AnalyticsChartsProps {
  sessions: StudySession[];
  questions: DailyQuestions[];
  errorItems?: ErrorBookItem[];
}

type PeriodType = 'day' | 'week' | 'month';

const AnalyticsCharts = memo(function AnalyticsCharts({ sessions, questions, errorItems = [] }: AnalyticsChartsProps) {
  const [sessionPeriod, setSessionPeriod] = useState<PeriodType>('day');
  const [questionsPeriod, setQuestionsPeriod] = useState<PeriodType>('day');

  // --- MISTAKE BREAKDOWN AGGREGATION ---
  const mistakeStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Silly Mistake': 0,
      'Conceptual': 0,
      'Calculation': 0,
      'Formula Error': 0,
      'Time Pressure': 0,
      'Reading Error': 0,
    };
    let totalTagsLogged = 0;

    errorItems.forEach((item) => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed in counts) {
            counts[trimmed]++;
          } else {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
          totalTagsLogged++;
        });
      }
    });

    const list = Object.entries(counts).map(([name, count]) => {
      const pct = totalTagsLogged > 0 ? (count / totalTagsLogged) * 100 : 0;
      return { name, count, pct };
    }).sort((a, b) => b.count - a.count);

    const dominantType = list[0]?.count > 0 ? list[0] : null;

    return {
      list,
      total: totalTagsLogged,
      dominantType,
    };
  }, [errorItems]);

  const actionableAdvice = useMemo(() => {
    if (errorItems.length === 0) {
      return {
        title: "Log your first mistake pattern",
        text: "Add logged entries inside the Error Book and tag them. Your Weakness Radar will synthesize high-yield recommendations.",
        type: "general"
      };
    }
    if (mistakeStats.total === 0) {
      return {
        title: "Classify your logged mistakes",
        text: "Make sure to tag your mistakes (e.g., #Silly Mistake, #Conceptual) in your Error Book. It helps pinpoint exact trap profiles.",
        type: "general"
      };
    }

    const dom = mistakeStats.dominantType;
    if (!dom) {
      return {
        title: "Keep logging and tagging mistakes",
        text: "Reviewing your corrective approaches weekly will drastically reduce recurring exam errors.",
        type: "general"
      };
    }

    if (dom.name === 'Silly Mistake' && dom.pct >= 30) {
      return {
        title: "High Silly Error Rate detected",
        text: "⚠️ High Silly Error Rate detected. Slow down during the last 30 seconds of solving and re-read the question's final statement carefully.",
        type: "silly"
      };
    } else if (dom.name === 'Conceptual' && dom.pct >= 30) {
      return {
        title: "Concept Gaps dominant",
        text: "📚 Concept Errors dominant. Pause active test-taking and schedule a deep active-recall review session for those specific chapters.",
        type: "conceptual"
      };
    } else if (dom.name === 'Calculation' && dom.pct >= 30) {
      return {
        title: "Calculation errors dominant",
        text: "🧮 Calculation errors detected. Always write steps down clearly on your scratchpad. Avoid solving complex algebraic or numeric steps purely in your head.",
        type: "calculation"
      };
    } else if (dom.name === 'Formula Error' && dom.pct >= 30) {
      return {
        title: "Formula memory gaps detected",
        text: "📝 Formula Error rate high. Spend the first 15 minutes of your study morning doing active-recall writing of active formulas for Physics/Chemistry.",
        type: "formula"
      };
    } else if (dom.name === 'Time Pressure' && dom.pct >= 20) {
      return {
        title: "Time management constraint",
        text: "⏱️ Time pressure errors high. Implement strict 2-minute limit timers per question when doing daily mock logs to reduce anxiety.",
        type: "time"
      };
    } else {
      return {
        title: `Primary weakness: ${dom.name}`,
        text: `Logged ${dom.count} errors in this category (${Math.round(dom.pct)}% of total). Review these specific mistake files before the next mock test.`,
        type: "other"
      };
    }
  }, [errorItems, mistakeStats]);

  const getTagColor = (tagName: string) => {
    switch (tagName) {
      case 'Silly Mistake':
        return 'from-rose-500 to-pink-500 text-rose-500';
      case 'Conceptual':
        return 'from-indigo-500 to-violet-500 text-indigo-500';
      case 'Calculation':
        return 'from-amber-500 to-orange-500 text-amber-500';
      case 'Formula Error':
        return 'from-emerald-500 to-teal-500 text-emerald-500';
      case 'Time Pressure':
        return 'from-purple-500 to-fuchsia-500 text-purple-500';
      case 'Reading Error':
        return 'from-sky-500 to-blue-500 text-sky-500';
      default:
        return 'from-gray-500 to-slate-500 text-muted-foreground';
    }
  };

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
    <div className="space-y-8 animate-fade-in">
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

          <div className="flex bg-accent/20 border border-border p-1 rounded-lg text-xs gap-1">
            {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setSessionPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all duration-250 cursor-pointer border ${
                  sessionPeriod === p
                    ? 'bg-primary text-primary-foreground border-primary shadow-md font-bold scale-[1.01]'
                    : 'bg-accent/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
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

          <div className="flex bg-accent/20 border border-border p-1 rounded-lg text-xs gap-1">
            {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setQuestionsPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all duration-250 cursor-pointer border ${
                  questionsPeriod === p
                    ? 'bg-primary text-primary-foreground border-primary shadow-md font-bold scale-[1.01]'
                    : 'bg-accent/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/35 hover:border-border/60'
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

    {/* NEW SECTION: MISTAKE DISTRIBUTION & WEAKNESS RADAR */}
    <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 hover:border-accent/40 active-scale-99 transition-all duration-300">
      <div className="border-b border-border/60 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-sans tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-500 animate-pulse" /> Mistake Distribution & Weakness Radar
            </h3>
            <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full uppercase">
              Mistake Diagnosis
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Analyzed {errorItems.length} records
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Analysis of tagged mistakes inside the Error Book to identify trap types and cognitive gaps.
        </p>
      </div>

      {errorItems.length === 0 || mistakeStats.total === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest block">Awaiting Data Streams</span>
            <h4 className="text-sm font-bold text-foreground">Diagnosis currently uninitialized</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Log and tag your specific errors (e.g. <strong>Silly Mistakes</strong>, <strong>Conceptual Gaps</strong>, <strong>Calculation slips</strong>) in your <strong>Error Book</strong> to bring this radar to life.
            </p>
            <div className="p-3.5 bg-accent/10 border border-border/60 rounded-xl space-y-1.5 text-xs text-muted-foreground">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Why tag mistakes?
              </span>
              <span>JEE is won by correcting errors. Reviewing your specific cognitive error profiles dynamically prevents making the same mistake twice on exam day.</span>
            </div>
          </div>

          <div className="border border-border/80 bg-accent/5 rounded-2xl p-6 space-y-4 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
              <Target className="w-48 h-48" />
            </div>
            <div className="space-y-2 opacity-50">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>#Silly Mistake</span>
                <span>0%</span>
              </div>
              <div className="h-2 bg-border/40 rounded-full w-full" />
            </div>
            <div className="space-y-2 opacity-30">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>#Conceptual</span>
                <span>0%</span>
              </div>
              <div className="h-2 bg-border/40 rounded-full w-full animate-pulse" />
            </div>
            <div className="space-y-2 opacity-25">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>#Calculation</span>
                <span>0%</span>
              </div>
              <div className="h-2 bg-border/40 rounded-full w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Breakdown Progress Bars */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider block">
              Error Breakdown Distribution ({mistakeStats.total} tags)
            </span>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {mistakeStats.list.map((m) => {
                const colors = getTagColor(m.name);
                const colorGradient = colors.split(' ').slice(0, 2).join(' ');
                const colorText = colors.split(' ').slice(2).join(' ');
                return (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground">#{m.name}</span>
                      <div className="space-x-1 font-mono text-muted-foreground text-[11px]">
                        <span className={`font-bold ${colorText}`}>{m.count} logs</span>
                        <span>•</span>
                        <span className="font-bold">{Math.round(m.pct)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-accent/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${colorGradient} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Actionable advice & recommendations card */}
          <div className="bg-accent/15 border border-border p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                Diagnosis & Cognitive Advice
              </span>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl mt-0.5 shrink-0">
                  <Award className="w-5 h-5 animate-pulse text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground font-sans leading-tight">
                    {actionableAdvice.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    {actionableAdvice.text}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 space-y-2">
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tactical Action Plan
              </span>
              <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Never attempt deep-solving when mentally fatigued; switch to lightweight active-recall or card review.</li>
                <li>Annotate your draft worksheets explicitly with warning marks on high-danger steps.</li>
                <li>Review this dynamic diagnosis block before launching mock tests to reduce error-rate.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
});

export default AnalyticsCharts;
