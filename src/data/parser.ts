import type { RawEntry, ParseResult, ParseError, PostureRecord } from './types';
import { validateEntries } from './validator';
import {
  normalizeTimestamp,
  detectScreenOff,
  segmentSessions,
  downsampleForChart,
} from './normalizer';
import { parseCsv, isCsvFormat } from './csvParser';

/**
 * Computes the median of an array of numbers.
 */
function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Shared error result for format-level failures. */
function formatError(errors: ParseError[], totalEntries = 0): ParseResult {
  return {
    records: [],
    errors,
    metadata: { startTime: 0, endTime: 0, totalEntries, sessionCount: 0, samplingIntervalMs: 0 },
  };
}

/**
 * Processes a validated RawEntry[] through the normalisation pipeline.
 * Shared by both the JSON and CSV ingestion paths.
 */
function processEntries(rawEntries: RawEntry[]): ParseResult {
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
    return formatError(timestampErrors, rawEntries.length);
  }

  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const samplingIntervalMs = computeMedian(intervals);

  const partialRecords = detectScreenOff(rawEntries, samplingIntervalMs);
  const fullRecords: PostureRecord[] = segmentSessions(partialRecords);

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

/**
 * Main entry point for the data pipeline.
 * Accepts raw text from file upload or URL parameter — auto-detects JSON or CSV format.
 *
 * Supported formats:
 *  - JSON array of {timestamp, referenceRect, currentRect} objects
 *  - CSV: "YYYY-MM-DD HH:MM:SS,BoundingBox(...)|None,BoundingBox(...)|None"
 *    (col2 = referenceRect, col3 = currentRect; rows with None referenceRect skipped)
 *
 * Called from the Web Worker (src/data/worker.ts) and App.tsx (URL param path).
 */
export function parseAndProcess(rawText: string): ParseResult {
  // --- CSV path ---
  if (isCsvFormat(rawText)) {
    const entries = parseCsv(rawText);
    if (entries.length === 0) {
      return formatError([
        {
          code: 'EMPTY_FILE',
          message:
            'No valid rows found — the file must contain at least one row with a calibrated reference position',
        },
      ]);
    }
    return processEntries(entries);
  }

  // --- JSON path ---
  let rawData: unknown;
  try {
    rawData = JSON.parse(rawText);
  } catch {
    return formatError([
      {
        code: 'MALFORMED_JSON',
        message: 'Invalid JSON — check that the file is a valid slouch tracker export',
      },
    ]);
  }

  if (!Array.isArray(rawData)) {
    return formatError([
      {
        code: 'MALFORMED_JSON',
        message: 'Invalid JSON — check that the file is a valid slouch tracker export',
      },
    ]);
  }

  const validationErrors = validateEntries(rawData);
  if (validationErrors.length > 0) {
    return formatError(validationErrors, rawData.length);
  }

  return processEntries(rawData as RawEntry[]);
}

// downsampleForChart is re-exported for callers that need chart-ready data
export { downsampleForChart };
