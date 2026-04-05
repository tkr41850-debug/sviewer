import { describe, it, expect } from 'vitest';
import { extractAvailableDates, extractDayRecords, normalizeToMinuteOfDay } from './DayComparison';
import type { PostureRecord } from '../../data/types';

function makeRecord(timeMs: number, deltaY: number = 5): PostureRecord {
  return {
    time: timeMs,
    referenceY: 100,
    currentY: 100 + deltaY,
    deltaY,
    isSlouching: false,
    isScreenOff: false,
    sessionIndex: 0,
  };
}

describe('DayComparison utility functions', () => {
  describe('extractAvailableDates', () => {
    it('returns unique YYYY-MM-DD strings sorted chronologically', () => {
      // 2024-03-15 10:00 UTC, 2024-03-15 14:00 UTC, 2024-03-16 09:00 UTC
      const records: PostureRecord[] = [
        makeRecord(Date.UTC(2024, 2, 15, 10, 0, 0)),
        makeRecord(Date.UTC(2024, 2, 15, 14, 0, 0)),
        makeRecord(Date.UTC(2024, 2, 16, 9, 0, 0)),
      ];
      const dates = extractAvailableDates(records);
      expect(dates).toHaveLength(2);
      expect(dates[0]).toBe('2024-03-15');
      expect(dates[1]).toBe('2024-03-16');
    });

    it('returns empty array for empty records', () => {
      expect(extractAvailableDates([])).toEqual([]);
    });

    it('returns single date when all records on same day', () => {
      const records: PostureRecord[] = [
        makeRecord(Date.UTC(2024, 5, 1, 8, 0)),
        makeRecord(Date.UTC(2024, 5, 1, 12, 0)),
      ];
      const dates = extractAvailableDates(records);
      expect(dates).toHaveLength(1);
      expect(dates[0]).toBe('2024-06-01');
    });
  });

  describe('extractDayRecords', () => {
    it('filters records to only those matching a given YYYY-MM-DD date string', () => {
      const records: PostureRecord[] = [
        makeRecord(Date.UTC(2024, 2, 15, 10, 0)),
        makeRecord(Date.UTC(2024, 2, 15, 14, 0)),
        makeRecord(Date.UTC(2024, 2, 16, 9, 0)),
        makeRecord(Date.UTC(2024, 2, 16, 15, 0)),
      ];
      const day15 = extractDayRecords(records, '2024-03-15');
      expect(day15).toHaveLength(2);
      expect(day15.every((r) => new Date(r.time).getUTCDate() === 15)).toBe(true);

      const day16 = extractDayRecords(records, '2024-03-16');
      expect(day16).toHaveLength(2);
      expect(day16.every((r) => new Date(r.time).getUTCDate() === 16)).toBe(true);
    });

    it('returns empty array for non-matching date', () => {
      const records: PostureRecord[] = [makeRecord(Date.UTC(2024, 2, 15, 10, 0))];
      expect(extractDayRecords(records, '2024-03-20')).toEqual([]);
    });
  });

  describe('normalizeToMinuteOfDay', () => {
    it('converts Unix ms timestamps to minutes-since-midnight (0-1439)', () => {
      // Midnight UTC = 0 minutes
      const midnight = Date.UTC(2024, 0, 1, 0, 0, 0);
      expect(normalizeToMinuteOfDay(midnight)).toBe(0);

      // 12:30 UTC = 750 minutes
      const noon30 = Date.UTC(2024, 0, 1, 12, 30, 0);
      expect(normalizeToMinuteOfDay(noon30)).toBe(750);

      // 23:59 UTC = 1439 minutes
      const endOfDay = Date.UTC(2024, 0, 1, 23, 59, 0);
      expect(normalizeToMinuteOfDay(endOfDay)).toBe(1439);
    });

    it('handles times at exact hour boundaries', () => {
      const twoAm = Date.UTC(2024, 6, 10, 2, 0, 0);
      expect(normalizeToMinuteOfDay(twoAm)).toBe(120);
    });
  });
});
