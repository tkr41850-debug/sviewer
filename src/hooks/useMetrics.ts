import { useMemo } from 'react';
import { useDataState } from '../stores/dataStore';
import { computeAllMetrics } from '../metrics/engine';
import type { DashboardMetrics } from '../metrics/types';

/**
 * Hook that computes all dashboard metrics from the current data state.
 * Returns null if data is not loaded.
 * Accepts thresholdPx from the chart's threshold state.
 *
 * Memoized to prevent recalculation on every render (T-03-04 mitigation).
 */
export function useMetrics(thresholdPx: number): DashboardMetrics | null {
  const state = useDataState();

  return useMemo(() => {
    if (state.status !== 'loaded') return null;
    return computeAllMetrics({
      records: state.result.records,
      metadata: state.result.metadata,
      thresholdPx,
    });
  }, [state, thresholdPx]);
}
