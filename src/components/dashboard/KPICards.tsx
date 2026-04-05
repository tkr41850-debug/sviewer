import type { DashboardMetrics, MetricQuality } from '../../metrics/types';
import { MetricCard } from './MetricCard';

interface KPICardsProps {
  metrics: DashboardMetrics;
}

function formatDuration(ms: number): { value: string; unit: string } {
  if (ms < 60000) return { value: String(Math.round(ms / 1000)), unit: 'sec' };
  if (ms < 3600000) return { value: String(Math.round(ms / 60000)), unit: 'min' };
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return { value: `${hours}h ${mins}m`, unit: '' };
}

function qualityMessage(quality: MetricQuality): string | undefined {
  if (quality === 'limited')
    return 'Based on limited data — results may not be fully representative';
  if (quality === 'insufficient') return 'Insufficient data to compute this metric reliably';
  return undefined;
}

export function KPICards({ metrics }: KPICardsProps) {
  const screenTime = formatDuration(metrics.totalScreenTime.value);

  return (
    <div className="flex flex-wrap gap-4">
      <MetricCard
        label="Posture Score"
        value={String(Math.round(metrics.postureScore.value))}
        unit="/100"
        quality={metrics.postureScore.quality}
        qualityMessage={qualityMessage(metrics.postureScore.quality)}
        colorGrade={
          metrics.postureScore.value >= 70
            ? 'good'
            : metrics.postureScore.value >= 40
              ? 'moderate'
              : 'poor'
        }
        size="large"
      />
      <MetricCard
        label="Slouch Rate"
        value={String(Math.round(metrics.slouchRate.value))}
        unit="%"
        quality={metrics.slouchRate.quality}
        qualityMessage={qualityMessage(metrics.slouchRate.quality)}
        colorGrade={
          metrics.slouchRate.value <= 30
            ? 'good'
            : metrics.slouchRate.value <= 60
              ? 'moderate'
              : 'poor'
        }
        size="large"
      />
      <MetricCard
        label="Screen Time"
        value={screenTime.value}
        unit={screenTime.unit || undefined}
        quality={metrics.totalScreenTime.quality}
        qualityMessage={qualityMessage(metrics.totalScreenTime.quality)}
        colorGrade="neutral"
        size="large"
      />
      <MetricCard
        label="Sessions"
        value={String(metrics.sessionCount.value)}
        quality={metrics.sessionCount.quality}
        qualityMessage={qualityMessage(metrics.sessionCount.quality)}
        colorGrade="neutral"
        size="large"
      />
    </div>
  );
}
