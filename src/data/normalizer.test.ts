import { describe, it, expect } from 'vitest';
import { normalizeTimestamp, computeMidpointY } from './normalizer';
import { detectScreenOff, segmentSessions } from './normalizer';
import { downsampleForChart } from './normalizer';
import type { PostureRecord, Rect } from './types';

describe('timestamp normalization', () => {
  it('converts Unix seconds to Unix milliseconds', () => {
    // 1700000000 seconds = 2023-11-14T22:13:20.000Z
    expect(normalizeTimestamp(1700000000)).toBe(1700000000000);
  });

  it('passes through Unix milliseconds unchanged', () => {
    expect(normalizeTimestamp(1700000000000)).toBe(1700000000000);
  });

  it('parses ISO 8601 string to Unix milliseconds', () => {
    expect(normalizeTimestamp('2023-11-14T22:13:20.000Z')).toBe(1700000000000);
  });

  it('throws on out-of-range timestamp', () => {
    // 0 = 1970, out of 2020-2050 range
    expect(() => normalizeTimestamp(0)).toThrow();
    // Far future microseconds
    expect(() => normalizeTimestamp(9999999999999999)).toThrow();
  });
});

describe('midpoint computation', () => {
  it('computes midpoint Y of a rect', () => {
    const rect: Rect = { x: 0, y: 10, w: 100, h: 50 };
    expect(computeMidpointY(rect)).toBe(35); // 10 + 50/2
  });

  it('handles rect at y=0', () => {
    const rect: Rect = { x: 0, y: 0, w: 100, h: 40 };
    expect(computeMidpointY(rect)).toBe(20);
  });
});

describe('screen-off detection from null currentRect', () => {
  it('marks record as screen-off when currentRect is null', () => {
    const entries = [
      {
        timestamp: 1700000000000,
        referenceRect: { x: 0, y: 0, w: 100, h: 100 },
        currentRect: null,
      },
    ];
    const records = detectScreenOff(entries);
    expect(records[0].isScreenOff).toBe(true);
  });

  it('does not mark record as screen-off when currentRect is present', () => {
    const rect = { x: 0, y: 0, w: 100, h: 100 };
    const entries = [{ timestamp: 1700000000000, referenceRect: rect, currentRect: rect }];
    const records = detectScreenOff(entries);
    expect(records[0].isScreenOff).toBe(false);
  });
});

describe('screen-off detection from timestamp gap (fixed 5s threshold)', () => {
  it('marks record as screen-off when gap > 5 seconds', () => {
    const rect = { x: 0, y: 10, w: 100, h: 100 };
    const entries = [
      { timestamp: 1700000000000, referenceRect: rect, currentRect: rect },
      { timestamp: 1700000001000, referenceRect: rect, currentRect: rect },
      { timestamp: 1700000002000, referenceRect: rect, currentRect: rect },
      { timestamp: 1700000008000, referenceRect: rect, currentRect: rect }, // 6s gap > 5s
    ];
    const records = detectScreenOff(entries);
    expect(records[3].isScreenOff).toBe(true);
  });

  it('does not mark record as screen-off when gap <= 5 seconds', () => {
    const rect = { x: 0, y: 10, w: 100, h: 100 };
    const entries = [
      { timestamp: 1700000000000, referenceRect: rect, currentRect: rect },
      { timestamp: 1700000005000, referenceRect: rect, currentRect: rect }, // exactly 5s
    ];
    const records = detectScreenOff(entries);
    expect(records[1].isScreenOff).toBe(false);
  });

  it('does not mark record as screen-off for normal interval', () => {
    const rect = { x: 0, y: 10, w: 100, h: 100 };
    const entries = [
      { timestamp: 1700000000000, referenceRect: rect, currentRect: rect },
      { timestamp: 1700000001000, referenceRect: rect, currentRect: rect },
    ];
    const records = detectScreenOff(entries);
    expect(records[1].isScreenOff).toBe(false);
  });
});

describe('session segmentation', () => {
  it('assigns same sessionIndex to contiguous non-absent records', () => {
    const base: Partial<PostureRecord> = {
      deltaY: 5,
      isSlouching: false,
      referenceY: 60,
      currentY: 65,
    };
    const records: PostureRecord[] = [
      { ...base, time: 1700000000000, isScreenOff: false, sessionIndex: 0 } as PostureRecord,
      { ...base, time: 1700000001000, isScreenOff: false, sessionIndex: 0 } as PostureRecord,
    ];
    const segmented = segmentSessions(records);
    expect(segmented[0].sessionIndex).toBe(segmented[1].sessionIndex);
  });

  it('increments sessionIndex after a screen-off gap', () => {
    const base: Partial<PostureRecord> = {
      deltaY: 5,
      isSlouching: false,
      referenceY: 60,
      currentY: 65,
    };
    const records: PostureRecord[] = [
      { ...base, time: 1700000000000, isScreenOff: false, sessionIndex: 0 } as PostureRecord,
      { ...base, time: 1700000001000, isScreenOff: true, sessionIndex: 0 } as PostureRecord,
      { ...base, time: 1700000002000, isScreenOff: false, sessionIndex: 0 } as PostureRecord,
    ];
    const segmented = segmentSessions(records);
    expect(segmented[2].sessionIndex).toBeGreaterThan(segmented[0].sessionIndex);
  });
});

describe('LTTB downsampling', () => {
  it('returns records unchanged when count is below threshold', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      time: 1700000000000 + i * 1000,
      referenceY: 50,
      currentY: 55,
      deltaY: 5,
      isSlouching: false,
      isScreenOff: false,
      sessionIndex: 0,
    })) as PostureRecord[];
    const result = downsampleForChart(records);
    expect(result).toHaveLength(100);
  });

  it('reduces large datasets to at most 1500 points', () => {
    const records = Array.from({ length: 2000 }, (_, i) => ({
      time: 1700000000000 + i * 1000,
      referenceY: 50,
      currentY: 55,
      deltaY: 5,
      isSlouching: false,
      isScreenOff: false,
      sessionIndex: 0,
    })) as PostureRecord[];
    const result = downsampleForChart(records);
    expect(result.length).toBeLessThanOrEqual(1500);
  });
});
