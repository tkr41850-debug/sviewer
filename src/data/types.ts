// src/data/types.ts
// Canonical data contract for SViewer.
// All downstream phases (charting, metrics, export) build against these types.
// DO NOT import from any charting library here — keep this framework-agnostic.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Raw entry from the slouch tracker JSON file. */
export interface RawEntry {
  timestamp: number | string;
  referenceRect: Rect;
  currentRect: Rect | null;
}

/**
 * Normalized record after parsing + processing.
 * All downstream code uses this type — never the raw RawEntry.
 */
export interface PostureRecord {
  /** Unix milliseconds — always normalized from any input format. */
  time: number;
  /** Midpoint Y of reference rect (calibrated upright position). */
  referenceY: number;
  /** Midpoint Y of current rect. null when screen is off. */
  currentY: number | null;
  /** currentY - referenceY. Positive = slouching down. null when screen is off. */
  deltaY: number | null;
  /** True when deltaY exceeds the slouch threshold. Set to false during parsing; charts apply threshold later. */
  isSlouching: boolean;
  /** True when currentRect was null OR a timestamp gap was detected. */
  isScreenOff: boolean;
  /** Index of the session this record belongs to (0-based). */
  sessionIndex: number;
}

export interface ParseError {
  code: 'MALFORMED_JSON' | 'MISSING_REQUIRED_FIELDS' | 'UNRECOGNISED_TIMESTAMP' | 'EMPTY_FILE';
  message: string;
  /** Index of the entry that caused the error, if applicable. */
  entryIndex?: number;
}

export interface ParseResult {
  records: PostureRecord[];
  errors: ParseError[];
  metadata: {
    /** Unix milliseconds */
    startTime: number;
    /** Unix milliseconds */
    endTime: number;
    totalEntries: number;
    sessionCount: number;
    /** Median interval between records in milliseconds */
    samplingIntervalMs: number;
  };
}

/**
 * Chart-ready data split: downsampled points for rendering, full records for metrics.
 * Chart receives `points`. Metrics engine receives `fullRecords`.
 */
export interface ChartData {
  /** Up to 1,500 LTTB-sampled points for chart rendering. */
  points: PostureRecord[];
  /** Original full-resolution records — never rendered directly, used for metric calculations. */
  fullRecords: PostureRecord[];
}

/** Configuration for the slouch threshold line on the chart. */
export interface ThresholdConfig {
  /** Threshold value — interpreted as percentage of referenceY height or absolute px based on `unit`. */
  value: number;
  /** Unit for threshold interpretation. */
  unit: '%' | 'px';
}
