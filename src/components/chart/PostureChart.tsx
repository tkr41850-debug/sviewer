import { useState, useMemo } from 'react';
import { MainChart } from './MainChart';
import { downsampleForChart } from '../../data/normalizer';
import type { PostureRecord, ThresholdConfig, ParseResult } from '../../data/types';

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
 * and renders MainChart with downsampled, threshold-applied data.
 */
export function PostureChart({
  records,
  onThresholdChange,
  onVisibleDomainChange,
}: PostureChartProps) {
  const [threshold, setThreshold] = useState<ThresholdConfig>({ value: 15, unit: '%' });
  const [visibleDomain, setVisibleDomain] = useState<[number, number] | null>(null);

  const medianReferenceY = useMedianReferenceY(records);

  // Convert threshold to absolute pixels
  const thresholdPx = useMemo(() => {
    if (threshold.unit === 'px') return threshold.value;
    return medianReferenceY * (threshold.value / 100);
  }, [threshold, medianReferenceY]);

  // Downsample for chart rendering (LTTB to max 1500 points)
  const downsampledPoints = useMemo(() => downsampleForChart(records), [records]);

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

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <MainChart
          data={downsampledPoints}
          thresholdPx={thresholdPx}
          visibleDomain={visibleDomain ?? undefined}
        />
      </div>
    </div>
  );
}
