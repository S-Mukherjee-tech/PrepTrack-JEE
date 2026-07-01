export type Subject = 'physics' | 'chemistry' | 'math';
export type StudyMode = 'normal' | 'pomodoro' | 'test';

export interface StudySession {
  id: string;
  startTime: number; // millisecond timestamp
  endTime: number; // millisecond timestamp
  duration: number; // seconds
  sessionName: string; // e.g. "Session 1", "Morning Session"
  mode: StudyMode;
}

export interface DailyQuestions {
  date: string; // YYYY-MM-DD
  physics: number;
  chemistry: number;
  math: number;
  
  // PYQs solved
  physics_pyq_main: number;
  physics_pyq_adv: number;
  chemistry_pyq_main: number;
  chemistry_pyq_adv: number;
  math_pyq_main: number;
  math_pyq_adv: number;
}

export interface ErrorBookItem {
  id: string;
  subject: Subject;
  chapter: string;
  mistake: string;
  correction: string;
  timestamp: number;
  difficulty?: 'low' | 'medium' | 'high';
}

export interface SpecialImportanceItem {
  id: string;
  subject: Subject;
  title: string;
  content: string;
  topic: string;
  timestamp: number;
}

export interface Chapter {
  id: string;
  name: string;
  subject: Subject;
  classLevel: '11' | '12';
}

export interface FeedbackItem {
  rating: number; // 1 to 5
  category: 'bug' | 'performance' | 'feature' | 'other';
  comment: string;
  timestamp: number;
}

export type ThemeType = 'slate' | 'cyber' | 'light' | 'glass';

export interface UserSettings {
  theme: ThemeType;
  pomodoroWorkDuration: number; // minutes
  pomodoroBreakDuration: number; // minutes
  dailyStudyMinutesGoal?: number; // target minutes of study per day
  dailyQuestionsSolvedGoal?: number; // target questions solved per day
}

export interface SubjectStats {
  score: number;
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface MockTest {
  id: string;
  date: string; // YYYY-MM-DD
  pattern: 'JEE Main' | 'JEE Advanced';
  fullMarks: number;
  totalMarksScored: number;
  physics: SubjectStats;
  chemistry: SubjectStats;
  math: SubjectStats;
  notes?: string;
  timestamp: number;
}

