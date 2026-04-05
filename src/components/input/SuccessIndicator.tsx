import { CheckCircle } from 'lucide-react';
import type { ParseResult } from '../../data/types';
import { differenceInCalendarDays } from 'date-fns';

interface SuccessIndicatorProps {
  result: ParseResult;
}

export function SuccessIndicator({ result }: SuccessIndicatorProps) {
  const { totalEntries, startTime, endTime } = result.metadata;
  const days =
    startTime && endTime ? differenceInCalendarDays(new Date(endTime), new Date(startTime)) + 1 : 1;

  return (
    <div
      className="flex items-center gap-3 rounded-lg p-4"
      style={{ background: 'var(--color-surface)' }}
      aria-live="polite"
    >
      <CheckCircle
        className="w-5 h-5 flex-shrink-0"
        style={{ color: 'var(--color-accent)' }}
        aria-hidden="true"
      />
      <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
        Data loaded — {totalEntries.toLocaleString()} entries across {days}{' '}
        {days === 1 ? 'day' : 'days'}
      </p>
    </div>
  );
}
