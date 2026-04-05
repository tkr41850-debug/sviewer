import { useState, useMemo, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { useDataDispatch } from '../../stores/dataStore';
import { downsampleForChart } from '../../data/normalizer';
import { MainChart } from './MainChart';
import { MinimapBrush } from './MinimapBrush';
import { ThresholdControl } from './ThresholdControl';
import type { PostureRecord, ThresholdConfig, ParseResult } from '../../data/types';

interface GraphViewProps {
  records: PostureRecord[];
  metadata: ParseResult['metadata'];
  /** Callback fired whenever the computed threshold in pixels changes. */
  onThresholdPxChange?: (thresholdPx: number) => void;
}

/** Debounce delay for resize listener (ms). */
const RESIZE_DEBOUNCE_MS = 150;

/** Viewport width breakpoint for mobile layout. */
const MOBILE_BREAKPOINT = 640;

/**
 * Full-viewport layout shell composing MainChart, MinimapBrush, ThresholdControl,
 * and a "Load new file" link. Manages threshold and visible domain state,
 * computes medianReferenceY and thresholdPx, and responds to viewport changes.
 */
export function GraphView({ records, metadata, onThresholdPxChange }: GraphViewProps) {
  const dispatch = useDataDispatch();

  // Local state
  const [threshold, setThreshold] = useState<ThresholdConfig>({ value: 15, unit: '%' });
  const [visibleDomain, setVisibleDomain] = useState<[number, number] | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  // Track resize for mobile detection with debounce
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Compute median referenceY from non-screen-off records
  const medianReferenceY = useMemo(() => {
    const activeRecords = records.filter((r) => !r.isScreenOff);
    if (activeRecords.length === 0) return 100; // fallback

    const values = activeRecords.map((r) => r.referenceY).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  }, [records]);

  // Convert threshold to absolute pixels
  const thresholdPx = useMemo(() => {
    if (threshold.unit === 'px') return threshold.value;
    return medianReferenceY * (threshold.value / 100);
  }, [threshold, medianReferenceY]);

  // Notify parent when thresholdPx changes
  useEffect(() => {
    onThresholdPxChange?.(thresholdPx);
  }, [thresholdPx, onThresholdPxChange]);

  // Downsample for chart rendering (LTTB to max 1500 points)
  const downsampledPoints = useMemo(() => downsampleForChart(records), [records]);

  // Full time domain from metadata
  const fullDomain = useMemo<[number, number]>(
    () => [metadata.startTime, metadata.endTime],
    [metadata.startTime, metadata.endTime]
  );

  // Load new file handler — dispatches RESET to return to upload page
  const handleLoadNewFile = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  return (
    <div
      className="relative flex h-screen w-full flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Threshold control overlay -- positioned differently on mobile vs desktop */}
      <div
        className={
          isMobile ? 'flex items-center justify-between px-4 py-2' : 'absolute right-4 top-4 z-10'
        }
      >
        <ThresholdControl
          threshold={threshold}
          onThresholdChange={setThreshold}
          medianReferenceY={medianReferenceY}
        />
      </div>

      {/* Main chart area -- takes remaining vertical space */}
      <div
        className={clsx('min-h-0 flex-1', isMobile ? 'px-4' : 'px-6')}
        style={{ minHeight: '200px' }}
      >
        <MainChart
          data={downsampledPoints}
          thresholdPx={thresholdPx}
          visibleDomain={visibleDomain ?? undefined}
        />
      </div>

      {/* Gap between chart and minimap */}
      <div className="h-4" />

      {/* Minimap / brush bar */}
      <div className={clsx(isMobile ? 'px-4' : 'px-6')}>
        <MinimapBrush
          data={downsampledPoints}
          fullDomain={fullDomain}
          visibleDomain={visibleDomain}
          onDomainChange={setVisibleDomain}
          thresholdPx={thresholdPx}
        />
      </div>

      {/* Gap */}
      <div className="h-4" />

      {/* Load new file link -- bottom left */}
      <div className={clsx('pb-4', isMobile ? 'px-4' : 'px-6')}>
        <button
          onClick={handleLoadNewFile}
          className="cursor-pointer text-sm underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Load new file
        </button>
      </div>
    </div>
  );
}
