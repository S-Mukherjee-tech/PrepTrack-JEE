import React, { useState, useEffect, memo } from 'react';
import { Shield, FileText, Scale, Database, X } from 'lucide-react';
import { BrandingLogo } from './BrandingLogo';
import { ThemeType } from '../types';

export type LegalDocKey = 'privacy' | 'terms' | 'disclaimer' | 'storage';

interface LegalFooterProps {
  theme: ThemeType;
  onNavigateTab: (tab: 'dashboard' | 'analytics' | 'questions' | 'syllabus' | 'notes' | 'mock_tests' | 'settings') => void;
}

const LEGAL_SECTIONS: {
  id: LegalDocKey;
  title: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  updated: string;
  paragraphs: { heading: string; body: string }[];
}[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    shortLabel: 'Privacy Policy',
    icon: Shield,
    updated: 'November 2026',
    paragraphs: [
      {
        heading: '1. Local-First Data Architecture',
        body: 'PrepTrack operates strictly as a client-side application. All study sessions, solved question logs, syllabus completion states, mock test records, target checklists, notes, and error book entries are stored exclusively inside your browser (IndexedDB and LocalStorage) on your own device.',
      },
      {
        heading: '2. Zero Collection & Zero Third-Party Sharing',
        body: 'PrepTrack does not require user registration, does not transmit your academic logs or personal notes to external servers, and does not sell, rent, or share user data with third-party advertisers, brokers, or coaching platforms.',
      },
      {
        heading: '3. External Links & Third-Party Services',
        body: 'The dashboard provides optional outbound links to external community resources (such as Telegram groups, exam countdown sites, or study guides). Once you leave PrepTrack via an external link, those independent platforms are governed by their own privacy policies and terms.',
      },
      {
        heading: '4. Your Data Control & Erasure Rights',
        body: 'You retain 100% ownership and control over your data at all times. You may modify individual logs or permanently erase all stored application data at any time from the Settings tab using the "Reset All Data" action or by clearing site data in your browser.',
      },
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    shortLabel: 'Terms of Service',
    icon: FileText,
    updated: 'November 2026',
    paragraphs: [
      {
        heading: '1. Acceptance & Educational License',
        body: 'By accessing and using PrepTrack, you agree to these Terms of Service. PrepTrack grants you a personal, non-exclusive, non-commercial, revocable right to use the workspace for personal study tracking and academic planning.',
      },
      {
        heading: '2. Intellectual Property',
        body: 'The PrepTrack name, custom logo mark, interface design, curated weightage presentations, and underlying source code are protected by applicable copyright and intellectual property laws. Unauthorized redistribution, scraping, or commercial resale of the interface is prohibited.',
      },
      {
        heading: '3. User Responsibility & Local Backups',
        body: 'Because your logs are stored locally within your browser storage, clearing browser cache/site data, switching browsers, or using incognito/private sessions may permanently remove local entries. You are solely responsible for maintaining personal backups of critical notes.',
      },
      {
        heading: '4. Limitation of Liability',
        body: 'PrepTrack is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. PrepTrack does not guarantee uninterrupted browser storage availability, specific exam scores, percentiles, or admission outcomes.',
      },
    ],
  },
  {
    id: 'disclaimer',
    title: 'Exam & Content Disclaimer',
    shortLabel: 'Disclaimer',
    icon: Scale,
    updated: 'November 2026',
    paragraphs: [
      {
        heading: '1. Non-Affiliation Notice',
        body: 'PrepTrack is an independent self-study productivity platform. It is NOT affiliated with, endorsed by, sponsored by, or officially connected to the National Testing Agency (NTA), the Joint Admission Board (JAB), the Indian Institutes of Technology (IITs), or any government examination authority.',
      },
      {
        heading: '2. Syllabus & Weightage Estimates',
        body: 'All chapter breakdowns, JEE Main and JEE Advanced weightage percentages, and typical question counts displayed in the Syllabus Tracker are compiled from historical paper trends for informational and study-planning guidance only.',
      },
      {
        heading: '3. Official Verification Required',
        body: 'Examination patterns, deleted/added topics, marking schemes, and schedules are subject to change by official authorities. Aspirants should always cross-check official information bulletins published at jeemain.nta.nic.in and jeeadv.ac.in.',
      },
    ],
  },
  {
    id: 'storage',
    title: 'Local Storage & Cookie Notice',
    shortLabel: 'Data & Storage',
    icon: Database,
    updated: 'November 2026',
    paragraphs: [
      {
        heading: '1. No Advertising or Tracking Cookies',
        body: 'PrepTrack does not set third-party advertising cookies, behavioral profiling beacons, or cross-site tracking pixels.',
      },
      {
        heading: '2. Strictly Necessary Client Storage',
        body: 'To function as an offline-capable study workspace, PrepTrack uses browser IndexedDB and LocalStorage strictly to remember your selected theme, Pomodoro timer durations, study sessions, daily solved counts, syllabus checkboxes, and notes across sessions.',
      },
      {
        heading: '3. Managing Browser Storage',
        body: 'You may inspect or clear client-side storage anytime via your browser developer tools or site settings. Disabling site storage will prevent PrepTrack from saving your progress between visits.',
      },
    ],
  },
];

export const LegalFooter = memo(function LegalFooter({ theme, onNavigateTab }: LegalFooterProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocKey | null>(null);

  useEffect(() => {
    if (!activeDoc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc]);

  const isLight = theme === 'light';
  const currentSection = LEGAL_SECTIONS.find((s) => s.id === activeDoc) || LEGAL_SECTIONS[0];
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer
        className={`relative z-10 border-t mt-12 pt-10 pb-28 xl:pb-10 transition-colors ${
          isLight
            ? 'border-slate-200/80 bg-white/75 text-slate-600'
            : 'border-white/[0.08] bg-[#040612]/75 text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            {/* Brand Lockup */}
            <div className="space-y-3 max-w-sm">
              <div className="flex items-center gap-3 select-none">
                <div className="relative flex items-center justify-center shrink-0">
                  <div
                    className="absolute -inset-1 rounded-xl opacity-70 pointer-events-none"
                    style={{
                      background:
                        theme === 'cyber'
                          ? 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 72%)'
                          : 'radial-gradient(circle, rgba(56,189,248,0.42) 0%, rgba(34,197,94,0.18) 50%, transparent 75%)',
                    }}
                  />
                  <div className="relative p-1.5 rounded-xl bg-slate-950 border border-white/15 flex items-center justify-center">
                    <BrandingLogo size={20} className="shrink-0" />
                  </div>
                </div>
                <span
                  className={`font-brand text-lg font-extrabold tracking-[-0.03em] leading-none ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Prep
                  <span
                    className={
                      theme === 'cyber'
                        ? 'text-emerald-400'
                        : isLight
                        ? 'text-indigo-600'
                        : 'text-sky-400'
                    }
                  >
                    Track
                  </span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Independent IIT JEE self-study workspace engineered for disciplined preparation tracking, daily question metrics, and offline mistake review.
              </p>
            </div>

            {/* Clean Typographic Link Columns */}
            <div className="grid grid-cols-2 gap-8 sm:gap-14 text-xs">
              <div className="space-y-2.5">
                <h4 className={`font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  Workspace
                </h4>
                <ul className="space-y-2">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'syllabus', label: 'Syllabus Tracker' },
                    { id: 'mock_tests', label: 'Mock Tests' },
                    { id: 'settings', label: 'Settings & Data' },
                  ].map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onNavigateTab(item.id as any)}
                        className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4 cursor-pointer transition-colors text-left"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className={`font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  Legal & Privacy
                </h4>
                <ul className="space-y-2">
                  {LEGAL_SECTIONS.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => setActiveDoc(doc.id)}
                        className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4 cursor-pointer transition-colors text-left"
                      >
                        {doc.shortLabel}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Legal Compliance Bar */}
          <div
            className={`pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] ${
              isLight ? 'border-slate-200/80 text-slate-500' : 'border-white/[0.06] text-slate-400'
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>© {currentYear} PrepTrack. All rights reserved.</span>
              <span aria-hidden="true">·</span>
              <span>Not affiliated with NTA, JAB, or IITs.</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => setActiveDoc('privacy')}
                className="hover:text-foreground hover:underline underline-offset-4 cursor-pointer"
              >
                Privacy
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setActiveDoc('terms')}
                className="hover:text-foreground hover:underline underline-offset-4 cursor-pointer"
              >
                Terms
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setActiveDoc('disclaimer')}
                className="hover:text-foreground hover:underline underline-offset-4 cursor-pointer"
              >
                Disclaimer
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setActiveDoc('storage')}
                className="hover:text-foreground hover:underline underline-offset-4 cursor-pointer"
              >
                Data Notice
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* LEGAL DOCUMENT MODAL */}
      {activeDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75"
          onClick={() => setActiveDoc(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#0b1021] border-white/15 text-slate-100'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
                isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <currentSection.icon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h3 id="legal-modal-title" className="text-base font-bold tracking-tight">
                    {currentSection.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Effective &amp; Last Updated: {currentSection.updated}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                aria-label="Close legal document"
                className="p-2 rounded-xl hover:bg-accent/20 text-muted-foreground hover:text-foreground cursor-pointer transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Switcher Tabs */}
            <div
              className={`px-6 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
                isLight ? 'border-slate-200 bg-slate-50/40' : 'border-white/[0.07] bg-black/20'
              }`}
            >
              {LEGAL_SECTIONS.map((doc) => {
                const isSelected = doc.id === activeDoc;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveDoc(doc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-white font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
                    }`}
                  >
                    {doc.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed">
              {currentSection.paragraphs.map((item) => (
                <section key={item.heading} className="space-y-1.5">
                  <h4 className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.heading}
                  </h4>
                  <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                    {item.body}
                  </p>
                </section>
              ))}
            </div>

            {/* Modal Footer */}
            <div
              className={`px-6 py-3.5 border-t flex items-center justify-between text-xs ${
                isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <span className="text-muted-foreground">PrepTrack Legal &amp; Compliance</span>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:opacity-90 cursor-pointer transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default LegalFooter;
