import { describe, it, expect } from 'vitest';
import { validateEntries } from './validator';

describe('validation: empty file', () => {
  it('returns EMPTY_FILE error for empty array', () => {
    const errors = validateEntries([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('EMPTY_FILE');
    expect(errors[0].message).toBe('Empty file — the JSON file contains no tracking entries');
  });
});

describe('validation: missing required fields', () => {
  it('returns MISSING_REQUIRED_FIELDS error when currentRect key is absent', () => {
    const badEntry = { timestamp: 1700000000000, referenceRect: { x: 0, y: 0, w: 100, h: 100 } };
    const errors = validateEntries([badEntry]);
    expect(errors.some((e) => e.code === 'MISSING_REQUIRED_FIELDS')).toBe(true);
    expect(errors.some((e) => e.message.includes('currentRect'))).toBe(true);
  });

  it('returns MISSING_REQUIRED_FIELDS error when timestamp key is absent', () => {
    const badEntry = {
      referenceRect: { x: 0, y: 0, w: 100, h: 100 },
      currentRect: { x: 0, y: 0, w: 100, h: 100 },
    };
    const errors = validateEntries([badEntry]);
    expect(errors.some((e) => e.code === 'MISSING_REQUIRED_FIELDS')).toBe(true);
  });

  it('returns no errors for a valid entry', () => {
    const goodEntry = {
      timestamp: 1700000000000,
      referenceRect: { x: 0, y: 0, w: 100, h: 100 },
      currentRect: { x: 0, y: 10, w: 100, h: 100 },
    };
    const errors = validateEntries([goodEntry]);
    expect(errors).toHaveLength(0);
  });
});
