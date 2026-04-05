import type { Rect, RawEntry } from './types';

/**
 * Parses a BoundingBox string from the slouch tracker CSV format.
 * Accepts: "BoundingBox(origin_x=247, origin_y=95, width=197, height=197)"
 * Returns null for "None" or malformed input.
 *
 * origin_x/y is the top-left corner → maps directly to Rect.x / Rect.y.
 */
function parseBoundingBox(s: string): Rect | null {
  const trimmed = s.trim();
  if (trimmed === 'None') return null;

  const match = trimmed.match(
    /^BoundingBox\(origin_x=(\d+),\s*origin_y=(\d+),\s*width=(\d+),\s*height=(\d+)\)$/
  );
  if (!match) return null;

  return {
    x: parseInt(match[1], 10),
    y: parseInt(match[2], 10),
    w: parseInt(match[3], 10),
    h: parseInt(match[4], 10),
  };
}

/**
 * Splits a CSV row into [timestamp, col2, col3].
 * BoundingBox values contain commas inside parens, so we can't naively split on ",".
 * Strategy: scan for the boundary after col2 by tracking paren depth.
 */
function splitRow(line: string): [string, string, string] | null {
  const firstComma = line.indexOf(',');
  if (firstComma === -1) return null;

  const timestamp = line.slice(0, firstComma);
  const rest = line.slice(firstComma + 1);

  // Find the end of col2 (either "None" or "BoundingBox(...)")
  let col2End: number;
  if (rest.startsWith('None')) {
    col2End = 4; // length of "None"
  } else if (rest.startsWith('BoundingBox(')) {
    const closeParen = rest.indexOf(')');
    if (closeParen === -1) return null;
    col2End = closeParen + 1;
  } else {
    return null;
  }

  const separatorIndex = rest.indexOf(',', col2End);
  if (separatorIndex === -1) return null;

  const col2 = rest.slice(0, col2End);
  const col3 = rest.slice(separatorIndex + 1);

  return [timestamp.trim(), col2.trim(), col3.trim()];
}

/**
 * Parses CSV text in the slouch tracker format:
 *   YYYY-MM-DD HH:MM:SS,<referenceRect>,<currentRect>
 *
 * - referenceRect None  → skip row (calibration not yet established)
 * - currentRect None    → RawEntry with currentRect: null (person off-screen)
 * - Timestamp normalised to ISO 8601 ("YYYY-MM-DDTHH:MM:SS") so the existing
 *   normalizeTimestamp() function handles it without modification.
 */
export function parseCsv(text: string): RawEntry[] {
  const entries: RawEntry[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const parts = splitRow(line);
    if (!parts) continue;

    const [rawTimestamp, col2, col3] = parts;

    const referenceRect = parseBoundingBox(col2);
    if (referenceRect === null) continue; // skip until calibration is established

    const currentRect = parseBoundingBox(col3); // null = off-screen

    // "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS" (valid ISO 8601 for Date.parse)
    const timestamp = rawTimestamp.replace(' ', 'T');

    entries.push({ timestamp, referenceRect, currentRect });
  }

  return entries;
}

/**
 * Returns true when the text looks like the BoundingBox CSV format.
 * Checks the first non-empty line for the pattern: YYYY-MM-DD HH:MM:SS,...
 */
export function isCsvFormat(text: string): boolean {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},/.test(trimmed);
    }
  }
  return false;
}
