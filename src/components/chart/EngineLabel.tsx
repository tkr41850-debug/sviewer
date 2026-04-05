import { useChartState } from '../../stores/chartStore';

const ENGINE_DISPLAY_NAMES: Record<string, string> = {
  recharts: 'Recharts',
  visx: 'visx',
};

export function EngineLabel() {
  const { activeEngine } = useChartState();

  return (
    <span
      className="absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-xs opacity-60"
      style={{
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {ENGINE_DISPLAY_NAMES[activeEngine] ?? activeEngine}
    </span>
  );
}
