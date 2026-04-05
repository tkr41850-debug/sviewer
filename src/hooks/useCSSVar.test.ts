import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCSSVar } from './useCSSVar';
import React from 'react';

// Mock the themeStore so useCSSVar can read theme without a ThemeProvider
vi.mock('../stores/themeStore', () => ({
  useTheme: () => ({ theme: 'light' as const }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useCSSVar', () => {
  beforeEach(() => {
    // Mock getComputedStyle to return known values
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => {
            const vars: Record<string, string> = {
              '--color-bg': 'oklch(98% 0 0)',
              '--color-posture-good': 'oklch(62% 0.19 145)',
            };
            return vars[name] ?? '';
          },
        }) as CSSStyleDeclaration
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a non-empty string for a valid CSS variable', () => {
    const { result } = renderHook(() => useCSSVar('--color-bg'));
    expect(result.current).toBe('oklch(98% 0 0)');
  });

  it('returns empty string for a nonexistent variable', () => {
    const { result } = renderHook(() => useCSSVar('--color-nonexistent'));
    expect(result.current).toBe('');
  });
});
