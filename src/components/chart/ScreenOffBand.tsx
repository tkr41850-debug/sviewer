import type { PostureRecord } from '../../data/types';

export interface ScreenOffRegion {
  startTime: number; // Unix ms
  endTime: number; // Unix ms
}

/**
 * Scans records and returns contiguous screen-off regions.
 * Each region spans from the first screen-off record's time to the last
 * consecutive screen-off record's time in that run.
 */
export function computeScreenOffRegions(records: PostureRecord[]): ScreenOffRegion[] {
  const regions: ScreenOffRegion[] = [];
  let inRegion = false;
  let regionStart = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (record.isScreenOff) {
      if (!inRegion) {
        inRegion = true;
        regionStart = record.time;
      }
    } else {
      if (inRegion) {
        regions.push({
          startTime: regionStart,
          endTime: records[i - 1].time,
        });
        inRegion = false;
      }
    }
  }

  // Close final region if array ends during screen-off
  if (inRegion && records.length > 0) {
    regions.push({
      startTime: regionStart,
      endTime: records[records.length - 1].time,
    });
  }

  return regions;
}
