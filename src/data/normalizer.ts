import { LTTB } from 'downsample';
import type { Rect, RawEntry, PostureRecord } from './types';

// Timestamp sanity range: 2020-01-01 to 2050-01-01 (Unix ms)
const YEAR_2020_MS = 1577836800000;
const YEAR_2050_MS = 2524608000000;

/**
 * Normalizes any supported timestamp format to Unix milliseconds.
 * Supported: Unix seconds (10 digits), Unix milliseconds (13 digits), ISO 8601 strings.
 * Throws ParseError-compatible message for unrecognised or out-of-range values.
 */
export function normalizeTimestamp(raw: number | string): number {
  if (typeof raw === 'string') {
    // Try ISO 8601 first
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) {
      if (parsed < YEAR_2020_MS || parsed > YEAR_2050_MS) {
        throw new Error(
          `Unrecognised timestamp format — expected Unix seconds, Unix milliseconds, or ISO 8601`,
        );
      }
      return parsed;
    }
    // Fall back to numeric string
    const numeric = Number(raw);
    if (isNaN(numeric)) {
      throw new Error(
        `Unrecognised timestamp format — expected Unix seconds, Unix milliseconds, or ISO 8601`,
      );
    }
    return normalizeTimestamp(numeric);
  }

  // Unix seconds: value < 1e12 (10 digits)
  if (raw < 1e12) {
    const ms = raw * 1000;
    if (ms >= YEAR_2020_MS && ms <= YEAR_2050_MS) return ms;
    throw new Error(
      `Unrecognised timestamp format — expected Unix seconds, Unix milliseconds, or ISO 8601`,
    );
  }

  // Unix milliseconds: value >= 1e12 (13 digits)
  if (raw >= YEAR_2020_MS && raw <= YEAR_2050_MS) return raw;

  throw new Error(
    `Unrecognised timestamp format — expected Unix seconds, Unix milliseconds, or ISO 8601`,
  );
}

/**
 * Returns the vertical midpoint Y of a rect.
 * midpointY = y + h/2
 */
export function computeMidpointY(rect: Rect): number {
  return rect.y + rect.h / 2;
}

/**
 * Computes the median value from an array of numbers.
 * Used for sampling interval calculation.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Marks records as screen-off based on:
 * 1. currentRect === null in the raw entry
 * 2. Timestamp gap > 4x the median sampling interval
 *
 * Returns partial PostureRecord[] (without sessionIndex — assigned by segmentSessions).
 */
export function detectScreenOff(
  entries: Pick<RawEntry, 'timestamp' | 'referenceRect' | 'currentRect'>[],
  medianIntervalMs: number,
): Omit<PostureRecord, 'sessionIndex'>[] {
  const GAP_MULTIPLIER = 4;

  return entries.map((entry, i) => {
    const time = normalizeTimestamp(entry.timestamp);
    const referenceY = computeMidpointY(entry.referenceRect);
    const hasCurrentRect = entry.currentRect !== null;
    const currentY = hasCurrentRect ? computeMidpointY(entry.currentRect!) : null;
    const deltaY = currentY !== null ? currentY - referenceY : null;

    let isScreenOff = !hasCurrentRect;

    if (!isScreenOff && i > 0) {
      const prevTime = normalizeTimestamp(entries[i - 1].timestamp);
      const gap = time - prevTime;
      if (gap > medianIntervalMs * GAP_MULTIPLIER) {
        isScreenOff = true;
      }
    }

    return {
      time,
      referenceY,
      currentY,
      deltaY,
      isSlouching: false, // Charts apply threshold; parser always sets false
      isScreenOff,
    };
  });
}

/**
 * Assigns sessionIndex to each record.
 * A new session starts after any screen-off record (transition from off->on).
 */
export function segmentSessions(
  records: Omit<PostureRecord, 'sessionIndex'>[],
): PostureRecord[] {
  let sessionIndex = 0;
  let prevWasScreenOff = false;

  return records.map((record) => {
    if (!record.isScreenOff && prevWasScreenOff) {
      sessionIndex++;
    }
    prevWasScreenOff = record.isScreenOff;
    return { ...record, sessionIndex };
  });
}

const MAX_CHART_POINTS = 1500;

/**
 * Reduces large datasets to MAX_CHART_POINTS using LTTB algorithm.
 * Returns the original array if already within the limit.
 * Full-resolution data is kept separately for metrics.
 */
export function downsampleForChart(records: PostureRecord[]): PostureRecord[] {
  if (records.length <= MAX_CHART_POINTS) return records;

  // Map to {x, y} for LTTB, preserving original index via a parallel lookup
  const points = records.map((r) => ({
    x: r.time,
    y: r.deltaY ?? 0,
  }));

  const sampled = LTTB(points, MAX_CHART_POINTS) as { x: number; y: number }[];

  // Map back to original records by matching x (time) values
  const timeToRecord = new Map<number, PostureRecord>();
  for (const record of records) {
    if (!timeToRecord.has(record.time)) {
      timeToRecord.set(record.time, record);
    }
  }

  return sampled.map((p) => timeToRecord.get(p.x)!).filter(Boolean);
}
