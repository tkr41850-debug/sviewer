import { useState, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { RechartsAdapter } from './RechartsAdapter';
import { VisxAdapter } from './VisxAdapter';
import { SettingsDropdown } from './SettingsDropdown';
import { EngineLabel } from './EngineLabel';
import { DayComparison, extractDayRecords } from './DayComparison';
import { useChartState, useChartDispatch } from '../../stores/chartStore';
import { downsampleForChart } from '../../data/normalizer';
import type {
  PostureRecord,
  ThresholdConfig,
  ParseResult,
  ChartAdapterProps,
} from '../../data/types';

interface PostureChartProps {
  records: PostureRecord[];
  metadata: ParseResult['metadata'];
  onThresholdChange?: (config: ThresholdConfig) => void;
  onVisibleDomainChange?: (domain: [number, number] | null) => void;
}

/**
 * Computes the median referenceY across non-screen-off records.
 * Exported for use by ThresholdControl (Plan 03) for unit conversion.
 */
export function useMedianReferenceY(records: PostureRecord[]): number {
  return useMemo(() => {
    const activeRecords = records.filter((r) => !r.isScreenOff);
    if (activeRecords.length === 0) return 0;

    const values = activeRecords.map((r) => r.referenceY).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  }, [records]);
}

/**
 * Top-level chart wrapper managing threshold state and computing chart data segments.
 * Receives full PostureRecord[] and metadata, manages local threshold + visible domain state,
 * and renders the active chart engine adapter (Recharts or visx) with downsampled,
 * threshold-applied data.
 *
 * Per D-12: Switching engines preserves state because threshold, visibleDomain, and
 * annotations all live in PostureChart (parent) and ChartStore (context) — NOT inside
 * the engine components. When activeEngine changes, the new engine receives the same
 * props and renders the same view state.
 */
export function PostureChart({
  records,
  onThresholdChange,
  onVisibleDomainChange,
}: PostureChartProps) {
  const [threshold, setThreshold] = useState<ThresholdConfig>({ value: 15, unit: '%' });
  const [visibleDomain, setVisibleDomain] = useState<[number, number] | null>(null);

  const { activeEngine, annotations, comparison } = useChartState();
  const chartDispatch = useChartDispatch();

  const medianReferenceY = useMedianReferenceY(records);

  // Convert threshold to absolute pixels
  const thresholdPx = useMemo(() => {
    if (threshold.unit === 'px') return threshold.value;
    return medianReferenceY * (threshold.value / 100);
  }, [threshold, medianReferenceY]);

  // Downsample for chart rendering (LTTB to max 1500 points)
  const downsampledPoints = useMemo(() => downsampleForChart(records), [records]);

  // Extract comparison data when enabled (per D-04/D-05/D-06)
  const comparisonData = useMemo(() => {
    if (!comparison.enabled || !comparison.day2) return undefined;
    const dayRecords = extractDayRecords(records, comparison.day2);
    if (dayRecords.length === 0) return undefined;
    return downsampleForChart(dayRecords);
  }, [comparison.enabled, comparison.day2, records]);

  // Filter primary data to day1 when comparison is active
  const primaryData = useMemo(() => {
    if (!comparison.enabled || !comparison.day1) return downsampledPoints;
    const dayRecords = extractDayRecords(records, comparison.day1);
    if (dayRecords.length === 0) return downsampledPoints;
    return downsampleForChart(dayRecords);
  }, [comparison.enabled, comparison.day1, records, downsampledPoints]);

  // Expose threshold/domain changes to parent for Plan 03 wiring
  const handleThresholdChange = (config: ThresholdConfig) => {
    setThreshold(config);
    onThresholdChange?.(config);
  };

  const handleVisibleDomainChange = (domain: [number, number] | null) => {
    setVisibleDomain(domain);
    onVisibleDomainChange?.(domain);
  };

  // Suppress unused variable warnings — these handlers are for Plan 03 wiring
  void handleThresholdChange;
  void handleVisibleDomainChange;

  // Annotation callbacks — dispatch to ChartStore
  const handleAnnotationCreate = useCallback(
    (time: number, deltaY: number) => {
      const id = crypto.randomUUID();
      chartDispatch({
        type: 'ADD_ANNOTATION',
        payload: { id, text: '', time, deltaY },
      });
    },
    [chartDispatch]
  );

  const handleAnnotationUpdate = useCallback(
    (id: string, text: string) => {
      chartDispatch({
        type: 'UPDATE_ANNOTATION',
        payload: { id, text },
      });
    },
    [chartDispatch]
  );

  const handleAnnotationDelete = useCallback(
    (id: string) => {
      chartDispatch({
        type: 'DELETE_ANNOTATION',
        payload: id,
      });
    },
    [chartDispatch]
  );

  // Build ChartAdapterProps — same object for both engines (D-12 state preservation)
  const adapterProps: ChartAdapterProps = {
    data: primaryData,
    thresholdPx,
    visibleDomain: visibleDomain ?? undefined,
    onBrushChange: setVisibleDomain,
    annotations,
    onAnnotationCreate: handleAnnotationCreate,
    onAnnotationUpdate: handleAnnotationUpdate,
    onAnnotationDelete: handleAnnotationDelete,
    comparisonData,
    comparisonLabel: comparison.day2 ? format(parseISO(comparison.day2), 'MMM dd') : undefined,
    primaryLabel: comparison.day1 ? format(parseISO(comparison.day1), 'MMM dd') : undefined,
    normalizeTimeAxis: comparison.enabled && !!comparison.day1 && !!comparison.day2,
  };

  // Per D-02: instant swap (no animation/crossfade)
  const ChartComponent = activeEngine === 'visx' ? VisxAdapter : RechartsAdapter;

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Top bar: comparison controls + settings */}
      <div className="flex items-center justify-between px-2 py-1">
        <DayComparison records={records} />
        <SettingsDropdown />
      </div>

      {/* Main chart area */}
      <div className="relative min-h-0 flex-1">
        <ChartComponent {...adapterProps} />
        {/* Engine label — bottom-right corner per D-03 */}
        <EngineLabel />
      </div>
    </div>
  );
}
