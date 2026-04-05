import { useCallback } from 'react';
import type { ThresholdConfig } from '../../data/types';

interface ThresholdControlProps {
  threshold: ThresholdConfig;
  onThresholdChange: (config: ThresholdConfig) => void;
  medianReferenceY: number; // for %<->px conversion
}

const DEFAULT_PX = 20;
const DEFAULT_PERCENT = 15;
const MAX_PERCENT = 100;
const MAX_PX = 500;

function clampValue(value: number, unit: '%' | 'px'): number {
  const max = unit === '%' ? MAX_PERCENT : MAX_PX;
  return Math.max(0, Math.min(max, Math.round(value)));
}

/**
 * Numeric input with direction selector (> / <) and %/px toggle for threshold adjustment.
 * One-sided threshold: deltaY > threshold or deltaY < -threshold.
 * Converts between units using medianReferenceY for accurate mapping.
 * Touch-target compliant (44px min) and theme-aware via CSS variables.
 */
export function ThresholdControl({
  threshold,
  onThresholdChange,
  medianReferenceY,
}: ThresholdControlProps) {
  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseFloat(e.target.value);
      if (isNaN(raw)) return;
      const clamped = clampValue(raw, threshold.unit);
      onThresholdChange({ ...threshold, value: clamped });
    },
    [threshold, onThresholdChange]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = parseFloat(e.target.value);
      if (isNaN(raw) || e.target.value.trim() === '') {
        const defaultValue = threshold.unit === '%' ? DEFAULT_PERCENT : DEFAULT_PX;
        onThresholdChange({ ...threshold, value: defaultValue });
      }
    },
    [threshold, onThresholdChange]
  );

  const handleUnitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newUnit = e.target.value as '%' | 'px';
      if (newUnit === threshold.unit) return;

      let newValue: number;
      if (newUnit === 'px') {
        newValue = Math.round(medianReferenceY * (threshold.value / 100));
      } else {
        newValue =
          medianReferenceY > 0
            ? Math.round((threshold.value / medianReferenceY) * 100)
            : DEFAULT_PERCENT;
      }

      newValue = clampValue(newValue, newUnit);
      onThresholdChange({ ...threshold, value: newValue, unit: newUnit });
    },
    [threshold, onThresholdChange, medianReferenceY]
  );

  const handleDirectionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newDirection = e.target.value as '>' | '<';
      onThresholdChange({ ...threshold, direction: newDirection });
    },
    [threshold, onThresholdChange]
  );

  const handleInvertYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onThresholdChange({ ...threshold, invertY: e.target.checked });
    },
    [threshold, onThresholdChange]
  );

  const selectStyle = {
    minHeight: '44px',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    background: 'var(--color-bg)',
    fontSize: '14px',
    padding: '0 8px',
  };

  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: 'var(--color-surface)',
        borderRadius: '8px',
        padding: '8px 12px',
      }}
    >
      <label
        htmlFor="threshold-value"
        className="select-none"
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: 'var(--color-text-secondary)',
        }}
      >
        Slouch when
      </label>
      <select
        aria-label="Threshold direction"
        value={threshold.direction}
        onChange={handleDirectionChange}
        className="rounded border focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        style={selectStyle}
      >
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
      </select>
      <input
        id="threshold-value"
        type="number"
        aria-label="Slouch threshold value"
        value={threshold.value}
        min={0}
        max={threshold.unit === '%' ? MAX_PERCENT : MAX_PX}
        step={1}
        onChange={handleValueChange}
        onBlur={handleBlur}
        className="w-16 text-center rounded border focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        style={{
          minHeight: '44px',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          background: 'var(--color-bg)',
          fontSize: '14px',
        }}
      />
      <select
        aria-label="Threshold unit"
        value={threshold.unit}
        onChange={handleUnitChange}
        className="rounded border focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        style={selectStyle}
      >
        <option value="%">%</option>
        <option value="px">px</option>
      </select>
      <label
        className="flex items-center gap-1.5 select-none"
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: 'var(--color-text-secondary)',
          marginLeft: '4px',
        }}
      >
        <input
          type="checkbox"
          checked={threshold.invertY}
          onChange={handleInvertYChange}
          aria-label="Invert Y axis"
          className="rounded"
          style={{ accentColor: 'var(--color-accent)' }}
        />
        Invert Y
      </label>
    </div>
  );
}
