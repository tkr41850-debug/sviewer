import type { ParseError } from './types';

/** Checks if a value looks like a valid Rect object. */
function isRect(val: unknown): boolean {
  if (typeof val !== 'object' || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj['x'] === 'number' &&
    typeof obj['y'] === 'number' &&
    typeof obj['w'] === 'number' &&
    typeof obj['h'] === 'number'
  );
}

/**
 * Validates an array of raw JSON entries against the expected slouch tracker schema.
 * Returns an array of ParseErrors. Empty array means validation passed.
 *
 * Error messages match UI-SPEC copywriting contract exactly.
 */
export function validateEntries(entries: unknown[]): ParseError[] {
  if (entries.length === 0) {
    return [
      {
        code: 'EMPTY_FILE',
        message: 'Empty file — the JSON file contains no tracking entries',
      },
    ];
  }

  const errors: ParseError[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (typeof entry !== 'object' || entry === null) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Missing required fields — expected currentRect and timestamp in each entry',
        entryIndex: i,
      });
      continue;
    }

    const obj = entry as Record<string, unknown>;

    const missingFields: string[] = [];
    if (!('timestamp' in obj)) missingFields.push('timestamp');
    if (!('referenceRect' in obj) || !isRect(obj['referenceRect']))
      missingFields.push('referenceRect');
    // currentRect may be null (screen-off) but the KEY must exist
    if (!('currentRect' in obj)) missingFields.push('currentRect');

    if (missingFields.length > 0) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Missing required fields — expected currentRect and timestamp in each entry',
        entryIndex: i,
      });
    }
  }

  return errors;
}
