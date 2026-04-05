import type { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

/**
 * Dashboard container with section ordering and scroll layout (D-01, D-02, D-03).
 * Provides the scrollable container below the hero graph.
 * Children should be: KPICards, MetricGrid, SessionTimeline, CalendarHeatmap, ScoreBreakdown.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <section
      className="w-full px-4 sm:px-6 lg:px-8 pb-12"
      style={{ background: 'var(--color-bg)' }}
      aria-label="Posture analytics dashboard"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">{children}</div>
    </section>
  );
}
