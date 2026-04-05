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
  onTimeRangeSelect?: (startTime: number, endTime: number) => void;
}

export function Dashboard({ records, thresholdPx, onTimeRangeSelect }: DashboardProps) {
  const metrics = useMetrics(thresholdPx);

  // Compute score breakdown percentages from records (T-03-09 mitigation: memoized)
  const breakdown = useMemo(() => {
    const total = records.length;
    if (total === 0) return { good: 0, slouch: 0, screenOff: 0 };

    let screenOff = 0;
    let slouch = 0;
    let good = 0;

    for (const r of records) {
      if (r.isScreenOff) {
        screenOff++;
      } else if (r.deltaY !== null && Math.abs(r.deltaY) > thresholdPx) {
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
  }, [records, thresholdPx]);

  if (!metrics) return null;

  return (
    <DashboardShell>
      {/* VIEW-01: KPI Cards — per D-02, first section */}
      <KPICards metrics={metrics} />

      {/* VIEW-02: Metric Grid — per D-02, second section */}
      <MetricGrid metrics={metrics} />

      {/* VIEW-03: Session Timeline — per D-02, third section */}
      <SessionTimeline
        records={records}
        thresholdPx={thresholdPx}
        onSegmentClick={onTimeRangeSelect}
      />

      {/* VIEW-04: Calendar Heatmap — per D-02, fourth section */}
      <CalendarHeatmap records={records} thresholdPx={thresholdPx} />

      {/* VIEW-05: Score Breakdown — per D-02, fifth section */}
      <ScoreBreakdown
        goodPercent={breakdown.good}
        slouchPercent={breakdown.slouch}
        screenOffPercent={breakdown.screenOff}
      />
    </DashboardShell>
  );
}
