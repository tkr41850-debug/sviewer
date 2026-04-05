// src/metrics/types.ts
// Type contract for the metrics engine.
// All 18 dashboard metrics are typed here with quality indicators.
// Dashboard components (Phase 3 Plans 02-04) consume these types.

export type MetricQuality = 'reliable' | 'limited' | 'insufficient';

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient';

export interface SeverityBucket {
  /** Count of records with abs(deltaY) in (threshold, 1.5x threshold] */
  mild: number;
  /** Count of records with abs(deltaY) in (1.5x threshold, 2.5x threshold] */
  moderate: number;
  /** Count of records with abs(deltaY) > 2.5x threshold */
  severe: number;
}

export interface HourlySlouchRate {
  /** Hour of day (0-23) */
  hour: number;
  /** Slouch rate as percentage (0-100) */
  slouchRate: number;
  /** Number of active records in this hour */
  sampleCount: number;
}

export interface MetricValue<T> {
  value: T;
  quality: MetricQuality;
}

export interface DashboardMetrics {
  /** METR-01: Composite posture score (0-100) */
  postureScore: MetricValue<number>;
  /** METR-02: Percentage of active time spent slouching (0-100) */
  slouchRate: MetricValue<number>;
  /** METR-03: Average time to correct posture after slouch onset (ms) */
  avgTimeToCorrect: MetricValue<number>;
  /** METR-04: Total active screen time excluding screen-off (ms) */
  totalScreenTime: MetricValue<number>;
  /** METR-05: Number of distinct tracking sessions */
  sessionCount: MetricValue<number>;
  /** METR-06: Duration of longest continuous slouch (ms) */
  longestSlouchStreak: MetricValue<number>;
  /** METR-07: Duration of longest continuous good posture (ms) */
  longestGoodStreak: MetricValue<number>;
  /** METR-08: Average time between screen-off periods (ms) */
  breakFrequency: MetricValue<number>;
  /** METR-09: Hour of day (0-23) with highest slouch rate */
  worstHour: MetricValue<number>;
  /** METR-10: Hour of day (0-23) with lowest slouch rate */
  bestHour: MetricValue<number>;
  /** METR-11: Daily posture trend direction */
  dailyTrend: MetricValue<TrendDirection>;
  /** METR-12: Slope of posture score over time (score-units per hour) */
  improvementRate: MetricValue<number>;
  /** METR-13: Distribution of slouch severity */
  severityDistribution: MetricValue<SeverityBucket>;
  /** METR-14: Average time from session start to first slouch (ms) */
  avgTimeToFirstSlouch: MetricValue<number>;
  /** METR-15: Standard deviation of deltaY values */
  postureVolatility: MetricValue<number>;
  /** METR-16: Total time spent slouching (ms) */
  cumulativeSlouchTime: MetricValue<number>;
  /** METR-17: Whether time-to-correct is improving across sessions */
  recoverySpeedTrend: MetricValue<TrendDirection>;
  /** METR-18: Slouch rate per hour of day (24 entries) */
  slouchByHour: MetricValue<HourlySlouchRate[]>;
}
