import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle, Flame, Sparkles, X, Target } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'goal';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  theme: 'slate' | 'cyber' | 'light' | 'glass';
}

export default function ToastContainer({ toasts, onClose, theme }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={onClose} theme={theme} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: Toast;
  onClose: (id: string) => void;
  theme: 'slate' | 'cyber' | 'light' | 'glass';
}

function ToastCard({ toast, onClose, theme }: ToastCardProps) {
  // Auto dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  // Styling based on theme
  const containerStyle =
    theme === 'cyber'
      ? 'bg-black/95 border-2 border-emerald-500/30 text-emerald-400 font-mono shadow-[0_0_20px_rgba(16,185,129,0.15)]'
      : theme === 'slate'
      ? 'bg-slate-900/95 border border-slate-700/85 text-slate-100 shadow-2xl'
      : theme === 'light'
      ? 'bg-white/95 border border-slate-200 text-slate-800 shadow-2xl'
      : 'bg-white/10 dark:bg-black/35 backdrop-blur-xl border border-white/10 dark:border-white/5 text-foreground shadow-2xl';

  const iconBg =
    theme === 'cyber'
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
      : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20';

  const progressBarTheme =
    theme === 'cyber'
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
      : 'bg-gradient-to-r from-indigo-500 to-purple-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.85, x: 50, filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4.5 flex gap-3.5 items-start ${containerStyle}`}
    >
      {/* Decorative ambient background highlight */}
      <div className="absolute -right-6 -top-6 w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Goal achievement badge icon */}
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg} flex items-center justify-center`}>
        {toast.title.includes('Study') ? (
          <Flame className="w-5 h-5 animate-pulse" />
        ) : (
          <Target className="w-5 h-5 animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-1.5 font-bold font-display text-sm leading-none h-5 select-none text-foreground tracking-tight">
          <span>{toast.title}</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500/90 animate-bounce" />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed opacity-90 text-muted-foreground">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        title="Dismiss Notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Toast timer progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-accent/10">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className={`h-full ${progressBarTheme}`}
        />
      </div>
    </motion.div>
  );
}
