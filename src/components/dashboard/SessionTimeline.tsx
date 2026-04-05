import type { PostureRecord } from '../../data/types';

// --- Types ---

export interface TimelineSegment {
  startTime: number;
  endTime: number;
  type: 'good' | 'slouch' | 'screenOff';
  durationMs: number;
}

interface SessionTimelineProps {
  records: PostureRecord[];
  thresholdPx: number;
  onSegmentClick?: (startTime: number, endTime: number) => void;
}

// --- Helpers ---

function segmentColor(type: 'good' | 'slouch' | 'screenOff'): string {
  switch (type) {
    case 'good':
      return 'oklch(65% 0.2 145)';
    case 'slouch':
      return 'var(--color-destructive)';
    case 'screenOff':
      return 'var(--color-border)';
  }
}

function formatSegmentDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function classifyRecord(
  record: PostureRecord,
  thresholdPx: number
): 'good' | 'slouch' | 'screenOff' {
  if (record.isScreenOff) return 'screenOff';
  if (record.deltaY !== null && Math.abs(record.deltaY) > thresholdPx) return 'slouch';
  return 'good';
}

/**
 * Compute contiguous segments from a sequence of posture records.
 * Consecutive records with the same state are merged into one segment.
 * Segment count is bounded by state transitions, not record count (T-03-07 mitigation).
 */
export function computeSegments(records: PostureRecord[], thresholdPx: number): TimelineSegment[] {
  if (records.length === 0) return [];

  const segments: TimelineSegment[] = [];
  let currentType = classifyRecord(records[0], thresholdPx);
  let segStart = records[0].time;
  let segLastTime = records[0].time;

  for (let i = 1; i < records.length; i++) {
    const recType = classifyRecord(records[i], thresholdPx);
    if (recType !== currentType) {
      // Close current segment — endTime is this record's time (start of next state)
      segments.push({
        startTime: segStart,
        endTime: records[i].time,
        type: currentType,
        durationMs: records[i].time - segStart,
      });
      currentType = recType;
      segStart = records[i].time;
    }
    segLastTime = records[i].time;
  }

  // Close final segment
  // For the final segment's end time, estimate by adding median interval
  // between records or use last record time if single record segment
  let finalEndTime = segLastTime;
  if (records.length >= 2) {
    // Compute median interval across all records for a reasonable final segment duration
    const intervals: number[] = [];
    for (let i = 1; i < records.length; i++) {
      const diff = records[i].time - records[i - 1].time;
      if (diff > 0) intervals.push(diff);
    }
    if (intervals.length > 0) {
      intervals.sort((a, b) => a - b);
      const medianInterval = intervals[Math.floor(intervals.length / 2)];
      finalEndTime = segLastTime + medianInterval;
    }
  }

  segments.push({
    startTime: segStart,
    endTime: finalEndTime,
    type: currentType,
    durationMs: finalEndTime - segStart,
  });

  return segments;
}

// --- Sub-components ---

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </div>
  );
}

// --- Main component ---

export function SessionTimeline({ records, thresholdPx, onSegmentClick }: SessionTimelineProps) {
  const segments = computeSegments(records, thresholdPx);
  const totalDuration = segments.reduce((sum, s) => sum + s.durationMs, 0);

  if (segments.length === 0 || totalDuration === 0) {
    return null;
  }

  return (
    <div className="w-full" aria-label="Session timeline">
      <div className="flex items-center mb-2">
        <h3
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Session Timeline
        </h3>
      </div>
      <div
        className="w-full h-8 rounded-md overflow-hidden flex"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {segments.map((seg, i) => (
          <button
            key={i}
            className="h-full transition-opacity hover:opacity-80"
            style={{
              width: `${(seg.durationMs / totalDuration) * 100}%`,
              backgroundColor: segmentColor(seg.type),
              cursor: onSegmentClick ? 'pointer' : 'default',
              minWidth: '1px',
            }}
            onClick={() => onSegmentClick?.(seg.startTime, seg.endTime)}
            title={`${seg.type === 'screenOff' ? 'Screen Off' : seg.type === 'slouch' ? 'Slouching' : 'Good Posture'} — ${formatSegmentDuration(seg.durationMs)}`}
            aria-label={`${seg.type} segment, ${formatSegmentDuration(seg.durationMs)}`}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        <LegendItem color="oklch(65% 0.2 145)" label="Good" />
        <LegendItem color="var(--color-destructive)" label="Slouching" />
        <LegendItem color="var(--color-border)" label="Screen Off" />
      </div>
    </div>
  );
}
