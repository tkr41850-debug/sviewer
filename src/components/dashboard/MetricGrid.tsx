import type { DashboardMetrics, MetricQuality, TrendDirection } from '../../metrics/types';
import { MetricCard } from './MetricCard';

interface MetricGridProps {
  metrics: DashboardMetrics;
}

interface FormattedMetric {
  label: string;
  value: string;
  unit?: string;
  colorGrade: 'good' | 'moderate' | 'poor' | 'neutral';
  quality: MetricQuality;
  qualityMessage?: string;
}

function formatDuration(ms: number): { value: string; unit: string } {
  if (ms < 60000) return { value: String(Math.round(ms / 1000)), unit: 'sec' };
  if (ms < 3600000) return { value: String(Math.round(ms / 60000)), unit: 'min' };
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return { value: `${hours}h ${mins}m`, unit: '' };
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function qualityMessage(quality: MetricQuality): string | undefined {
  if (quality === 'limited')
    return 'Based on limited data — results may not be fully representative';
  if (quality === 'insufficient') return 'Insufficient data to compute this metric reliably';
  return undefined;
}

function trendColorGrade(direction: TrendDirection): 'good' | 'moderate' | 'poor' | 'neutral' {
  if (direction === 'improving') return 'good';
  if (direction === 'declining') return 'poor';
  return 'neutral';
}

function buildMetrics(metrics: DashboardMetrics): FormattedMetric[] {
  const m = metrics;
  const result: FormattedMetric[] = [];

  // METR-03: Avg Correction Time
  const correction = formatDuration(m.avgTimeToCorrect.value);
  result.push({
    label: 'Avg Correction Time',
    value: correction.value,
    unit: correction.unit || undefined,
    colorGrade:
      m.avgTimeToCorrect.value < 30000
        ? 'good'
        : m.avgTimeToCorrect.value < 120000
          ? 'moderate'
          : 'poor',
    quality: m.avgTimeToCorrect.quality,
    qualityMessage: qualityMessage(m.avgTimeToCorrect.quality),
  });

  // METR-06: Longest Slouch
  const longestSlouch = formatDuration(m.longestSlouchStreak.value);
  result.push({
    label: 'Longest Slouch',
    value: longestSlouch.value,
    unit: longestSlouch.unit || undefined,
    colorGrade:
      m.longestSlouchStreak.value < 300000
        ? 'good'
        : m.longestSlouchStreak.value < 900000
          ? 'moderate'
          : 'poor',
    quality: m.longestSlouchStreak.quality,
    qualityMessage: qualityMessage(m.longestSlouchStreak.quality),
  });

  // METR-07: Longest Good Streak
  const longestGood = formatDuration(m.longestGoodStreak.value);
  result.push({
    label: 'Longest Good Streak',
    value: longestGood.value,
    unit: longestGood.unit || undefined,
    colorGrade:
      m.longestGoodStreak.value > 1800000
        ? 'good'
        : m.longestGoodStreak.value > 600000
          ? 'moderate'
          : 'poor',
    quality: m.longestGoodStreak.quality,
    qualityMessage: qualityMessage(m.longestGoodStreak.quality),
  });

  // METR-08: Break Frequency
  const breakFreq = formatDuration(m.breakFrequency.value);
  result.push({
    label: 'Break Frequency',
    value: breakFreq.value,
    unit: breakFreq.unit || undefined,
    colorGrade: 'neutral',
    quality: m.breakFrequency.quality,
    qualityMessage: qualityMessage(m.breakFrequency.quality),
  });

  // METR-09: Worst Hour
  result.push({
    label: 'Worst Hour',
    value: formatHour(m.worstHour.value),
    colorGrade: 'poor',
    quality: m.worstHour.quality,
    qualityMessage: qualityMessage(m.worstHour.quality),
  });

  // METR-10: Best Hour
  result.push({
    label: 'Best Hour',
    value: formatHour(m.bestHour.value),
    colorGrade: 'good',
    quality: m.bestHour.quality,
    qualityMessage: qualityMessage(m.bestHour.quality),
  });

  // METR-11: Daily Trend
  result.push({
    label: 'Daily Trend',
    value: capitalize(m.dailyTrend.value),
    colorGrade: trendColorGrade(m.dailyTrend.value),
    quality: m.dailyTrend.quality,
    qualityMessage: qualityMessage(m.dailyTrend.quality),
  });

  // METR-12: Improvement Rate
  result.push({
    label: 'Improvement Rate',
    value: m.improvementRate.value.toFixed(1),
    unit: 'pts/hr',
    colorGrade:
      m.improvementRate.value > 0 ? 'good' : m.improvementRate.value < 0 ? 'poor' : 'neutral',
    quality: m.improvementRate.quality,
    qualityMessage: qualityMessage(m.improvementRate.quality),
  });

  // METR-13: Severity Distribution
  const sev = m.severityDistribution.value;
  result.push({
    label: 'Slouch Severity',
    value: `${sev.mild}/${sev.moderate}/${sev.severe}`,
    unit: 'M/Mod/S',
    colorGrade: sev.severe === 0 ? 'good' : sev.severe < sev.moderate ? 'moderate' : 'poor',
    quality: m.severityDistribution.quality,
    qualityMessage: qualityMessage(m.severityDistribution.quality),
  });

  // METR-14: Time to First Slouch
  const firstSlouch = formatDuration(m.avgTimeToFirstSlouch.value);
  result.push({
    label: 'Time to First Slouch',
    value: firstSlouch.value,
    unit: firstSlouch.unit || undefined,
    colorGrade:
      m.avgTimeToFirstSlouch.value > 1800000
        ? 'good'
        : m.avgTimeToFirstSlouch.value > 600000
          ? 'moderate'
          : 'poor',
    quality: m.avgTimeToFirstSlouch.quality,
    qualityMessage: qualityMessage(m.avgTimeToFirstSlouch.quality),
  });

  // METR-15: Posture Stability (volatility)
  result.push({
    label: 'Posture Stability',
    value: m.postureVolatility.value.toFixed(1),
    unit: 'px',
    colorGrade:
      m.postureVolatility.value < 10
        ? 'good'
        : m.postureVolatility.value < 25
          ? 'moderate'
          : 'poor',
    quality: m.postureVolatility.quality,
    qualityMessage: qualityMessage(m.postureVolatility.quality),
  });

  // METR-16: Total Slouch Time
  const slouchTime = formatDuration(m.cumulativeSlouchTime.value);
  result.push({
    label: 'Total Slouch Time',
    value: slouchTime.value,
    unit: slouchTime.unit || undefined,
    colorGrade: m.slouchRate.value <= 30 ? 'good' : m.slouchRate.value <= 60 ? 'moderate' : 'poor',
    quality: m.cumulativeSlouchTime.quality,
    qualityMessage: qualityMessage(m.cumulativeSlouchTime.quality),
  });

  // METR-17: Recovery Trend
  result.push({
    label: 'Recovery Trend',
    value: capitalize(m.recoverySpeedTrend.value),
    colorGrade: trendColorGrade(m.recoverySpeedTrend.value),
    quality: m.recoverySpeedTrend.quality,
    qualityMessage: qualityMessage(m.recoverySpeedTrend.quality),
  });

  // METR-18 slouchByHour is consumed by the heatmap (VIEW-04), not the grid

  return result;
}

export function MetricGrid({ metrics }: MetricGridProps) {
  const formattedMetrics = buildMetrics(metrics);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {formattedMetrics.map((m, i) => (
        <MetricCard key={i} {...m} size="small" />
      ))}
    </div>
  );
}
