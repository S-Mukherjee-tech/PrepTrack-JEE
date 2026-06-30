import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Trash2 } from 'lucide-react';
import { StudySession } from '../types';

interface WindowedStudyLogProps {
  sessions: StudySession[];
  onDeleteSession: (id: string) => void;
  maxHeight?: string; // e.g. "170px" or "400px"
  isAnalyticsVariant?: boolean;
}

export const WindowedStudyLog = memo(function WindowedStudyLog({
  sessions,
  onDeleteSession,
  maxHeight = "170px",
  isAnalyticsVariant = false,
}: WindowedStudyLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Explicit item height matching our styled divs
  const itemHeight = isAnalyticsVariant ? 96 : 56; 

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // requestAnimationFrame-based debouncing wrapper for optimal 120Hz scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    // Run initial positioning
    handleScroll();

    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, [handleScroll]);

  const totalHeight = sessions.length * itemHeight;
  
  // Viewport scroll window mathematics
  const viewportHeight = parseInt(maxHeight) || 170;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(sessions.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + 2);

  const visibleSessions = sessions.slice(startIndex, endIndex);
  const paddingTop = startIndex * itemHeight;
  const paddingBottom = Math.max(0, (sessions.length - endIndex) * itemHeight);

  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
        No study periods recorded yet today. Hit start focused study to begin!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ maxHeight }}
      className="overflow-y-auto pr-1 select-none"
    >
      <div style={{ paddingTop, paddingBottom, height: totalHeight ? 'auto' : 0 }}>
        <div className={isAnalyticsVariant ? "space-y-3" : "space-y-2.5"}>
          {visibleSessions.map((s) => {
            const dateObj = new Date(s.startTime);
            const mins = Math.round(s.duration / 60);

            if (isAnalyticsVariant) {
              const hrsStr = Math.floor(s.duration / 3600);
              const minsStr = Math.floor((s.duration % 3600) / 60);
              return (
                <div
                  key={s.id}
                  style={{ height: `${itemHeight - 12}px`, marginBottom: '12px' }}
                  className="p-4 rounded-2xl bg-accent/10 border border-border/80 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between hover:border-accent/40 hover:bg-accent/15 transition-all gap-4 dashboard-card-gpu"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-foreground text-sm uppercase font-display truncate block max-w-[200px] sm:max-w-xs">{s.sessionName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase bg-accent/30 px-1.5 py-0.5 rounded shrink-0">
                        {s.mode || 'normal'} mode
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      Start: {dateObj.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  •  End: {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    <span className="text-xs font-bold font-mono text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-xl">
                      {hrsStr > 0 ? `${hrsStr}h ${minsStr}m` : `${minsStr}m`}
                    </span>

                    <button
                      onClick={() => onDeleteSession(s.id)}
                      className="text-muted-foreground hover:text-rose-500 p-2 hover:bg-rose-500/15 rounded-xl cursor-pointer duration-200 transition-colors"
                      title="Prune Study Log"
                      aria-label="Prune Study Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={s.id}
                style={{ height: `${itemHeight - 10}px`, marginBottom: '10px' }}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/15 border border-border/50 text-xs hover:border-accent/30 transition-all dashboard-card-gpu"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="font-bold text-foreground block truncate">{s.sessionName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-bold font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {mins > 0 ? `${mins} m` : `${s.duration} s`}
                  </span>

                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="text-muted-foreground hover:text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    title="Delete study record"
                    aria-label="Delete study record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
