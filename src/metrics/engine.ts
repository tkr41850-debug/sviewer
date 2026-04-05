// src/metrics/engine.ts
// Metrics computation engine.
// Pure function: PostureRecord[] + metadata + threshold -> DashboardMetrics.
// All downstream dashboard views consume the output of computeAllMetrics.

import type { PostureRecord, ParseResult } from '../data/types';
import type {
  DashboardMetrics,
  MetricQuality,
  MetricValue,
  TrendDirection,
  SeverityBucket,
  HourlySlouchRate,
} from './types';

export interface MetricsInput {
  records: PostureRecord[];
  metadata: ParseResult['metadata'];
  thresholdPx: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────

interface Streak {
  startTime: number;
  endTime: number;
  type: 'slouch' | 'good';
}

/** Filters to active (non-screen-off, non-null deltaY) records. */
function computeActiveRecords(records: PostureRecord[]): PostureRecord[] {
  return records.filter((r) => !r.isScreenOff && r.deltaY !== null);
}

/** Determines whether a record is slouching based on threshold. */
function isSlouching(record: PostureRecord, thresholdPx: number): boolean {
  return record.deltaY !== null && Math.abs(record.deltaY) > thresholdPx;
}

/**
 * Walks active records and identifies consecutive runs of slouching vs good posture.
 * Only considers non-screen-off records with non-null deltaY.
 */
function computeStreaks(records: PostureRecord[], thresholdPx: number): Streak[] {
  const active = computeActiveRecords(records);
  if (active.length === 0) return [];

  const streaks: Streak[] = [];
  let currentType: 'slouch' | 'good' = isSlouching(active[0], thresholdPx) ? 'slouch' : 'good';
  let startTime = active[0].time;

  for (let i = 1; i < active.length; i++) {
    const type = isSlouching(active[i], thresholdPx) ? 'slouch' : 'good';
    if (type !== currentType) {
      streaks.push({ startTime, endTime: active[i - 1].time, type: currentType });
      currentType = type;
      startTime = active[i].time;
    }
  }
  // Push final streak
  streaks.push({ startTime, endTime: active[active.length - 1].time, type: currentType });

  return streaks;
}

/**
 * Groups active records by hour and computes slouch rate per hour.
 * Returns a Map from hour (0-23) to { total, slouching } counts.
 */
function computeHourlyData(
  records: PostureRecord[],
  thresholdPx: number
): Map<number, { total: number; slouching: number }> {
  const active = computeActiveRecords(records);
  const hourMap = new Map<number, { total: number; slouching: number }>();

  for (const record of active) {
    const hour = new Date(record.time).getHours();
    const entry = hourMap.get(hour) ?? { total: 0, slouching: 0 };
    entry.total++;
    if (isSlouching(record, thresholdPx)) {
      entry.slouching++;
    }
    hourMap.set(hour, entry);
  }

  return hourMap;
}

/** Returns quality based on sample count thresholds. */
function determineQuality(
  sampleCount: number,
  minReliable: number,
  minLimited: number
): MetricQuality {
  if (sampleCount >= minReliable) return 'reliable';
  if (sampleCount >= minLimited) return 'limited';
  return 'insufficient';
}

/** Safe division — returns 0 when denominator is 0. */
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/** Clamp value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Count screen-off gaps (transitions into screen-off state). */
function countScreenOffGaps(records: PostureRecord[]): number {
  let count = 0;
  for (let i = 0; i < records.length; i++) {
    if (records[i].isScreenOff && (i === 0 || !records[i - 1].isScreenOff)) {
      count++;
    }
  }
  return count;
}

/** Compute total screen time: sum of intervals between consecutive active records. */
function computeTotalScreenTime(records: PostureRecord[]): number {
  const active = computeActiveRecords(records);
  if (active.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < active.length; i++) {
    total += active[i].time - active[i - 1].time;
  }
  return total;
}

/** Standard deviation of an array of numbers. */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Simple linear regression — returns the slope.
 * X and Y arrays must be same length. Returns 0 for insufficient data.
 */
function linearRegressionSlope(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}

// ─── Insufficient defaults ────────────────────────────────────────

function insufficientMetrics(): DashboardMetrics {
  const q: MetricQuality = 'insufficient';
  return {
    postureScore: { value: 0, quality: q },
    slouchRate: { value: 0, quality: q },
    avgTimeToCorrect: { value: 0, quality: q },
    totalScreenTime: { value: 0, quality: q },
    sessionCount: { value: 0, quality: q },
    longestSlouchStreak: { value: 0, quality: q },
    longestGoodStreak: { value: 0, quality: q },
    breakFrequency: { value: 0, quality: q },
    worstHour: { value: 0, quality: q },
    bestHour: { value: 0, quality: q },
    dailyTrend: { value: 'insufficient', quality: q },
    improvementRate: { value: 0, quality: q },
    severityDistribution: { value: { mild: 0, moderate: 0, severe: 0 }, quality: q },
    avgTimeToFirstSlouch: { value: 0, quality: q },
    postureVolatility: { value: 0, quality: q },
    cumulativeSlouchTime: { value: 0, quality: q },
    recoverySpeedTrend: { value: 'insufficient', quality: q },
    slouchByHour: {
      value: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        slouchRate: 0,
        sampleCount: 0,
      })),
      quality: q,
    },
  };
}

// ─── Main Engine ──────────────────────────────────────────────────

/**
 * Computes all 18 posture metrics from PostureRecord[] data.
 *
 * @param input.records - Full-resolution PostureRecord[] (not downsampled)
 * @param input.metadata - ParseResult metadata (startTime, endTime, sessionCount, etc.)
 * @param input.thresholdPx - Slouch threshold in pixels; abs(deltaY) > threshold = slouching
 * @returns DashboardMetrics with all 18 fields, each wrapped in MetricValue with quality indicator
 */
export function computeAllMetrics(input: MetricsInput): DashboardMetrics {
  const { records, thresholdPx } = input;

  const activeRecords = computeActiveRecords(records);

  // Early return for no active data
  if (activeRecords.length === 0) {
    return insufficientMetrics();
  }

  const slouchingRecords = activeRecords.filter((r) => isSlouching(r, thresholdPx));
  const streaks = computeStreaks(records, thresholdPx);
  const slouchStreaks = streaks.filter((s) => s.type === 'slouch');
  const goodStreaks = streaks.filter((s) => s.type === 'good');
  const hourlyData = computeHourlyData(records, thresholdPx);
  const totalScreenTime = computeTotalScreenTime(records);
  const screenOffGaps = countScreenOffGaps(records);

  // ── METR-02: Slouch Rate ──
  const slouchRateValue = safeDivide(slouchingRecords.length, activeRecords.length) * 100;
  const activityQuality = determineQuality(activeRecords.length, 60, 10);
  const slouchRate: MetricValue<number> = {
    value: slouchRateValue,
    quality: activityQuality,
  };

  // ── METR-03: Average Time to Correct ──
  const slouchStreakDurations = slouchStreaks.map((s) => s.endTime - s.startTime);
  const avgTimeToCorrectValue =
    slouchStreakDurations.length > 0
      ? slouchStreakDurations.reduce((a, b) => a + b, 0) / slouchStreakDurations.length
      : 0;
  const avgTimeToCorrect: MetricValue<number> = {
    value: avgTimeToCorrectValue,
    quality: determineQuality(slouchStreaks.length, 3, 1),
  };

  // ── METR-15: Posture Volatility ──
  const deltaYValues = activeRecords
    .filter((r) => r.deltaY !== null)
    .map((r) => r.deltaY as number);
  const postureVolatilityValue = standardDeviation(deltaYValues);
  const postureVolatility: MetricValue<number> = {
    value: postureVolatilityValue,
    quality: determineQuality(deltaYValues.length, 30, 5),
  };

  // ── METR-01: Posture Score ──
  const volatilityPenalty = Math.min(postureVolatilityValue, 50);
  const correctionPenalty = Math.min(safeDivide(avgTimeToCorrectValue, 60000), 50);
  const postureScoreValue = clamp(
    100 - slouchRateValue - volatilityPenalty * 0.1 - correctionPenalty * 0.1,
    0,
    100
  );
  const postureScore: MetricValue<number> = {
    value: postureScoreValue,
    quality: activityQuality,
  };

  // ── METR-04: Total Screen Time ──
  const totalScreenTimeMetric: MetricValue<number> = {
    value: totalScreenTime,
    quality: determineQuality(activeRecords.length, 10, 2),
  };

  // ── METR-05: Session Count ──
  const uniqueSessions = new Set(activeRecords.map((r) => r.sessionIndex));
  const sessionCount: MetricValue<number> = {
    value: uniqueSessions.size,
    quality: 'reliable',
  };

  // ── METR-06: Longest Slouch Streak ──
  const longestSlouchDuration =
    slouchStreaks.length > 0 ? Math.max(...slouchStreaks.map((s) => s.endTime - s.startTime)) : 0;
  const longestSlouchStreak: MetricValue<number> = {
    value: longestSlouchDuration,
    quality: determineQuality(slouchStreaks.length, 3, 1),
  };

  // ── METR-07: Longest Good Streak ──
  const longestGoodDuration =
    goodStreaks.length > 0 ? Math.max(...goodStreaks.map((s) => s.endTime - s.startTime)) : 0;
  const longestGoodStreak: MetricValue<number> = {
    value: longestGoodDuration,
    quality: determineQuality(goodStreaks.length, 3, 1),
  };

  // ── METR-08: Break Frequency ──
  const breakFrequencyValue =
    screenOffGaps > 0 ? safeDivide(totalScreenTime, screenOffGaps) : totalScreenTime;
  const breakFrequency: MetricValue<number> = {
    value: breakFrequencyValue,
    quality: determineQuality(screenOffGaps, 3, 1),
  };

  // ── METR-09 & METR-10: Worst and Best Hour ──
  const hoursWithData = Array.from(hourlyData.entries());
  const hoursCount = hoursWithData.length;

  let worstHourValue = 0;
  let bestHourValue = 0;
  if (hoursCount > 0) {
    const hourlyRates = hoursWithData.map(([hour, data]) => ({
      hour,
      rate: safeDivide(data.slouching, data.total) * 100,
      count: data.total,
    }));

    // Worst hour = highest slouch rate
    hourlyRates.sort((a, b) => b.rate - a.rate);
    worstHourValue = hourlyRates[0].hour;

    // Best hour = lowest slouch rate (only among hours with >= 5 records)
    const significantHours = hourlyRates.filter((h) => h.count >= 5);
    if (significantHours.length > 0) {
      significantHours.sort((a, b) => a.rate - b.rate);
      bestHourValue = significantHours[0].hour;
    } else {
      // Fallback: use the hour with lowest rate among all hours
      hourlyRates.sort((a, b) => a.rate - b.rate);
      bestHourValue = hourlyRates[0].hour;
    }
  }

  const hourQuality = determineQuality(hoursCount, 3, 1);
  const worstHour: MetricValue<number> = { value: worstHourValue, quality: hourQuality };
  const bestHour: MetricValue<number> = { value: bestHourValue, quality: hourQuality };

  // ── METR-11: Daily Trend ──
  const dayGroups = new Map<number, PostureRecord[]>();
  for (const record of activeRecords) {
    const day = new Date(record.time).getUTCDate();
    const group = dayGroups.get(day) ?? [];
    group.push(record);
    dayGroups.set(day, group);
  }
  const dayCount = dayGroups.size;

  let dailyTrendValue: TrendDirection = 'insufficient';
  let dailyTrendQuality: MetricQuality = 'insufficient';

  if (dayCount >= 2) {
    const dayScores: number[] = [];
    for (const [, dayRecords] of dayGroups) {
      const daySlouchCount = dayRecords.filter((r) => isSlouching(r, thresholdPx)).length;
      const daySlouchRate = safeDivide(daySlouchCount, dayRecords.length) * 100;
      dayScores.push(100 - daySlouchRate);
    }
    const halfLen = Math.floor(dayScores.length / 2);
    const firstHalf = dayScores.slice(0, halfLen);
    const secondHalf = dayScores.slice(halfLen);
    const firstAvg = safeDivide(
      firstHalf.reduce((a, b) => a + b, 0),
      firstHalf.length
    );
    const secondAvg = safeDivide(
      secondHalf.reduce((a, b) => a + b, 0),
      secondHalf.length
    );
    const diff = secondAvg - firstAvg;
    if (diff > 5) dailyTrendValue = 'improving';
    else if (diff < -5) dailyTrendValue = 'declining';
    else dailyTrendValue = 'stable';
    dailyTrendQuality = determineQuality(dayCount, 3, 2);
  }

  const dailyTrend: MetricValue<TrendDirection> = {
    value: dailyTrendValue,
    quality: dailyTrendQuality,
  };

  // ── METR-12: Improvement Rate ──
  // Group records by hour-of-dataset (not hour-of-day) and compute score per hour
  const startTime = activeRecords[0].time;
  const hourlyScoreMap = new Map<number, { slouching: number; total: number }>();
  for (const record of activeRecords) {
    const hourIndex = Math.floor((record.time - startTime) / 3600000);
    const entry = hourlyScoreMap.get(hourIndex) ?? { slouching: 0, total: 0 };
    entry.total++;
    if (isSlouching(record, thresholdPx)) entry.slouching++;
    hourlyScoreMap.set(hourIndex, entry);
  }
  const hourlyScoreEntries = Array.from(hourlyScoreMap.entries()).sort(([a], [b]) => a - b);
  const xs = hourlyScoreEntries.map(([h]) => h);
  const ys = hourlyScoreEntries.map(
    ([, data]) => 100 - safeDivide(data.slouching, data.total) * 100
  );
  const improvementRateValue = linearRegressionSlope(xs, ys);
  const improvementRate: MetricValue<number> = {
    value: improvementRateValue,
    quality: determineQuality(hourlyScoreEntries.length, 4, 2),
  };

  // ── METR-13: Severity Distribution ──
  const severity: SeverityBucket = { mild: 0, moderate: 0, severe: 0 };
  for (const record of slouchingRecords) {
    const absDelta = Math.abs(record.deltaY!);
    if (absDelta > 2.5 * thresholdPx) {
      severity.severe++;
    } else if (absDelta > 1.5 * thresholdPx) {
      severity.moderate++;
    } else {
      severity.mild++;
    }
  }
  const severityDistribution: MetricValue<SeverityBucket> = {
    value: severity,
    quality: determineQuality(slouchingRecords.length, 10, 1),
  };

  // ── METR-14: Average Time to First Slouch ──
  const sessionGroups = new Map<number, PostureRecord[]>();
  for (const record of activeRecords) {
    const group = sessionGroups.get(record.sessionIndex) ?? [];
    group.push(record);
    sessionGroups.set(record.sessionIndex, group);
  }

  const timeToFirstSlouchValues: number[] = [];
  for (const [, sessionRecords] of sessionGroups) {
    if (sessionRecords.length === 0) continue;
    const sorted = sessionRecords.slice().sort((a, b) => a.time - b.time);
    const firstRecord = sorted[0];
    const firstSlouch = sorted.find((r) => isSlouching(r, thresholdPx));
    if (firstSlouch) {
      timeToFirstSlouchValues.push(firstSlouch.time - firstRecord.time);
    }
  }
  const avgTimeToFirstSlouchValue =
    timeToFirstSlouchValues.length > 0
      ? timeToFirstSlouchValues.reduce((a, b) => a + b, 0) / timeToFirstSlouchValues.length
      : 0;
  const avgTimeToFirstSlouch: MetricValue<number> = {
    value: avgTimeToFirstSlouchValue,
    quality: determineQuality(timeToFirstSlouchValues.length, 3, 1),
  };

  // ── METR-16: Cumulative Slouch Time ──
  const cumulativeSlouchTimeValue = slouchStreaks.reduce(
    (sum, s) => sum + (s.endTime - s.startTime),
    0
  );
  const cumulativeSlouchTime: MetricValue<number> = {
    value: cumulativeSlouchTimeValue,
    quality: activityQuality,
  };

  // ── METR-17: Recovery Speed Trend ──
  let recoverySpeedTrendValue: TrendDirection = 'insufficient';
  let recoverySpeedTrendQuality: MetricQuality = 'insufficient';

  if (slouchStreakDurations.length >= 2) {
    const halfIdx = Math.floor(slouchStreakDurations.length / 2);
    const firstHalfDurations = slouchStreakDurations.slice(0, halfIdx);
    const secondHalfDurations = slouchStreakDurations.slice(halfIdx);

    const firstAvg = safeDivide(
      firstHalfDurations.reduce((a, b) => a + b, 0),
      firstHalfDurations.length
    );
    const secondAvg = safeDivide(
      secondHalfDurations.reduce((a, b) => a + b, 0),
      secondHalfDurations.length
    );

    const pctChange = safeDivide(secondAvg - firstAvg, firstAvg);
    if (pctChange < -0.1)
      recoverySpeedTrendValue = 'improving'; // Faster correction
    else if (pctChange > 0.1)
      recoverySpeedTrendValue = 'declining'; // Slower correction
    else recoverySpeedTrendValue = 'stable';

    recoverySpeedTrendQuality =
      slouchStreakDurations.length >= 4 && uniqueSessions.size >= 2 ? 'reliable' : 'limited';
  }

  const recoverySpeedTrend: MetricValue<TrendDirection> = {
    value: recoverySpeedTrendValue,
    quality: recoverySpeedTrendQuality,
  };

  // ── METR-18: Slouch By Hour ──
  const slouchByHourArray: HourlySlouchRate[] = Array.from({ length: 24 }, (_, i) => {
    const data = hourlyData.get(i);
    if (!data) return { hour: i, slouchRate: 0, sampleCount: 0 };
    return {
      hour: i,
      slouchRate: safeDivide(data.slouching, data.total) * 100,
      sampleCount: data.total,
    };
  });
  const slouchByHour: MetricValue<HourlySlouchRate[]> = {
    value: slouchByHourArray,
    quality: determineQuality(hoursCount, 3, 1),
  };

  return {
    postureScore,
    slouchRate,
    avgTimeToCorrect,
    totalScreenTime: totalScreenTimeMetric,
    sessionCount,
    longestSlouchStreak,
    longestGoodStreak,
    breakFrequency,
    worstHour,
    bestHour,
    dailyTrend,
    improvementRate,
    severityDistribution,
    avgTimeToFirstSlouch,
    postureVolatility,
    cumulativeSlouchTime,
    recoverySpeedTrend,
    slouchByHour,
  };
}
