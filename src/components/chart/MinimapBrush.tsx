import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AreaChart, Area, Brush, ResponsiveContainer, XAxis } from 'recharts';
import { useChartColors } from '../../hooks/useCSSVar';
import type { PostureRecord } from '../../data/types';

interface MinimapBrushProps {
  data: PostureRecord[]; // full (or downsampled) dataset for minimap line
  fullDomain: [number, number]; // [startTime, endTime] of entire dataset
  visibleDomain: [number, number] | null; // current zoom range (null = full)
  onDomainChange: (domain: [number, number] | null) => void;
  thresholdPx: number;
}

/** Debounce delay for resize listener (ms). */
const RESIZE_DEBOUNCE_MS = 150;

/** Viewport width breakpoint for mobile layout. */
const MOBILE_BREAKPOINT = 640;

/**
 * Condensed chart with brush handles for time range selection.
 * Desktop (>= 640px): Recharts AreaChart with Brush component.
 * Mobile (< 640px): Dual range sliders for start/end time selection.
 */
export function MinimapBrush({
  data,
  fullDomain,
  visibleDomain,
  onDomainChange,
}: MinimapBrushProps) {
  const colors = useChartColors();
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

  // Prepare minimap data with only time and deltaY
  const minimapData = useMemo(
    () =>
      data.map((r) => ({
        time: r.time,
        deltaY: r.deltaY,
      })),
    [data]
  );

  // Brush change handler — maps indices to time values
  const handleBrushChange = useCallback(
    (brushState: { startIndex?: number; endIndex?: number }) => {
      const { startIndex, endIndex } = brushState;
      if (startIndex === undefined || endIndex === undefined) return;

      // Validate array bounds (T-02-08 mitigation)
      const safeStart = Math.max(0, Math.min(startIndex, data.length - 1));
      const safeEnd = Math.max(0, Math.min(endIndex, data.length - 1));

      // If brush covers full range, signal null (reset)
      if (safeStart === 0 && safeEnd === data.length - 1) {
        onDomainChange(null);
        return;
      }

      const startTime = data[safeStart].time;
      const endTime = data[safeEnd].time;
      onDomainChange([startTime, endTime]);
    },
    [data, onDomainChange]
  );

  if (isMobile) {
    return (
      <MobileRangeSlider
        fullDomain={fullDomain}
        visibleDomain={visibleDomain}
        onDomainChange={onDomainChange}
      />
    );
  }

  return (
    <div className="w-full" style={{ height: '80px' }}>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={minimapData} margin={{ top: 0, right: 16, bottom: 0, left: 48 }}>
          <XAxis dataKey="time" type="number" domain={fullDomain} hide />
          <Area
            dataKey="deltaY"
            type="monotone"
            stroke={colors.chartLine}
            strokeWidth={1}
            fill={colors.chartLine}
            fillOpacity={0.1}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Brush
            dataKey="time"
            height={80}
            stroke={colors.chartLine}
            fill="transparent"
            travellerWidth={8}
            onChange={handleBrushChange}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Mobile fallback: dual range sliders stacked for start/end time selection.
 * Uses two native <input type="range"> elements overlapped for dual-thumb effect.
 */
function MobileRangeSlider({
  fullDomain,
  visibleDomain,
  onDomainChange,
}: {
  fullDomain: [number, number];
  visibleDomain: [number, number] | null;
  onDomainChange: (domain: [number, number] | null) => void;
}) {
  const startValue = visibleDomain?.[0] ?? fullDomain[0];
  const endValue = visibleDomain?.[1] ?? fullDomain[1];
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = Number(e.target.value);
      const safeEnd = Math.max(newStart, endValue);

      // If covers full range, reset
      if (newStart <= fullDomain[0] && safeEnd >= fullDomain[1]) {
        onDomainChange(null);
        return;
      }
      onDomainChange([newStart, safeEnd]);
    },
    [endValue, fullDomain, onDomainChange]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEnd = Number(e.target.value);
      const safeStart = Math.min(startValue, newEnd);

      // If covers full range, reset
      if (safeStart <= fullDomain[0] && newEnd >= fullDomain[1]) {
        onDomainChange(null);
        return;
      }
      onDomainChange([safeStart, newEnd]);
    },
    [startValue, fullDomain, onDomainChange]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: '48px' }}
      role="group"
      aria-label="Time range selector"
    >
      <input
        type="range"
        aria-label="Range start"
        min={fullDomain[0]}
        max={fullDomain[1]}
        value={startValue}
        onChange={handleStartChange}
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{
          height: '48px',
          appearance: 'none',
          background: 'transparent',
          pointerEvents: 'auto',
          zIndex: 1,
        }}
      />
      <input
        type="range"
        aria-label="Range end"
        min={fullDomain[0]}
        max={fullDomain[1]}
        value={endValue}
        onChange={handleEndChange}
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{
          height: '48px',
          appearance: 'none',
          background: 'transparent',
          pointerEvents: 'auto',
          zIndex: 2,
        }}
      />
    </div>
  );
}
