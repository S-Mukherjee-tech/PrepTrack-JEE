import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetApp = async () => {
    if (window.confirm('Are you sure you want to reset all app data? This will clear your study sessions, practice progress, and settings. This cannot be undone.')) {
      try {
        localStorage.clear();
        // Clear IndexedDB
        if (window.indexedDB) {
          const dbs = await window.indexedDB.databases?.();
          if (dbs) {
            dbs.forEach(db => {
              if (db.name) window.indexedDB.deleteDatabase(db.name);
            });
          } else {
            window.indexedDB.deleteDatabase('PrepTrackDB');
          }
        }
        window.location.reload();
      } catch (err) {
        alert('Failed to clear some local databases. We will reload the app anyway.');
        window.location.reload();
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#070913] text-slate-100 p-4 md:p-8 select-none font-sans relative overflow-hidden">
          {/* Ambient visual glowing backgrounds */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="w-full max-w-xl bg-slate-900/45 backdrop-blur-xl border border-rose-500/20 p-6 md:p-8 rounded-3xl shadow-2xl relative z-10 space-y-6 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/25 flex items-center justify-center rounded-2xl">
              <AlertOctagon className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">
                Oops! Encountered an Unexpected Error
              </h1>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                JEE Companion has caught a runtime rendering issue. Don't worry, your data is highly persistent, and we can help you recover safely.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-left font-mono text-[11px] max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-rose-500/10">
                <div className="font-bold text-rose-400">Error: {this.state.error.message}</div>
                {this.state.errorInfo && (
                  <div className="text-slate-500 whitespace-pre text-[10px]">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-98"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Reload Workspace
              </button>
              
              <button
                onClick={this.handleResetApp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 font-semibold rounded-2xl text-xs transition-all duration-200 cursor-pointer border border-slate-700/60 active:scale-98"
                title="Clears all local storage and database instances to resolve critical application lockups"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Factory Reset
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Need help? Try reloading first.</span>
              <button 
                onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); window.location.href = '/'; }}
                className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
              >
                <Home className="w-3 h-3" /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
