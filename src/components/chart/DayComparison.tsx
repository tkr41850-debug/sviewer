import { useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { useChartState, useChartDispatch } from '../../stores/chartStore';
import type { PostureRecord } from '../../data/types';

/**
 * Extract unique dates (YYYY-MM-DD) present in the dataset.
 * Returns sorted array of ISO date strings.
 */
export function extractAvailableDates(records: PostureRecord[]): string[] {
  const dates = new Set<string>();
  for (const r of records) {
    dates.add(format(new Date(r.time), 'yyyy-MM-dd'));
  }
  return Array.from(dates).sort();
}

/**
 * Filter records to only those on the specified date.
 */
export function extractDayRecords(records: PostureRecord[], dateStr: string): PostureRecord[] {
  const target = parseISO(dateStr);
  return records.filter((r) => isSameDay(new Date(r.time), target));
}

/**
 * Convert timestamp to minutes since midnight (0-1439).
 * Used to normalize X-axis when comparing days (per D-06).
 */
export function normalizeToMinuteOfDay(timeMs: number): number {
  const d = new Date(timeMs);
  return d.getHours() * 60 + d.getMinutes();
}

interface DayComparisonProps {
  records: PostureRecord[]; // fullRecords (not downsampled) for date extraction
}

/**
 * Day-over-day comparison controls.
 * Renders a checkbox to enable comparison mode and two date picker dropdowns
 * populated with available dates from the dataset (per D-04).
 * Day 1 uses primary accent color, Day 2 uses secondary color (per D-05).
 * Hidden when dataset spans only one day.
 */
export function DayComparison({ records }: DayComparisonProps) {
  const { comparison } = useChartState();
  const chartDispatch = useChartDispatch();
  const availableDates = useMemo(() => extractAvailableDates(records), [records]);

  // Only show comparison UI if dataset spans multiple days
  if (availableDates.length < 2) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
        <input
          type="checkbox"
          checked={comparison.enabled}
          onChange={(e) =>
            chartDispatch({
              type: 'SET_COMPARISON',
              payload: { enabled: e.target.checked },
            })
          }
        />
        Compare days
      </label>

      {comparison.enabled && (
        <>
          {/* Day 1 selector -- primary accent color indicator per D-05 */}
          <div className="flex items-center gap-1">
            <span className="h-0.5 w-3 rounded" style={{ background: 'var(--color-chart-line)' }} />
            <select
              value={comparison.day1 ?? ''}
              onChange={(e) =>
                chartDispatch({
                  type: 'SET_COMPARISON',
                  payload: { day1: e.target.value || null },
                })
              }
              className="rounded px-1 py-0.5 text-xs"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">Day 1...</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {format(parseISO(d), 'MMM dd')}
                </option>
              ))}
            </select>
          </div>

          {/* Day 2 selector -- secondary color indicator per D-05 */}
          <div className="flex items-center gap-1">
            <span
              className="h-0.5 w-3 rounded"
              style={{ background: 'var(--color-destructive)', opacity: 0.7 }}
            />
            <select
              value={comparison.day2 ?? ''}
              onChange={(e) =>
                chartDispatch({
                  type: 'SET_COMPARISON',
                  payload: { day2: e.target.value || null },
                })
              }
              className="rounded px-1 py-0.5 text-xs"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">Day 2...</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {format(parseISO(d), 'MMM dd')}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
