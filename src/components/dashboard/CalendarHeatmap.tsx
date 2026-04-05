import { Fragment } from 'react';
import { format } from 'date-fns';
import type { PostureRecord } from '../../data/types';

// --- Types ---

export interface HeatmapCell {
  /** Hour of day (0-23) */
  hour: number;
  /** ISO date string "YYYY-MM-DD" */
  day: string;
  /** Slouch rate as percentage (0-100) */
  slouchRate: number;
  /** Number of active records in this cell */
  sampleCount: number;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  days: string[];
  hours: number[];
}

interface CalendarHeatmapProps {
  records: PostureRecord[];
  thresholdPx: number;
}

// --- Helpers ---

/**
 * Compute heatmap data by grouping active records into (day, hour) cells.
 * Grid is bounded to 24 columns x number of distinct days (T-03-06 mitigation).
 */
export function computeHeatmapData(records: PostureRecord[], thresholdPx: number): HeatmapData {
  const cellMap = new Map<string, { total: number; slouching: number }>();
  const daySet = new Set<string>();

  for (const record of records) {
    // Skip screen-off or null deltaY records
    if (record.isScreenOff || record.deltaY === null) continue;

    const date = new Date(record.time);
    const day = date.toISOString().slice(0, 10);
    const hour = date.getHours();
    const key = `${day}-${hour}`;

    daySet.add(day);

    const existing = cellMap.get(key);
    const isSlouching = Math.abs(record.deltaY) > thresholdPx;

    if (existing) {
      existing.total++;
      if (isSlouching) existing.slouching++;
    } else {
      cellMap.set(key, { total: 1, slouching: isSlouching ? 1 : 0 });
    }
  }

  const days = Array.from(daySet).sort();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const cells: HeatmapCell[] = [];
  for (const [key, counts] of cellMap) {
    const day = key.slice(0, 10);
    const hourStr = key.slice(11);
    cells.push({
      day,
      hour: parseInt(hourStr, 10),
      slouchRate: (counts.slouching / counts.total) * 100,
      sampleCount: counts.total,
    });
  }

  return { cells, days, hours };
}

function heatmapColor(slouchRate: number, sampleCount: number): string {
  if (sampleCount === 0) return 'var(--color-surface)';
  if (slouchRate <= 20) return 'oklch(75% 0.2 145)';
  if (slouchRate <= 40) return 'oklch(80% 0.15 120)';
  if (slouchRate <= 60) return 'oklch(80% 0.15 85)';
  if (slouchRate <= 80) return 'oklch(70% 0.18 50)';
  return 'oklch(65% 0.22 25)';
}

function formatHourLabel(h: number): string {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

function formatDayLabel(isoDate: string): string {
  return format(new Date(isoDate + 'T00:00:00'), 'MMM dd');
}

// --- Main component ---

export function CalendarHeatmap({ records, thresholdPx }: CalendarHeatmapProps) {
  const { cells, days } = computeHeatmapData(records, thresholdPx);

  // Build cell lookup map for O(1) access
  const cellLookup = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellLookup.set(`${cell.day}-${cell.hour}`, cell);
  }

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="w-full" aria-label="Posture calendar heatmap">
      <h3
        className="text-sm font-semibold uppercase tracking-wide mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Posture by Hour
      </h3>
      <div className="overflow-x-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(24, minmax(28px, 1fr))`,
            gap: '2px',
          }}
        >
          {/* Header row -- hour labels */}
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={`h-${h}`}
              className="text-center text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {formatHourLabel(h)}
            </div>
          ))}
          {/* Data rows -- one per day */}
          {days.map((day) => (
            <Fragment key={day}>
              <div
                className="text-xs truncate pr-2 flex items-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {formatDayLabel(day)}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = cellLookup.get(`${day}-${h}`);
                const rate = cell?.slouchRate ?? 0;
                const count = cell?.sampleCount ?? 0;
                return (
                  <div
                    key={`${day}-${h}`}
                    className="rounded-sm aspect-square"
                    style={{
                      backgroundColor: heatmapColor(rate, count),
                      minHeight: '20px',
                    }}
                    title={
                      count > 0
                        ? `${day} ${h}:00 — ${Math.round(rate)}% slouch (${count} samples)`
                        : `${day} ${h}:00 — No data`
                    }
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      {/* Color legend */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Good
        </span>
        {[0, 20, 40, 60, 80, 100].map((rate, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: heatmapColor(rate, 1) }}
          />
        ))}
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Poor
        </span>
      </div>
    </div>
  );
}
