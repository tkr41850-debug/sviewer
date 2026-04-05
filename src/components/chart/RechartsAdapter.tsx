import { useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useChartColors } from '../../hooks/useCSSVar';
import { computeScreenOffRegions } from './ScreenOffBand';
import { ChartTooltip } from './ChartTooltip';
import { AnnotationLayer } from './AnnotationLayer';
import type { ChartAdapterProps } from '../../data/types';

interface ChartPoint {
  time: number;
  displayTime: number; // time value used for X-axis (may be normalized to minutes-since-midnight)
  deltaY: number | null;
  goodFill: number | null;
  slouchFill: number | null;
  isScreenOff: boolean;
}

const MS_PER_DAY = 86_400_000;

/**
 * Converts a Unix ms timestamp to minutes since midnight.
 */
function toMinutesSinceMidnight(timeMs: number): number {
  const date = new Date(timeMs);
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

/**
 * Recharts engine implementing ChartAdapterProps.
 * Refactored from MainChart — renders ComposedChart with threshold lines,
 * screen-off bands, area fills (good/slouch), data line, and tooltips.
 */
export function RechartsAdapter({
  data,
  thresholdPx,
  visibleDomain,
  onBrushChange,
  annotations,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  comparisonData,
  comparisonLabel,
  primaryLabel,
  normalizeTimeAxis,
  direction = '>',
}: ChartAdapterProps) {
  const colors = useChartColors();
  const containerRef = useRef<HTMLDivElement>(null);

  // Suppress unused var warning — onBrushChange passed for future brush wiring
  void onBrushChange;

  // Check prefers-reduced-motion
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Compute screen-off regions
  const screenOffRegions = useMemo(() => computeScreenOffRegions(data), [data]);

  // Prepare chart data with area fill splits (one-sided threshold)
  const chartData: ChartPoint[] = useMemo(
    () =>
      data.map((r) => {
        const displayTime = normalizeTimeAxis ? toMinutesSinceMidnight(r.time) : r.time;
        // One-sided: '>' means deltaY > threshold is slouching (larger y = physically lower)
        const slouching =
          r.deltaY !== null &&
          (direction === '>' ? r.deltaY > thresholdPx : r.deltaY < -thresholdPx);
        return {
          time: r.time,
          displayTime,
          deltaY: r.deltaY,
          goodFill: r.deltaY !== null && !slouching ? r.deltaY : null,
          slouchFill: r.deltaY !== null && slouching ? r.deltaY : null,
          isScreenOff: r.isScreenOff,
        };
      }),
    [data, thresholdPx, direction, normalizeTimeAxis]
  );

  // Prepare comparison data if provided
  const comparisonChartData = useMemo(() => {
    if (!comparisonData) return null;
    return comparisonData.map((r) => ({
      time: r.time,
      displayTime: normalizeTimeAxis ? toMinutesSinceMidnight(r.time) : r.time,
      deltaY: r.deltaY,
      comparisonDeltaY: r.deltaY,
    }));
  }, [comparisonData, normalizeTimeAxis]);

  // Merge comparison data into main chart data for rendering on same chart
  const mergedChartData = useMemo(() => {
    if (!comparisonChartData) return chartData;
    // Create a map of displayTime -> comparisonDeltaY
    const compMap = new Map<number, number | null>();
    for (const d of comparisonChartData) {
      compMap.set(d.displayTime, d.comparisonDeltaY);
    }
    // Merge into primary data
    const merged = chartData.map((d) => ({
      ...d,
      comparisonDeltaY: compMap.get(d.displayTime) ?? null,
    }));
    // Add any comparison-only points
    for (const cd of comparisonChartData) {
      if (!chartData.some((d) => d.displayTime === cd.displayTime)) {
        merged.push({
          time: cd.time,
          displayTime: cd.displayTime,
          deltaY: null,
          goodFill: null,
          slouchFill: null,
          isScreenOff: false,
          comparisonDeltaY: cd.comparisonDeltaY,
        });
      }
    }
    merged.sort((a, b) => a.displayTime - b.displayTime);
    return merged;
  }, [chartData, comparisonChartData]);

  // Determine time range for tick formatting
  const timeRange = useMemo(() => {
    if (visibleDomain) return visibleDomain[1] - visibleDomain[0];
    if (data.length < 2) return 0;
    return data[data.length - 1].time - data[0].time;
  }, [data, visibleDomain]);

  const isMultiDay = timeRange >= MS_PER_DAY;

  const formatTick = normalizeTimeAxis
    ? (minutes: number): string => {
        const hrs = Math.floor(minutes) % 24;
        const mins = Math.round((minutes % 1) * 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      }
    : (t: number): string => {
        const date = new Date(t);
        return isMultiDay ? format(date, 'MMM dd HH:mm') : format(date, 'HH:mm');
      };

  const formatYAxis = (v: number): string => `${v}px`;

  // Margins must match ComposedChart margin prop
  const marginLeft = 48;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 32;

  // Map annotation time to X pixel position within the chart container
  const timeToX = useCallback(
    (time: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const chartWidth = rect.width - marginLeft - marginRight;
      const timeVal = normalizeTimeAxis ? toMinutesSinceMidnight(time) : time;
      let domainMin: number, domainMax: number;
      if (normalizeTimeAxis) {
        domainMin = 0;
        domainMax = 1440;
      } else if (visibleDomain) {
        [domainMin, domainMax] = visibleDomain;
      } else {
        domainMin = data.length > 0 ? Math.min(...data.map((d) => d.time)) : 0;
        domainMax = data.length > 0 ? Math.max(...data.map((d) => d.time)) : 1;
      }
      if (domainMax === domainMin) return marginLeft;
      return marginLeft + ((timeVal - domainMin) / (domainMax - domainMin)) * chartWidth;
    },
    [data, visibleDomain, normalizeTimeAxis]
  );

  // Map annotation deltaY to Y pixel position within the chart container
  const deltaYToY = useCallback(
    (deltaY: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const chartHeight = rect.height - marginTop - marginBottom;
      const yValues = data.filter((d) => d.deltaY !== null).map((d) => d.deltaY!);
      const yMin = yValues.length > 0 ? Math.min(...yValues, -thresholdPx) : -thresholdPx;
      const yMax = yValues.length > 0 ? Math.max(...yValues, thresholdPx) : thresholdPx;
      const padding = (yMax - yMin) * 0.1 || 10;
      const fullMin = yMin - padding;
      const fullMax = yMax + padding;
      if (fullMax === fullMin) return marginTop;
      return marginTop + ((fullMax - deltaY) / (fullMax - fullMin)) * chartHeight;
    },
    [data, thresholdPx]
  );

  // Handle chart click — find nearest data point and create annotation (D-07)
  const handleChartClick = useCallback(
    (nextState: Record<string, unknown>) => {
      if (!onAnnotationCreate) return;
      const idx = nextState.activeTooltipIndex;
      if (typeof idx !== 'number') return;
      const point = mergedChartData[idx];
      if (point && point.deltaY !== null) {
        onAnnotationCreate(point.time, point.deltaY);
      }
    },
    [onAnnotationCreate, mergedChartData]
  );

  // Compute visible domain for X-axis in normalized mode
  const xDomain = useMemo(() => {
    if (normalizeTimeAxis) {
      return [0, 1440] as [number, number]; // 0 to 24*60 minutes
    }
    return visibleDomain ?? (['dataMin', 'dataMax'] as const);
  }, [normalizeTimeAxis, visibleDomain]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Posture data time-series graph"
      className="relative h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={mergedChartData}
          margin={{ top: 16, right: 16, bottom: 32, left: 48 }}
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
          <XAxis
            dataKey="displayTime"
            type="number"
            domain={xDomain}
            tickFormatter={formatTick}
            tick={{ fontSize: 12, fill: colors.textSecondary }}
            stroke={colors.chartGrid}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: colors.textSecondary }}
            stroke={colors.chartGrid}
          />

          {/* Screen-off bands as ReferenceArea */}
          {screenOffRegions.map((region, i) => (
            <ReferenceArea
              key={`screenoff-${i}`}
              x1={normalizeTimeAxis ? toMinutesSinceMidnight(region.startTime) : region.startTime}
              x2={normalizeTimeAxis ? toMinutesSinceMidnight(region.endTime) : region.endTime}
              fill={colors.screenOff}
              fillOpacity={0.12}
              strokeOpacity={0}
            />
          ))}

          {/* Threshold dashed line (one-sided: larger y = physically lower) */}
          <ReferenceLine
            y={direction === '>' ? thresholdPx : -thresholdPx}
            stroke={colors.threshold}
            strokeDasharray="6 4"
            strokeWidth={2}
            label={undefined}
          />

          {/* Area fill for good posture (below threshold) */}
          <Area
            dataKey="goodFill"
            type="monotone"
            fill={colors.postureGood}
            fillOpacity={0.15}
            stroke="none"
            isAnimationActive={!reducedMotion}
            animationDuration={400}
            connectNulls={false}
          />

          {/* Area fill for slouch (above threshold) */}
          <Area
            dataKey="slouchFill"
            type="monotone"
            fill={colors.postureSlouch}
            fillOpacity={0.2}
            stroke="none"
            isAnimationActive={!reducedMotion}
            animationDuration={400}
            connectNulls={false}
          />

          {/* Main data line */}
          <Line
            dataKey="deltaY"
            type="monotone"
            stroke={colors.chartLine}
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={!reducedMotion}
            animationDuration={400}
          />

          {/* Comparison data line (if comparison mode active) */}
          {comparisonData && (
            <Line
              dataKey="comparisonDeltaY"
              type="monotone"
              stroke={colors.postureSlouch}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
              isAnimationActive={!reducedMotion}
              animationDuration={400}
              strokeDasharray="4 2"
            />
          )}

          {/* Annotation markers */}
          {annotations.map((ann) => (
            <ReferenceDot
              key={ann.id}
              x={normalizeTimeAxis ? toMinutesSinceMidnight(ann.time) : ann.time}
              y={ann.deltaY}
              r={5}
              fill={colors.threshold}
              stroke={colors.chartLine}
              strokeWidth={1}
            />
          ))}

          <Tooltip
            content={<ChartTooltip colors={colors} thresholdValue={thresholdPx} />}
            cursor={{ stroke: colors.textSecondary, strokeDasharray: '3 3' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Annotation overlay — positioned absolutely over chart (D-07/D-08/D-09) */}
      <AnnotationLayer
        annotations={annotations}
        timeToX={timeToX}
        deltaYToY={deltaYToY}
        onUpdate={onAnnotationUpdate}
        onDelete={onAnnotationDelete}
      />

      {/* Comparison legend */}
      {comparisonData && primaryLabel && comparisonLabel && (
        <div
          className="absolute left-14 top-1 flex items-center gap-3 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4" style={{ background: colors.chartLine }} />
            {primaryLabel}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-0.5 w-4"
              style={{
                background: colors.postureSlouch,
                borderTop: '1px dashed ' + colors.postureSlouch,
              }}
            />
            {comparisonLabel}
          </span>
        </div>
      )}
    </div>
  );
}
