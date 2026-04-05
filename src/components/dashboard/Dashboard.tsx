import { useMemo } from 'react';
import type { PostureRecord, ParseResult } from '../../data/types';
import { useMetrics } from '../../hooks/useMetrics';
import { DashboardShell } from './DashboardShell';
import { KPICards } from './KPICards';
import { MetricGrid } from './MetricGrid';
import { SessionTimeline } from './SessionTimeline';
import { CalendarHeatmap } from './CalendarHeatmap';
import { ScoreBreakdown } from './ScoreBreakdown';

interface DashboardProps {
  records: PostureRecord[];
  metadata: ParseResult['metadata'];
  thresholdPx: number;
  direction?: '>' | '<';
  onTimeRangeSelect?: (startTime: number, endTime: number) => void;
}

function isSlouching(deltaY: number, thresholdPx: number, direction: '>' | '<'): boolean {
  return direction === '>' ? deltaY > thresholdPx : deltaY < -thresholdPx;
}

export function Dashboard({
  records,
  thresholdPx,
  direction = '>',
  onTimeRangeSelect,
}: DashboardProps) {
  const metrics = useMetrics(thresholdPx, direction);

  // Compute score breakdown percentages from records
  const breakdown = useMemo(() => {
    const total = records.length;
    if (total === 0) return { good: 0, slouch: 0, screenOff: 0 };

    let screenOff = 0;
    let slouch = 0;
    let good = 0;

    for (const r of records) {
      if (r.isScreenOff) {
        screenOff++;
      } else if (r.deltaY !== null && isSlouching(r.deltaY, thresholdPx, direction)) {
        slouch++;
      } else {
        good++;
      }
    }

    return {
      good: (good / total) * 100,
      slouch: (slouch / total) * 100,
      screenOff: (screenOff / total) * 100,
    };
  }, [records, thresholdPx, direction]);

  if (!metrics) return null;

  return (
    <DashboardShell>
      <KPICards metrics={metrics} />
      <MetricGrid metrics={metrics} />
      <SessionTimeline
        records={records}
        thresholdPx={thresholdPx}
        direction={direction}
        onSegmentClick={onTimeRangeSelect}
      />
      <CalendarHeatmap records={records} thresholdPx={thresholdPx} direction={direction} />
      <ScoreBreakdown
        goodPercent={breakdown.good}
        slouchPercent={breakdown.slouch}
        screenOffPercent={breakdown.screenOff}
      />
    </DashboardShell>
  );
}
