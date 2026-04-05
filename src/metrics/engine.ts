// src/metrics/engine.ts
// Metrics computation engine.
// Pure function: PostureRecord[] + metadata + threshold -> DashboardMetrics.
// All downstream dashboard views consume the output of computeAllMetrics.

import type { PostureRecord, ParseResult } from '../data/types';
import type { DashboardMetrics } from './types';

export interface MetricsInput {
  records: PostureRecord[];
  metadata: ParseResult['metadata'];
  thresholdPx: number;
}

export function computeAllMetrics(_input: MetricsInput): DashboardMetrics {
  throw new Error('Not implemented');
}
