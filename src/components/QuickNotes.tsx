import { memo } from 'react';
import TargetTracker from './TargetTracker';

interface QuickNotesProps {
  theme: 'slate' | 'cyber' | 'light' | 'glass';
  cardBgClass: string;
  onTargetsCountChange?: (activeCount: number, pendingCount: number) => void;
}

const QuickNotes = memo(function QuickNotes({ theme, cardBgClass, onTargetsCountChange }: QuickNotesProps) {
  return <TargetTracker theme={theme} cardBgClass={cardBgClass} onTargetsCountChange={onTargetsCountChange} />;
});

export default QuickNotes;
