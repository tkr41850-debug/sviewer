import type { RawEntry, ParseResult, ParseError, PostureRecord } from './types';
import { validateEntries } from './validator';
import {
  normalizeTimestamp,
  detectScreenOff,
  segmentSessions,
  downsampleForChart,
} from './normalizer';

/**
 * Computes the median of an array of numbers.
 */
function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Main entry point for data pipeline.
 * Accepts a raw JSON string from file upload or URL parameter.
 * Returns a ParseResult with normalized records, any errors, and metadata.
 *
 * This function is called from the Web Worker (src/data/worker.ts) and from
 * App.tsx for URL parameter loading.
 *
 * Anti-patterns avoided:
 * - No `any` used for raw JSON (uses `unknown` + type guards)
 * - No metric calculations (deferred to Phase 3)
 * - No charting library coupling
 */
export function parseAndProcess(jsonText: string): ParseResult {
  // Step 1: Parse JSON
  let rawData: unknown;
  try {
    rawData = JSON.parse(jsonText);
  } catch {
    return {
      records: [],
      errors: [
        {
          code: 'MALFORMED_JSON',
          message: 'Invalid JSON — check that the file is a valid slouch tracker export',
        },
      ],
      metadata: {
        startTime: 0,
        endTime: 0,
        totalEntries: 0,
        sessionCount: 0,
        samplingIntervalMs: 0,
      },
    };
  }

  // Step 2: Expect an array
  if (!Array.isArray(rawData)) {
    return {
      records: [],
      errors: [
        {
          code: 'MALFORMED_JSON',
          message: 'Invalid JSON — check that the file is a valid slouch tracker export',
        },
      ],
      metadata: {
        startTime: 0,
        endTime: 0,
        totalEntries: 0,
        sessionCount: 0,
        samplingIntervalMs: 0,
      },
    };
  }

  // Step 3: Schema validation
  const validationErrors = validateEntries(rawData);
  if (validationErrors.length > 0) {
    return {
      records: [],
      errors: validationErrors,
      metadata: {
        startTime: 0,
        endTime: 0,
        totalEntries: rawData.length,
        sessionCount: 0,
        samplingIntervalMs: 0,
      },
    };
  }

  // Step 4: Normalize timestamps and detect screen-off (requires median interval)
  const rawEntries = rawData as RawEntry[];

  // Compute normalized timestamps first to get intervals
  const timestamps: number[] = [];
  const timestampErrors: ParseError[] = [];

  for (let i = 0; i < rawEntries.length; i++) {
    try {
      timestamps.push(normalizeTimestamp(rawEntries[i].timestamp));
    } catch {
      timestampErrors.push({
        code: 'UNRECOGNISED_TIMESTAMP',
        message:
          'Unrecognised timestamp format — expected Unix seconds, Unix milliseconds, or ISO 8601',
        entryIndex: i,
      });
    }
  }

  if (timestampErrors.length > 0) {
    return {
      records: [],
      errors: timestampErrors,
      metadata: {
        startTime: 0,
        endTime: 0,
        totalEntries: rawEntries.length,
        sessionCount: 0,
        samplingIntervalMs: 0,
      },
    };
  }

  // Step 5: Compute median sampling interval
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const samplingIntervalMs = computeMedian(intervals);

  // Step 6: Detect screen-off, segment sessions
  const partialRecords = detectScreenOff(rawEntries, samplingIntervalMs);
  const fullRecords: PostureRecord[] = segmentSessions(partialRecords);

  // Step 7: Compute metadata
  const activeSessions = new Set(
    fullRecords.filter((r) => !r.isScreenOff).map((r) => r.sessionIndex)
  );

  return {
    records: fullRecords,
    errors: [],
    metadata: {
      startTime: timestamps[0],
      endTime: timestamps[timestamps.length - 1],
      totalEntries: fullRecords.length,
      sessionCount: activeSessions.size,
      samplingIntervalMs,
    },
  };
}

// downsampleForChart is re-exported for callers that need chart-ready data
export { downsampleForChart };
