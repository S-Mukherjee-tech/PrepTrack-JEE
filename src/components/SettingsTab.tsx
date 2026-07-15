import React, { useState, useEffect, memo } from 'react';
import { UserSettings, ThemeType } from '../types';
import { ShieldAlert, Sun, Moon } from 'lucide-react';

interface SettingsTabProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onResetAllData: () => Promise<void>;
  showResetConfirm: boolean;
  setShowResetConfirm: (show: boolean) => void;
}

const SettingsTab = memo(function SettingsTab({
  settings,
  onSaveSettings,
  onResetAllData,
  showResetConfirm,
  setShowResetConfirm,
}: SettingsTabProps) {
  // Local settings fields to allow clean text deleting
  const [localWorkDuration, setLocalWorkDuration] = useState<string>('25');
  const [localBreakDuration, setLocalBreakDuration] = useState<string>('5');
  const [localStudyGoal, setLocalStudyGoal] = useState<string>('3');
  const [localQuestionGoal, setLocalQuestionGoal] = useState<string>('30');

  // Synchronize local input state when settings load/change
  useEffect(() => {
    setLocalWorkDuration(settings.pomodoroWorkDuration?.toString() || '25');
    setLocalBreakDuration(settings.pomodoroBreakDuration?.toString() || '5');
    setLocalStudyGoal(((settings.dailyStudyMinutesGoal ?? 180) / 60).toString());
    setLocalQuestionGoal((settings.dailyQuestionsSolvedGoal ?? 30).toString());
  }, [settings.pomodoroWorkDuration, settings.pomodoroBreakDuration, settings.dailyStudyMinutesGoal, settings.dailyQuestionsSolvedGoal]);

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Theme Settings Selector */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-foreground">Select Theme Accent</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { id: 'glass', name: '🌌 Aurora Glass Theme', desc: 'Luminous translucent glass panels floating on a vivid cosmic-violet backdrop with high contrast accents.', colorBg: 'bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500', textC: 'text-white' },
            { id: 'slate', name: '💎 Cosmic Ocean Theme', desc: 'Stunning deep navy-slate interface accented with high-fidelity glowing electric cyan highlights.', colorBg: 'bg-gradient-to-tr from-cyan-600 to-blue-900', textC: 'text-white' },
            { id: 'cyber', name: '⚡ Cyber Neon Theme', desc: 'Vibrant retro-futuristic dark neon setup styled with vivid laser green and high energy glows.', colorBg: 'bg-gradient-to-tr from-emerald-500 to-teal-950 border border-emerald-400', textC: 'text-emerald-400' },
            { id: 'light', name: '🌸 Spring Blossom Theme', desc: 'Delightful pure bright layout infused with warm cherry blossom rose and radiant golden tones.', colorBg: 'bg-gradient-to-tr from-pink-300 via-rose-400 to-amber-200', textC: 'text-slate-900 border border-slate-200' },
          ].map((themeOpt) => (
            <button
              key={themeOpt.id}
              onClick={() => onSaveSettings({ ...settings, theme: themeOpt.id as ThemeType })}
              className={`p-5 rounded-2xl text-left transition-all border outline-none cursor-pointer duration-200 hover:scale-[1.01] active:scale-[0.98] ${
                settings.theme === themeOpt.id
                  ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                  : 'border-border bg-accent/15 hover:bg-accent/25'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">{themeOpt.name}</span>
                <div className={`w-3.5 h-3.5 rounded-full ${themeOpt.colorBg} border border-border flex items-center justify-center`}>
                  {settings.theme === themeOpt.id && (
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">{themeOpt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pomodoro Configurations */}
      <div className="space-y-4 border-t border-border/60 pt-6">
        <h4 className="text-sm font-bold text-foreground">Study timer intervals</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pomodoro Work Duration (Minutes)</label>
            <input
              type="text"
              inputMode="numeric"
              value={localWorkDuration}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setLocalWorkDuration(val);
                const parsed = parseInt(val);
                if (!isNaN(parsed) && parsed >= 5 && parsed <= 180) {
                  onSaveSettings({ ...settings, pomodoroWorkDuration: parsed });
                }
              }}
              onBlur={() => {
                let parsed = parseInt(localWorkDuration);
                if (isNaN(parsed)) parsed = 25;
                const clamped = Math.min(180, Math.max(5, parsed));
                setLocalWorkDuration(clamped.toString());
                onSaveSettings({ ...settings, pomodoroWorkDuration: clamped });
              }}
              className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3 py-2.5 font-medium text-foreground outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pomodoro Break Duration (Minutes)</label>
            <input
              type="text"
              inputMode="numeric"
              value={localBreakDuration}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setLocalBreakDuration(val);
                const parsed = parseInt(val);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 60) {
                  onSaveSettings({ ...settings, pomodoroBreakDuration: parsed });
                }
              }}
              onBlur={() => {
                let parsed = parseInt(localBreakDuration);
                if (isNaN(parsed)) parsed = 5;
                const clamped = Math.min(60, Math.max(1, parsed));
                setLocalBreakDuration(clamped.toString());
                onSaveSettings({ ...settings, pomodoroBreakDuration: clamped });
              }}
              className="w-full bg-accent/20 border border-border text-xs rounded-xl px-3 py-2.5 font-medium text-foreground outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </div>

      {/* Daily Goals Configurations */}
      <div className="space-y-4 border-t border-border/60 pt-6">
        <div>
          <h4 className="text-sm font-bold text-foreground">Daily Study Targets</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">Set target milestones to track study progress bars accurately.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Daily Study Hours Goal</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={localStudyGoal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  const cleaned = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                  setLocalStudyGoal(cleaned);
                  const parsed = parseFloat(cleaned);
                  if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 24) {
                    onSaveSettings({ ...settings, dailyStudyMinutesGoal: Math.round(parsed * 60) });
                  }
                }}
                onBlur={() => {
                  let parsed = parseFloat(localStudyGoal);
                  if (isNaN(parsed)) parsed = 3;
                  const clamped = Math.min(24, Math.max(0.5, parsed));
                  setLocalStudyGoal(clamped.toString());
                  onSaveSettings({ ...settings, dailyStudyMinutesGoal: Math.round(clamped * 60) });
                }}
                className="w-full bg-accent/20 border border-border text-xs rounded-xl pl-3 pr-14 py-2.5 font-medium text-foreground outline-none focus:border-indigo-500/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">Hours</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Daily Question Target</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={localQuestionGoal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setLocalQuestionGoal(val);
                  const parsed = parseInt(val);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= 500) {
                    onSaveSettings({ ...settings, dailyQuestionsSolvedGoal: parsed });
                  }
                }}
                onBlur={() => {
                  let parsed = parseInt(localQuestionGoal);
                  if (isNaN(parsed)) parsed = 30;
                  const clamped = Math.min(500, Math.max(1, parsed));
                  setLocalQuestionGoal(clamped.toString());
                  onSaveSettings({ ...settings, dailyQuestionsSolvedGoal: clamped });
                }}
                className="w-full bg-accent/20 border border-border text-xs rounded-xl pl-3 pr-20 py-2.5 font-medium text-foreground outline-none focus:border-indigo-500/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">Questions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Device Data Console */}
      <div className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
          <div>
            <h5 className="text-xs font-bold text-rose-500">Danger Zone: Reset All Data</h5>
            <p className="text-[10px] text-muted-foreground">Permanently wipe all session histories, mistake diaries, checked syllabus checklists, and custom settings.</p>
          </div>
        </div>

        {showResetConfirm ? (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-3 animate-[fadeIn_0.2s_ease-out]">
            <span className="text-xs font-bold text-foreground block">⚠️ Are you absolutely sure? All data in IndexedDB will be wiped.</span>
            <div className="flex gap-2">
              <button
                onClick={onResetAllData}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                Yes, Wipe Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-accent/20 hover:bg-accent/45 border border-border text-xs py-2 px-4 rounded-xl text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white font-bold text-xs py-2.5 px-5 rounded-xl border border-rose-500/20 cursor-pointer transition-all"
          >
            Delete My Device Data Logs
          </button>
        )}
      </div>
    </div>
  );
});

export default SettingsTab;
