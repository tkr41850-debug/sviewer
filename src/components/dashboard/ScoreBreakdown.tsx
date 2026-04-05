import { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- Types ---

interface ScoreBreakdownProps {
  goodPercent: number;
  slouchPercent: number;
  screenOffPercent: number;
}

// --- Helpers ---

/**
 * Read a CSS custom property value from the document root.
 * Falls back to the provided default if the property is not set or
 * if running in a non-browser environment (e.g., tests/SSR).
 */
function useCSSVarFallback(varName: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  const ref = useRef<string>(fallback);

  useEffect(() => {
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    if (resolved && resolved !== ref.current) {
      ref.current = resolved;
      setValue(resolved);
    }
  }, [varName]);

  // Listen for theme changes via media query
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      if (resolved) {
        ref.current = resolved;
        setValue(resolved);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [varName]);

  return value;
}

const GOOD_COLOR = 'oklch(65% 0.2 145)';
const SCREEN_OFF_COLOR = 'oklch(60% 0 0)';
const SLOUCH_FALLBACK = 'oklch(65% 0.2 25)';

// --- Main component ---

export function ScoreBreakdown({
  goodPercent,
  slouchPercent,
  screenOffPercent,
}: ScoreBreakdownProps) {
  const destructiveColor = useCSSVarFallback('--color-destructive', SLOUCH_FALLBACK);

  const data = [
    { name: 'Good Posture', value: goodPercent },
    { name: 'Slouching', value: slouchPercent },
    { name: 'Screen Off', value: screenOffPercent },
  ].filter((d) => d.value > 0);

  const colorMap: Record<string, string> = {
    'Good Posture': GOOD_COLOR,
    Slouching: destructiveColor,
    'Screen Off': SCREEN_OFF_COLOR,
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="w-full" aria-label="Posture score breakdown">
      <h3
        className="text-sm font-semibold uppercase tracking-wide mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Time Distribution
      </h3>
      <div className="flex items-center gap-6">
        <div style={{ width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={colorMap[entry.name]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${Math.round(value)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend beside donut */}
        <div className="flex flex-col gap-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colorMap[entry.name] }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {entry.name}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {Math.round(entry.value)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
