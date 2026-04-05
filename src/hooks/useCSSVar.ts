import { useMemo } from 'react';
import { useTheme } from '../stores/themeStore';

/**
 * Reads a CSS custom property value from :root at render time.
 * Re-reads when the system theme changes (light/dark) so chart colors stay in sync.
 */
export function useCSSVar(name: string): string {
  const { theme } = useTheme();

  // Re-compute whenever theme or variable name changes.
  // getComputedStyle is synchronous and reads the current resolved value.
  // `theme` is used as a cache-buster: CSS custom property values change when the
  // system color scheme changes, so we must re-read them when `theme` updates.
  return useMemo(() => {
    // Reference theme so the memo invalidates on theme change.
    void theme;
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }, [name, theme]);
}

/** All chart-relevant CSS color tokens pre-resolved in one call. */
export function useChartColors(): {
  postureGood: string;
  postureSlouch: string;
  screenOff: string;
  threshold: string;
  chartLine: string;
  chartGrid: string;
  tooltipBg: string;
  tooltipText: string;
  textSecondary: string;
  bg: string;
} {
  const postureGood = useCSSVar('--color-posture-good');
  const postureSlouch = useCSSVar('--color-posture-slouch');
  const screenOff = useCSSVar('--color-screen-off');
  const threshold = useCSSVar('--color-threshold');
  const chartLine = useCSSVar('--color-chart-line');
  const chartGrid = useCSSVar('--color-chart-grid');
  const tooltipBg = useCSSVar('--color-tooltip-bg');
  const tooltipText = useCSSVar('--color-tooltip-text');
  const textSecondary = useCSSVar('--color-text-secondary');
  const bg = useCSSVar('--color-bg');

  return {
    postureGood,
    postureSlouch,
    screenOff,
    threshold,
    chartLine,
    chartGrid,
    tooltipBg,
    tooltipText,
    textSecondary,
    bg,
  };
}
