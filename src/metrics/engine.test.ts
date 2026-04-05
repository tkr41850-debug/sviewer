import { describe, it, expect } from 'vitest';
import { computeAllMetrics, type MetricsInput } from './engine';
import type { PostureRecord, ParseResult } from '../data/types';

// ─── Test Helpers ────────────────────────────────────────────────

function makeRecords(
  specs: Array<{
    time: number;
    deltaY: number | null;
    isScreenOff?: boolean;
    sessionIndex?: number;
    referenceY?: number;
  }>
): PostureRecord[] {
  return specs.map((s) => ({
    time: s.time,
    referenceY: s.referenceY ?? 100,
    currentY: s.deltaY !== null ? (s.referenceY ?? 100) + s.deltaY : null,
    deltaY: s.deltaY,
    isSlouching: false,
    isScreenOff: s.isScreenOff ?? false,
    sessionIndex: s.sessionIndex ?? 0,
  }));
}

function makeMetadata(
  records: PostureRecord[],
  overrides?: Partial<ParseResult['metadata']>
): ParseResult['metadata'] {
  const activeRecords = records.filter((r) => !r.isScreenOff);
  const times = activeRecords.map((r) => r.time);
  return {
    startTime: Math.min(...times),
    endTime: Math.max(...times),
    totalEntries: records.length,
    sessionCount: new Set(activeRecords.map((r) => r.sessionIndex)).size,
    samplingIntervalMs: 60000,
    ...overrides,
  };
}

function makeInput(records: PostureRecord[], thresholdPx = 20): MetricsInput {
  return {
    records,
    metadata: makeMetadata(records),
    thresholdPx,
  };
}

// ─── Normal Scenario Fixture ─────────────────────────────────────
// ~20 records, 2 sessions, varying deltaY, one screen-off gap.
// Threshold = 20px. Records at 1-second intervals starting at 1700000000000.
// Session 0: records 0-8 (seconds 0-8), mix of good posture and slouching
// Screen off: records 9-10 (seconds 9-10)
// Session 1: records 11-19 (seconds 11-19), more slouching

const BASE_TIME = 1700000000000;
const SECOND = 1000;

const normalRecords = makeRecords([
  // Session 0: good posture and some slouching
  { time: BASE_TIME + 0 * SECOND, deltaY: 5, sessionIndex: 0 }, // good
  { time: BASE_TIME + 1 * SECOND, deltaY: 8, sessionIndex: 0 }, // good
  { time: BASE_TIME + 2 * SECOND, deltaY: 25, sessionIndex: 0 }, // slouching (>20)
  { time: BASE_TIME + 3 * SECOND, deltaY: 30, sessionIndex: 0 }, // slouching
  { time: BASE_TIME + 4 * SECOND, deltaY: 10, sessionIndex: 0 }, // good (corrected)
  { time: BASE_TIME + 5 * SECOND, deltaY: 3, sessionIndex: 0 }, // good
  { time: BASE_TIME + 6 * SECOND, deltaY: 35, sessionIndex: 0 }, // slouching
  { time: BASE_TIME + 7 * SECOND, deltaY: 45, sessionIndex: 0 }, // slouching (severe)
  { time: BASE_TIME + 8 * SECOND, deltaY: 12, sessionIndex: 0 }, // good (corrected)

  // Screen off gap
  { time: BASE_TIME + 9 * SECOND, deltaY: null, isScreenOff: true, sessionIndex: 0 },
  { time: BASE_TIME + 10 * SECOND, deltaY: null, isScreenOff: true, sessionIndex: 0 },

  // Session 1: more slouching
  { time: BASE_TIME + 11 * SECOND, deltaY: 7, sessionIndex: 1 }, // good
  { time: BASE_TIME + 12 * SECOND, deltaY: 22, sessionIndex: 1 }, // slouching
  { time: BASE_TIME + 13 * SECOND, deltaY: 28, sessionIndex: 1 }, // slouching
  { time: BASE_TIME + 14 * SECOND, deltaY: 55, sessionIndex: 1 }, // slouching (severe)
  { time: BASE_TIME + 15 * SECOND, deltaY: 15, sessionIndex: 1 }, // good (corrected)
  { time: BASE_TIME + 16 * SECOND, deltaY: 4, sessionIndex: 1 }, // good
  { time: BASE_TIME + 17 * SECOND, deltaY: 6, sessionIndex: 1 }, // good
  { time: BASE_TIME + 18 * SECOND, deltaY: -5, sessionIndex: 1 }, // good (negative deltaY)
  { time: BASE_TIME + 19 * SECOND, deltaY: 21, sessionIndex: 1 }, // slouching
]);

const normalInput = makeInput(normalRecords, 20);

// ─── Edge Case Fixtures ──────────────────────────────────────────

const singleRecord = makeRecords([{ time: BASE_TIME, deltaY: 15, sessionIndex: 0 }]);

const allScreenOff = makeRecords([
  { time: BASE_TIME, deltaY: null, isScreenOff: true, sessionIndex: 0 },
  { time: BASE_TIME + SECOND, deltaY: null, isScreenOff: true, sessionIndex: 0 },
  { time: BASE_TIME + 2 * SECOND, deltaY: null, isScreenOff: true, sessionIndex: 0 },
]);

const noSlouching = makeRecords([
  { time: BASE_TIME, deltaY: 5, sessionIndex: 0 },
  { time: BASE_TIME + SECOND, deltaY: 3, sessionIndex: 0 },
  { time: BASE_TIME + 2 * SECOND, deltaY: -2, sessionIndex: 0 },
  { time: BASE_TIME + 3 * SECOND, deltaY: 10, sessionIndex: 0 },
  { time: BASE_TIME + 4 * SECOND, deltaY: 8, sessionIndex: 0 },
  { time: BASE_TIME + 5 * SECOND, deltaY: 1, sessionIndex: 0 },
  { time: BASE_TIME + 6 * SECOND, deltaY: 12, sessionIndex: 0 },
  { time: BASE_TIME + 7 * SECOND, deltaY: 7, sessionIndex: 0 },
  { time: BASE_TIME + 8 * SECOND, deltaY: -3, sessionIndex: 0 },
  { time: BASE_TIME + 9 * SECOND, deltaY: 6, sessionIndex: 0 },
]);

// ─── Tests ───────────────────────────────────────────────────────

describe('computeAllMetrics - core metrics', () => {
  it('returns an object with all 18 metric fields defined', () => {
    const result = computeAllMetrics(normalInput);
    expect(result.postureScore).toBeDefined();
    expect(result.slouchRate).toBeDefined();
    expect(result.avgTimeToCorrect).toBeDefined();
    expect(result.totalScreenTime).toBeDefined();
    expect(result.sessionCount).toBeDefined();
    expect(result.longestSlouchStreak).toBeDefined();
    expect(result.longestGoodStreak).toBeDefined();
    expect(result.breakFrequency).toBeDefined();
    expect(result.worstHour).toBeDefined();
    expect(result.bestHour).toBeDefined();
    expect(result.dailyTrend).toBeDefined();
    expect(result.improvementRate).toBeDefined();
    expect(result.severityDistribution).toBeDefined();
    expect(result.avgTimeToFirstSlouch).toBeDefined();
    expect(result.postureVolatility).toBeDefined();
    expect(result.cumulativeSlouchTime).toBeDefined();
    expect(result.recoverySpeedTrend).toBeDefined();
    expect(result.slouchByHour).toBeDefined();
  });

  it('METR-01: postureScore is between 0 and 100', () => {
    const result = computeAllMetrics(normalInput);
    expect(result.postureScore.value).toBeGreaterThanOrEqual(0);
    expect(result.postureScore.value).toBeLessThanOrEqual(100);
    expect(result.postureScore.quality).toBe('limited');
  });

  it('METR-02: slouchRate is a percentage (0-100) of active time where abs(deltaY) > threshold', () => {
    const result = computeAllMetrics(normalInput);
    // 18 active records. Slouching: records with abs(deltaY) > 20.
    // deltaY values: 5,8,25,30,10,3,35,45,12,7,22,28,55,15,4,6,-5,21
    // Slouching: 25,30,35,45,22,28,55,21 = 8 records out of 18
    const expectedRate = (8 / 18) * 100;
    expect(result.slouchRate.value).toBeCloseTo(expectedRate, 1);
    expect(result.slouchRate.quality).toBe('limited');
  });

  it('METR-03: avgTimeToCorrect is in milliseconds', () => {
    const result = computeAllMetrics(normalInput);
    // Slouch streaks in session 0:
    //   records 2-3 (2min slouch), corrected at record 4 -> duration = 2 * SECOND
    //   records 6-7 (2min slouch), corrected at record 8 -> duration = 2 * SECOND
    // Slouch streaks in session 1:
    //   records 12-14 (3min slouch), corrected at record 15 -> duration = 3 * SECOND
    //   record 19 (1min), no correction (end of data) -> duration = 0 (single record at end)
    // avgTimeToCorrect should be a positive ms value
    expect(result.avgTimeToCorrect.value).toBeGreaterThan(0);
    expect(result.avgTimeToCorrect.quality).toBe('reliable');
  });

  it('METR-04: totalScreenTime equals sum of intervals between active records, capped at 5s each', () => {
    const result = computeAllMetrics(normalInput);
    // Active records: 0-8 (session 0) + 11-19 (session 1) = 18 records, 17 intervals
    // Session 0: 8 intervals of 1s = 8 * SECOND
    // Gap: record 8 -> record 11 = 3 * SECOND (active-to-active, under 5s cap)
    // Session 1: 8 intervals of 1s = 8 * SECOND
    // Total = (8 + 3 + 8) * SECOND = 19 * SECOND = 19000ms
    expect(result.totalScreenTime.value).toBe(19 * SECOND);
    expect(result.totalScreenTime.quality).toBe('reliable');
  });

  it('METR-05: sessionCount matches distinct sessionIndex values among active records', () => {
    const result = computeAllMetrics(normalInput);
    expect(result.sessionCount.value).toBe(2);
    expect(result.sessionCount.quality).toBe('reliable');
  });

  it('METR-06: longestSlouchStreak is duration of longest continuous slouch', () => {
    const result = computeAllMetrics(normalInput);
    // Longest slouch streak: records 12-14 in session 1 (3 consecutive), duration = 2 * SECOND
    // (duration is from first to last record time in streak)
    expect(result.longestSlouchStreak.value).toBeGreaterThan(0);
    expect(result.longestSlouchStreak.quality).toBe('reliable');
  });

  it('METR-07: longestGoodStreak is duration of longest continuous good posture', () => {
    const result = computeAllMetrics(normalInput);
    // Longest good streak in session 1: records 15-18 = 3 * SECOND
    expect(result.longestGoodStreak.value).toBeGreaterThan(0);
    expect(result.longestGoodStreak.quality).toBe('reliable');
  });

  it('METR-08: breakFrequency is average interval between screen-off periods', () => {
    const result = computeAllMetrics(normalInput);
    // There is 1 screen-off gap; breakFrequency = totalScreenTime / gapCount
    expect(result.breakFrequency.value).toBeGreaterThan(0);
    expect(result.breakFrequency.quality).toBe('limited');
  });
});

describe('computeAllMetrics - hourly & trend metrics', () => {
  it('METR-09: worstHour is the hour (0-23) with highest slouch rate', () => {
    const result = computeAllMetrics(normalInput);
    expect(result.worstHour.value).toBeGreaterThanOrEqual(0);
    expect(result.worstHour.value).toBeLessThanOrEqual(23);
  });

  it('METR-10: bestHour is the hour (0-23) with lowest slouch rate', () => {
    const result = computeAllMetrics(normalInput);
    expect(result.bestHour.value).toBeGreaterThanOrEqual(0);
    expect(result.bestHour.value).toBeLessThanOrEqual(23);
  });

  it('METR-11: dailyTrend is a TrendDirection value', () => {
    const result = computeAllMetrics(normalInput);
    expect(['improving', 'declining', 'stable', 'insufficient']).toContain(result.dailyTrend.value);
  });

  it('METR-12: improvementRate is a number (slope in score-units per hour)', () => {
    const result = computeAllMetrics(normalInput);
    expect(typeof result.improvementRate.value).toBe('number');
    expect(Number.isFinite(result.improvementRate.value)).toBe(true);
  });
});

describe('computeAllMetrics - advanced metrics', () => {
  it('METR-13: severityDistribution has mild/moderate/severe counts summing to total slouch records', () => {
    const result = computeAllMetrics(normalInput);
    const dist = result.severityDistribution.value;
    expect(dist.mild).toBeGreaterThanOrEqual(0);
    expect(dist.moderate).toBeGreaterThanOrEqual(0);
    expect(dist.severe).toBeGreaterThanOrEqual(0);
    // Total slouch records = 8 in normal fixture
    expect(dist.mild + dist.moderate + dist.severe).toBe(8);
  });

  it('METR-14: avgTimeToFirstSlouch is average ms from session start to first slouch', () => {
    const result = computeAllMetrics(normalInput);
    // Session 0: first active record at minute 0, first slouch at minute 2 -> 2 * SECOND
    // Session 1: first active record at minute 11, first slouch at minute 12 -> 1 * SECOND
    // Average = (2 * SECOND + 1 * SECOND) / 2 = 1.5 * SECOND
    expect(result.avgTimeToFirstSlouch.value).toBeCloseTo(1.5 * SECOND, 0);
    expect(result.avgTimeToFirstSlouch.quality).toBe('limited');
  });

  it('METR-15: postureVolatility is standard deviation of deltaY values', () => {
    const result = computeAllMetrics(normalInput);
    expect(result.postureVolatility.value).toBeGreaterThan(0);
    expect(Number.isFinite(result.postureVolatility.value)).toBe(true);
  });

  it('METR-16: cumulativeSlouchTime is total ms spent slouching', () => {
    const result = computeAllMetrics(normalInput);
    // Slouch streaks: records 2-3 (2min), 6-7 (2min), 12-14 (3min), 19 (end, single)
    // Each streak's duration = (last.time - first.time)
    // 2-3: 1 * SECOND, 6-7: 1 * SECOND, 12-14: 2 * SECOND, 19: 0
    // Total = 4 * SECOND
    expect(result.cumulativeSlouchTime.value).toBeGreaterThan(0);
  });

  it('METR-17: recoverySpeedTrend is a TrendDirection value', () => {
    const result = computeAllMetrics(normalInput);
    expect(['improving', 'declining', 'stable', 'insufficient']).toContain(
      result.recoverySpeedTrend.value
    );
  });

  it('METR-18: slouchByHour is an array of 24 entries', () => {
    const result = computeAllMetrics(normalInput);
    const hourly = result.slouchByHour.value;
    expect(hourly).toHaveLength(24);
    for (const entry of hourly) {
      expect(entry.hour).toBeGreaterThanOrEqual(0);
      expect(entry.hour).toBeLessThanOrEqual(23);
      expect(entry.slouchRate).toBeGreaterThanOrEqual(0);
      expect(entry.slouchRate).toBeLessThanOrEqual(100);
      expect(entry.sampleCount).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('computeAllMetrics - edge cases', () => {
  it('single record returns metrics with appropriate quality', () => {
    const input = makeInput(singleRecord, 20);
    const result = computeAllMetrics(input);
    expect(result.postureScore.value).toBeGreaterThanOrEqual(0);
    expect(result.postureScore.value).toBeLessThanOrEqual(100);
    expect(result.sessionCount.value).toBe(1);
    expect(result.totalScreenTime.value).toBe(0);
    expect(result.slouchRate.value).toBeGreaterThanOrEqual(0);
    // Quality should reflect limited data
    expect(['limited', 'insufficient']).toContain(result.postureScore.quality);
  });

  it('all screen-off records returns zero/insufficient for activity metrics', () => {
    const input: MetricsInput = {
      records: allScreenOff,
      metadata: {
        startTime: BASE_TIME,
        endTime: BASE_TIME + 2 * SECOND,
        totalEntries: 3,
        sessionCount: 0,
        samplingIntervalMs: SECOND,
      },
      thresholdPx: 20,
    };
    const result = computeAllMetrics(input);
    expect(result.totalScreenTime.value).toBe(0);
    expect(result.sessionCount.value).toBe(0);
    expect(result.slouchRate.value).toBe(0);
    expect(result.slouchRate.quality).toBe('insufficient');
    expect(result.postureScore.quality).toBe('insufficient');
    expect(result.dailyTrend.value).toBe('insufficient');
  });

  it('no slouching returns slouchRate=0, longestSlouchStreak=0, postureScore near 100', () => {
    const input = makeInput(noSlouching, 20);
    const result = computeAllMetrics(input);
    expect(result.slouchRate.value).toBe(0);
    expect(result.longestSlouchStreak.value).toBe(0);
    // Posture score should be high (close to 100) when no slouching
    expect(result.postureScore.value).toBeGreaterThanOrEqual(90);
    expect(result.cumulativeSlouchTime.value).toBe(0);
    expect(result.severityDistribution.value.mild).toBe(0);
    expect(result.severityDistribution.value.moderate).toBe(0);
    expect(result.severityDistribution.value.severe).toBe(0);
  });

  it('MetricValue wrapper has quality field on every metric', () => {
    const result = computeAllMetrics(normalInput);
    const metricKeys = Object.keys(result) as (keyof typeof result)[];
    for (const key of metricKeys) {
      const metric = result[key];
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('quality');
      expect(['reliable', 'limited', 'insufficient']).toContain(metric.quality);
    }
  });
});
