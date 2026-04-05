import type { MetricQuality } from '../../metrics/types';

interface MetricCardProps {
  label: string;
  /** Pre-formatted display string (e.g., "85", "42%", "1h 23m") */
  value: string;
  /** Optional unit suffix displayed smaller (e.g., "/100", "%", "min") */
  unit?: string;
  /** From MetricValue.quality */
  quality: MetricQuality;
  /** Tooltip text when quality is limited/insufficient (per D-12) */
  qualityMessage?: string;
  /** Color accent for the left border (per D-06) */
  colorGrade: 'good' | 'moderate' | 'poor' | 'neutral';
  /** 'large' for KPI cards (D-04), 'small' for grid (D-05) */
  size: 'large' | 'small';
}

const ACCENT_COLORS: Record<MetricCardProps['colorGrade'], string> = {
  good: 'oklch(65% 0.2 145)',
  moderate: 'oklch(75% 0.15 85)',
  poor: 'var(--color-destructive)',
  neutral: 'var(--color-border)',
};

const QUALITY_WARNING_COLORS: Record<Exclude<MetricQuality, 'reliable'>, string> = {
  limited: 'oklch(75% 0.15 85)',
  insufficient: 'var(--color-destructive)',
};

export function MetricCard({
  label,
  value,
  unit,
  quality,
  qualityMessage,
  colorGrade,
  size,
}: MetricCardProps) {
  const isLarge = size === 'large';
  const accentColor = ACCENT_COLORS[colorGrade];
  const showWarning = quality !== 'reliable';

  return (
    <div
      className="rounded-lg border flex flex-col gap-1"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderLeftWidth: '3px',
        borderLeftColor: accentColor,
        padding: isLarge ? '24px' : '16px',
        minWidth: isLarge ? '200px' : undefined,
      }}
    >
      <div className="flex items-baseline gap-1">
        <span
          style={{
            color: 'var(--color-text-primary)',
            fontSize: isLarge ? '36px' : '24px',
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: isLarge ? '21.6px' : '14.4px',
              fontWeight: 400,
            }}
          >
            {unit}
          </span>
        )}
        {showWarning && (
          <span
            style={{
              color: QUALITY_WARNING_COLORS[quality as Exclude<MetricQuality, 'reliable'>],
              fontSize: isLarge ? '16px' : '12px',
              marginLeft: '4px',
            }}
            title={qualityMessage}
            aria-label={qualityMessage}
            role="img"
          >
            {'\u26A0'}
          </span>
        )}
      </div>
      <span
        className="uppercase tracking-wide"
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: isLarge ? '14px' : '12px',
          fontWeight: 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}
