import { format } from 'date-fns';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: { time: number; deltaY: number | null; isScreenOff: boolean };
  }>;
  label?: number;
  colors: {
    tooltipBg: string;
    tooltipText: string;
    postureGood: string;
    postureSlouch: string;
    screenOff: string;
  };
  thresholdValue: number; // absolute px value for comparison
}

/**
 * Custom Recharts tooltip showing timestamp, delta Y value, and posture state.
 * Recharts passes active, payload, and label props automatically.
 */
export function ChartTooltip({ active, payload, colors, thresholdValue }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const { time, deltaY, isScreenOff } = data;

  // Format timestamp as HH:mm:ss
  const timestamp = format(new Date(time), 'HH:mm:ss');

  // Format deltaY with sign and px suffix
  const deltaYText = deltaY === null ? 'N/A' : `${deltaY > 0 ? '+' : ''}${Math.round(deltaY)}px`;

  // Determine posture state and color
  let stateText: string;
  let stateColor: string;

  if (isScreenOff) {
    stateText = 'Screen Off';
    stateColor = colors.screenOff;
  } else if (deltaY !== null && Math.abs(deltaY) > thresholdValue) {
    stateText = 'Slouching';
    stateColor = colors.postureSlouch;
  } else {
    stateText = 'Good';
    stateColor = colors.postureGood;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: colors.tooltipBg,
        color: colors.tooltipText,
        padding: '8px',
        borderRadius: '6px',
        fontSize: '12px',
        pointerEvents: 'none',
        zIndex: 50,
        lineHeight: 1.5,
      }}
    >
      <div>{timestamp}</div>
      <div>{deltaYText}</div>
      <div style={{ color: stateColor, fontWeight: 600 }}>{stateText}</div>
    </div>
  );
}
