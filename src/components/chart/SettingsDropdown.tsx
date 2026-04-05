import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings, Check } from 'lucide-react';
import { useChartState, useChartDispatch } from '../../stores/chartStore';
import type { ChartEngine } from '../../data/types';

const ENGINE_OPTIONS: { value: ChartEngine; label: string }[] = [
  { value: 'recharts', label: 'Recharts' },
  { value: 'visx', label: 'visx / D3' },
];

export function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const { activeEngine } = useChartState();
  const dispatch = useChartDispatch();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
      return !prev;
    });
  }, []);

  const handleEngineSelect = useCallback(
    (engine: ChartEngine) => {
      dispatch({ type: 'SET_ENGINE', payload: engine });
    },
    [dispatch]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Chart settings"
        className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-[var(--color-surface)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Settings size={18} />
      </button>

      {open && (
        <div
          className="fixed z-50 min-w-[180px] rounded-lg border shadow-lg max-h-[calc(100vh-80px)] overflow-auto"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            top: menuPos.top,
            right: Math.max(8, menuPos.right),
          }}
          role="menu"
        >
          <div
            className="border-b px-3 py-2 text-xs font-bold uppercase tracking-wide"
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            Chart Engine
          </div>
          {ENGINE_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="menuitemradio"
              aria-checked={activeEngine === option.value}
              onClick={() => handleEngineSelect(option.value)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {activeEngine === option.value && (
                  <Check size={14} style={{ color: 'var(--color-accent)' }} />
                )}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
