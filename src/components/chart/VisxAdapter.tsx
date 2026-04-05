import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath, AreaClosed } from '@visx/shape';
import { GridRows, GridColumns } from '@visx/grid';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { curveMonotoneX } from 'd3-shape';
import { useChartColors } from '../../hooks/useCSSVar';
import { computeScreenOffRegions } from './ScreenOffBand';
import type { ChartAdapterProps, PostureRecord } from '../../data/types';

const margin = { top: 16, right: 16, bottom: 32, left: 48 };

const MS_PER_DAY = 86_400_000;

/**
 * Converts a Unix ms timestamp to minutes since midnight.
 */
function toMinutesSinceMidnight(timeMs: number): number {
  const date = new Date(timeMs);
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

/**
 * Splits data into contiguous segments where records are not screen-off
 * and have non-null deltaY. Creates line breaks at screen-off boundaries.
 */
function segmentByScreenOff(data: PostureRecord[]): PostureRecord[][] {
  const segments: PostureRecord[][] = [];
  let current: PostureRecord[] = [];
  for (const d of data) {
    if (d.isScreenOff || d.deltaY === null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push(d);
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

/**
 * Binary search to find the nearest data point to a given x-coordinate.
 */
function findNearestPoint(
  data: PostureRecord[],
  targetX: number,
  xAccessor: (d: PostureRecord) => number
): PostureRecord | null {
  if (data.length === 0) return null;

  let lo = 0;
  let hi = data.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xAccessor(data[mid]) < targetX) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // Check both lo and lo-1 to find the closest
  const candidates = [data[lo]];
  if (lo > 0) candidates.push(data[lo - 1]);

  let nearest = candidates[0];
  let nearestDist = Math.abs(xAccessor(nearest) - targetX);
  for (let i = 1; i < candidates.length; i++) {
    const dist = Math.abs(xAccessor(candidates[i]) - targetX);
    if (dist < nearestDist) {
      nearest = candidates[i];
      nearestDist = dist;
    }
  }

  return nearest;
}

interface TooltipData {
  time: number;
  deltaY: number | null;
  isScreenOff: boolean;
}

/**
 * visx/D3 engine implementing ChartAdapterProps.
 * Renders threshold lines, screen-off bands, tooltips, area fills,
 * and line breaks at gaps — feature parity with RechartsAdapter.
 */
export function VisxAdapter({
  data,
  thresholdPx,
  visibleDomain,
  onBrushChange,
  annotations,
  onAnnotationCreate,
  comparisonData,
  normalizeTimeAxis,
}: ChartAdapterProps) {
  const colors = useChartColors();

  // Suppress unused var warning
  void onBrushChange;

  // Filter data to visible domain
  const filteredData = useMemo(() => {
    if (!visibleDomain) return data;
    const [start, end] = visibleDomain;
    return data.filter((d) => d.time >= start && d.time <= end);
  }, [data, visibleDomain]);

  // Segment data for line breaks at screen-off boundaries
  const segments = useMemo(() => segmentByScreenOff(filteredData), [filteredData]);

  // Screen-off regions
  const screenOffRegions = useMemo(() => computeScreenOffRegions(filteredData), [filteredData]);

  // Non-screen-off data for scales
  const activeData = useMemo(
    () => filteredData.filter((d) => !d.isScreenOff && d.deltaY !== null),
    [filteredData]
  );

  // Determine time range for tick formatting
  const timeRange = useMemo(() => {
    if (visibleDomain) return visibleDomain[1] - visibleDomain[0];
    if (filteredData.length < 2) return 0;
    return filteredData[filteredData.length - 1].time - filteredData[0].time;
  }, [filteredData, visibleDomain]);

  const isMultiDay = timeRange >= MS_PER_DAY;

  // Comparison segments
  const comparisonSegments = useMemo(() => {
    if (!comparisonData) return null;
    return segmentByScreenOff(comparisonData);
  }, [comparisonData]);

  // X accessor based on normalize mode
  const xAccessor = useCallback(
    (d: PostureRecord) => (normalizeTimeAxis ? toMinutesSinceMidnight(d.time) : d.time),
    [normalizeTimeAxis]
  );

  // Tooltip state
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<TooltipData>();

  return (
    <div role="img" aria-label="Posture data time-series graph" className="relative h-full w-full">
      <ParentSize>
        {({ width, height }) => {
          if (width < 10 || height < 10) return null;

          const innerWidth = width - margin.left - margin.right;
          const innerHeight = height - margin.top - margin.bottom;

          // X scale
          const xScale = normalizeTimeAxis
            ? scaleLinear<number>({
                domain: [0, 1440],
                range: [margin.left, width - margin.right],
              })
            : scaleTime<number>({
                domain: visibleDomain
                  ? [new Date(visibleDomain[0]), new Date(visibleDomain[1])]
                  : activeData.length >= 2
                    ? [
                        new Date(activeData[0].time),
                        new Date(activeData[activeData.length - 1].time),
                      ]
                    : [new Date(), new Date()],
                range: [margin.left, width - margin.right],
              });

          // Y scale
          const yValues = activeData.map((d) => d.deltaY!);
          const yMin = yValues.length > 0 ? Math.min(...yValues, -thresholdPx) : -thresholdPx;
          const yMax = yValues.length > 0 ? Math.max(...yValues, thresholdPx) : thresholdPx;
          const yPadding = (yMax - yMin) * 0.1 || 10;
          const yScale = scaleLinear<number>({
            domain: [yMin - yPadding, yMax + yPadding],
            range: [height - margin.bottom, margin.top],
          });

          // X/Y accessors for visx shapes
          const xPos = (d: PostureRecord) => {
            const val = xAccessor(d);
            return Number(xScale(normalizeTimeAxis ? val : new Date(val))) || 0;
          };
          const yPos = (d: PostureRecord) => {
            return Number(yScale(d.deltaY ?? 0)) || 0;
          };

          // Area data: good fill (clamped to threshold)
          const goodAreaData = (segment: PostureRecord[]) =>
            segment.map((d) => ({
              ...d,
              clampedDeltaY:
                d.deltaY !== null ? Math.max(-thresholdPx, Math.min(thresholdPx, d.deltaY)) : 0,
            }));

          // Area data: slouch fill (beyond threshold)
          const slouchSegments = (segment: PostureRecord[]) =>
            segment.filter((d) => d.deltaY !== null && Math.abs(d.deltaY) > thresholdPx);

          // Handle mouse move for tooltip
          const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
            const point = localPoint(event);
            if (!point) return;

            const x0 = normalizeTimeAxis
              ? (xScale as ReturnType<typeof scaleLinear<number>>).invert(point.x)
              : (xScale as ReturnType<typeof scaleTime<number>>).invert(point.x).getTime();

            const nearest = findNearestPoint(
              activeData.length > 0 ? activeData : filteredData,
              normalizeTimeAxis ? x0 : x0,
              (d) => (normalizeTimeAxis ? toMinutesSinceMidnight(d.time) : d.time)
            );

            if (nearest) {
              showTooltip({
                tooltipData: {
                  time: nearest.time,
                  deltaY: nearest.deltaY,
                  isScreenOff: nearest.isScreenOff,
                },
                tooltipLeft: xPos(nearest),
                tooltipTop: yPos(nearest),
              });
            }
          };

          // Handle click — create annotation
          const handleClick = (event: React.MouseEvent<SVGRectElement>) => {
            if (!onAnnotationCreate) return;
            const point = localPoint(event);
            if (!point) return;

            const x0 = normalizeTimeAxis
              ? (xScale as ReturnType<typeof scaleLinear<number>>).invert(point.x)
              : (xScale as ReturnType<typeof scaleTime<number>>).invert(point.x).getTime();

            const nearest = findNearestPoint(
              activeData.length > 0 ? activeData : filteredData,
              normalizeTimeAxis ? x0 : x0,
              (d) => (normalizeTimeAxis ? toMinutesSinceMidnight(d.time) : d.time)
            );

            if (nearest && nearest.deltaY !== null) {
              onAnnotationCreate(nearest.time, nearest.deltaY);
            }
          };

          // Tick format for X axis
          const formatTick = normalizeTimeAxis
            ? (v: number) => {
                const hrs = Math.floor(v as number) % 24;
                const mins = Math.round(((v as number) % 1) * 60);
                return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
              }
            : (v: Date | { valueOf(): number }) => {
                const date = v instanceof Date ? v : new Date(v.valueOf());
                return isMultiDay ? format(date, 'MMM dd HH:mm') : format(date, 'HH:mm');
              };

          return (
            <svg width={width} height={height}>
              {/* Grid */}
              <GridRows
                scale={yScale}
                width={innerWidth}
                left={margin.left}
                stroke={colors.chartGrid}
                strokeDasharray="3,3"
                strokeOpacity={0.5}
              />
              <GridColumns
                scale={xScale}
                height={innerHeight}
                top={margin.top}
                stroke={colors.chartGrid}
                strokeDasharray="3,3"
                strokeOpacity={0.5}
              />

              {/* Screen-off bands */}
              {screenOffRegions.map((region, i) => {
                const x1 = normalizeTimeAxis
                  ? Number(xScale(toMinutesSinceMidnight(region.startTime)))
                  : Number(xScale(new Date(region.startTime)));
                const x2 = normalizeTimeAxis
                  ? Number(xScale(toMinutesSinceMidnight(region.endTime)))
                  : Number(xScale(new Date(region.endTime)));
                return (
                  <rect
                    key={`so-${i}`}
                    x={x1}
                    y={margin.top}
                    width={Math.max(0, x2 - x1)}
                    height={innerHeight}
                    fill={colors.screenOff}
                    opacity={0.12}
                  />
                );
              })}

              {/* Threshold dashed lines */}
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={yScale(thresholdPx)}
                y2={yScale(thresholdPx)}
                stroke={colors.threshold}
                strokeDasharray="6,4"
                strokeWidth={2}
              />
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={yScale(-thresholdPx)}
                y2={yScale(-thresholdPx)}
                stroke={colors.threshold}
                strokeDasharray="6,4"
                strokeWidth={2}
              />

              {/* Area fills — good posture (clamped to threshold range) */}
              {segments.map((segment, i) => {
                const areaData = goodAreaData(segment);
                return (
                  <AreaClosed
                    key={`good-${i}`}
                    data={areaData}
                    x={(d) => xPos(d as PostureRecord)}
                    y={(d) =>
                      yScale((d as PostureRecord & { clampedDeltaY: number }).clampedDeltaY)
                    }
                    yScale={yScale}
                    fill={colors.postureGood}
                    fillOpacity={0.15}
                    stroke="none"
                    curve={curveMonotoneX}
                  />
                );
              })}

              {/* Area fills — slouch (beyond threshold) */}
              {segments.map((segment, i) => {
                const slouchData = slouchSegments(segment);
                if (slouchData.length < 2) return null;
                return (
                  <AreaClosed
                    key={`slouch-${i}`}
                    data={slouchData}
                    x={(d) => xPos(d as PostureRecord)}
                    y={(d) => yScale((d as PostureRecord).deltaY ?? 0)}
                    yScale={yScale}
                    fill={colors.postureSlouch}
                    fillOpacity={0.2}
                    stroke="none"
                    curve={curveMonotoneX}
                  />
                );
              })}

              {/* Main data line segments */}
              {segments.map((segment, i) => (
                <LinePath
                  key={`line-${i}`}
                  data={segment}
                  x={(d) => xPos(d)}
                  y={(d) => yPos(d)}
                  stroke={colors.chartLine}
                  strokeWidth={1.5}
                  curve={curveMonotoneX}
                />
              ))}

              {/* Comparison data lines */}
              {comparisonSegments?.map((segment, i) => (
                <LinePath
                  key={`comp-${i}`}
                  data={segment}
                  x={(d) => xPos(d)}
                  y={(d) => yPos(d)}
                  stroke={colors.postureSlouch}
                  strokeWidth={1.5}
                  strokeDasharray="4,2"
                  curve={curveMonotoneX}
                />
              ))}

              {/* Annotation markers */}
              {annotations.map((ann) => {
                const cx = normalizeTimeAxis
                  ? Number(xScale(toMinutesSinceMidnight(ann.time)))
                  : Number(xScale(new Date(ann.time)));
                const cy = yScale(ann.deltaY);
                return (
                  <circle
                    key={ann.id}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={colors.threshold}
                    stroke={colors.chartLine}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Axes */}
              <AxisBottom
                scale={xScale}
                top={height - margin.bottom}
                tickFormat={formatTick as (value: unknown) => string}
                tickLabelProps={{
                  fontSize: 12,
                  fill: colors.textSecondary,
                  textAnchor: 'middle' as const,
                }}
                stroke={colors.chartGrid}
                tickStroke={colors.chartGrid}
                numTicks={Math.max(2, Math.floor(innerWidth / 100))}
              />
              <AxisLeft
                scale={yScale}
                left={margin.left}
                tickFormat={(v) => `${v}px`}
                tickLabelProps={{
                  fontSize: 12,
                  fill: colors.textSecondary,
                  textAnchor: 'end' as const,
                  dx: -4,
                }}
                stroke={colors.chartGrid}
                tickStroke={colors.chartGrid}
              />

              {/* Invisible overlay rect for mouse events */}
              <rect
                x={margin.left}
                y={margin.top}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onMouseMove={handleMouseMove}
                onMouseLeave={hideTooltip}
                onClick={handleClick}
              />

              {/* Tooltip crosshair indicator */}
              {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
                <>
                  <circle
                    cx={tooltipLeft}
                    cy={tooltipTop}
                    r={4}
                    fill={colors.chartLine}
                    stroke="white"
                    strokeWidth={1.5}
                    pointerEvents="none"
                  />
                  <line
                    x1={tooltipLeft}
                    x2={tooltipLeft}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    stroke={colors.textSecondary}
                    strokeDasharray="3,3"
                    strokeWidth={1}
                    pointerEvents="none"
                  />
                </>
              )}
            </svg>
          );
        }}
      </ParentSize>

      {/* Tooltip overlay */}
      {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop - 40}
          style={{
            ...defaultStyles,
            backgroundColor: colors.tooltipBg,
            color: colors.tooltipText,
            padding: '8px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: 1.5,
            pointerEvents: 'none' as const,
            zIndex: 50,
          }}
        >
          <div>{format(new Date(tooltipData.time), 'HH:mm:ss')}</div>
          <div>
            {tooltipData.deltaY === null
              ? 'N/A'
              : `${tooltipData.deltaY > 0 ? '+' : ''}${Math.round(tooltipData.deltaY)}px`}
          </div>
          <div
            style={{
              color: tooltipData.isScreenOff
                ? colors.screenOff
                : tooltipData.deltaY !== null && Math.abs(tooltipData.deltaY) > thresholdPx
                  ? colors.postureSlouch
                  : colors.postureGood,
              fontWeight: 600,
            }}
          >
            {tooltipData.isScreenOff
              ? 'Screen Off'
              : tooltipData.deltaY !== null && Math.abs(tooltipData.deltaY) > thresholdPx
                ? 'Slouching'
                : 'Good'}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
