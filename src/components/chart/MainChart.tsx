import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useChartColors } from '../../hooks/useCSSVar';
import { computeScreenOffRegions } from './ScreenOffBand';
import { ChartTooltip } from './ChartTooltip';
import type { PostureRecord } from '../../data/types';

interface MainChartProps {
  data: PostureRecord[];
  thresholdPx: number; // absolute threshold in pixels (already converted from % if needed)
  visibleDomain?: [number, number]; // [startTime, endTime] for zoom — undefined = full range
  onBrushChange?: (domain: [number, number] | null) => void;
}

interface ChartPoint {
  time: number;
  deltaY: number | null;
  goodFill: number | null;
  slouchFill: number | null;
  isScreenOff: boolean;
}

const MS_PER_DAY = 86_400_000;

/**
 * Core Recharts ComposedChart rendering the time-series line, area fills
 * (good/slouch), dashed threshold reference lines, screen-off shaded bands,
 * and hover tooltip. All colors are theme-aware via useChartColors.
 */
export function MainChart({ data, thresholdPx, visibleDomain }: MainChartProps) {
  const colors = useChartColors();

  // Check prefers-reduced-motion
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Compute screen-off regions
  const screenOffRegions = useMemo(() => computeScreenOffRegions(data), [data]);

  // Prepare chart data with area fill splits
  const chartData: ChartPoint[] = useMemo(
    () =>
      data.map((r) => {
        const absDelta = r.deltaY !== null ? Math.abs(r.deltaY) : null;
        return {
          time: r.time,
          deltaY: r.deltaY,
          goodFill:
            r.deltaY !== null && absDelta !== null && absDelta <= thresholdPx ? r.deltaY : null,
          slouchFill:
            r.deltaY !== null && absDelta !== null && absDelta > thresholdPx ? r.deltaY : null,
          isScreenOff: r.isScreenOff,
        };
      }),
    [data, thresholdPx]
  );

  // Determine time range for tick formatting
  const timeRange = useMemo(() => {
    if (visibleDomain) return visibleDomain[1] - visibleDomain[0];
    if (data.length < 2) return 0;
    return data[data.length - 1].time - data[0].time;
  }, [data, visibleDomain]);

  const isMultiDay = timeRange >= MS_PER_DAY;

  const formatTick = (t: number): string => {
    const date = new Date(t);
    return isMultiDay ? format(date, 'MMM dd HH:mm') : format(date, 'HH:mm');
  };

  const formatYAxis = (v: number): string => `${v}px`;

  return (
    <div
      role="img"
      aria-label="Posture data time-series graph showing vertical position delta over time"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 16, right: 16, bottom: 32, left: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
          <XAxis
            dataKey="time"
            type="number"
            domain={visibleDomain ?? ['dataMin', 'dataMax']}
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
              x1={region.startTime}
              x2={region.endTime}
              fill={colors.screenOff}
              fillOpacity={0.12}
              strokeOpacity={0}
            />
          ))}

          {/* Threshold dashed lines (positive and negative) */}
          <ReferenceLine
            y={thresholdPx}
            stroke={colors.threshold}
            strokeDasharray="6 4"
            strokeWidth={2}
            label={undefined}
          />
          <ReferenceLine
            y={-thresholdPx}
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

          <Tooltip
            content={<ChartTooltip colors={colors} thresholdValue={thresholdPx} />}
            cursor={{ stroke: colors.textSecondary, strokeDasharray: '3 3' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
