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

/** Threshold configuration for slouch detection. */
export interface ThresholdConfig {
  /** Threshold value (pixels or percentage based on unit). */
  value: number;
  /** Unit of the threshold: 'px' for absolute pixels, '%' for percentage of referenceY. */
  unit: 'px' | '%';
}

/** Which chart rendering engine is active. */
export type ChartEngine = 'recharts' | 'visx';

/** A user-created text annotation attached to a specific data point on the graph. */
export interface Annotation {
  /** Unique identifier (nanoid or crypto.randomUUID). */
  id: string;
  /** The annotation text content. */
  text: string;
  /** Unix milliseconds — the time coordinate of the annotated data point. */
  time: number;
  /** The deltaY value at the annotated data point. */
  deltaY: number;
}

/** State for day-over-day comparison mode. */
export interface ComparisonState {
  /** Whether comparison mode is currently active. */
  enabled: boolean;
  /** ISO date string (YYYY-MM-DD) for the first (primary) day, or null if not selected. */
  day1: string | null;
  /** ISO date string (YYYY-MM-DD) for the second (overlay) day, or null if not selected. */
  day2: string | null;
}

/**
 * Props contract that both Recharts and visx chart engine components implement.
 * The parent component (PostureChart) passes these props; each engine renders accordingly.
 * Per D-13: common interface enabling engine-agnostic parent logic.
 */
export interface ChartAdapterProps {
  /** LTTB-downsampled PostureRecord[] for the primary data series. */
  data: PostureRecord[];
  /** Slouch threshold in absolute pixels (already converted from % if needed). */
  thresholdPx: number;
  /** Visible time domain [startTime, endTime] in Unix ms. undefined = full range. */
  visibleDomain?: [number, number];
  /** Callback when the user brush-selects a time range. null = reset to full range. */
  onBrushChange?: (domain: [number, number] | null) => void;
  /** Current annotations to render on the chart. */
  annotations: Annotation[];
  /** Callback when user clicks a data point to create a new annotation. Receives time and deltaY of the clicked point. */
  onAnnotationCreate?: (time: number, deltaY: number) => void;
  /** Callback when user edits an existing annotation's text. */
  onAnnotationUpdate?: (id: string, text: string) => void;
  /** Callback when user deletes an annotation. */
  onAnnotationDelete?: (id: string) => void;
  /** Optional second-day data series for day-over-day comparison (per D-04/D-05/D-06). */
  comparisonData?: PostureRecord[];
  /** Label for the comparison series (e.g., "Apr 03"). */
  comparisonLabel?: string;
  /** Label for the primary series (e.g., "Apr 04"). */
  primaryLabel?: string;
  /** When true, X-axis shows time-of-day (00:00-23:59) instead of absolute timestamps. Per D-06. */
  normalizeTimeAxis?: boolean;
}
