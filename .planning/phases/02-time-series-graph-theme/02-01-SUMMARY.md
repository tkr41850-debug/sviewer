---
phase: 02-time-series-graph-theme
plan: 01
subsystem: theme-foundation
tags: [theme, css-tokens, recharts, context, hooks]
dependency_graph:
  requires: [01-data-pipeline]
  provides: [ThemeProvider, useTheme, useCSSVar, useChartColors, ThresholdConfig, RESET-action, recharts]
  affects: [02-02, 02-03]
tech_stack:
  added: [recharts@3.8.1]
  patterns: [React Context for theme, useMemo for CSS variable resolution, matchMedia for system theme detection]
key_files:
  created:
    - src/stores/themeStore.tsx
    - src/hooks/useCSSVar.ts
    - src/stores/themeStore.test.tsx
    - src/hooks/useCSSVar.test.ts
  modified:
    - package.json
    - package-lock.json
    - src/index.css
    - src/stores/dataStore.tsx
    - src/data/types.ts
    - src/main.tsx
decisions:
  - "useCSSVar uses useMemo (not useEffect+useState) to avoid ESLint react-hooks/set-state-in-effect violation; synchronous getComputedStyle is safe in render"
  - "void theme reference in useMemo to explicitly invalidate cache on theme change while satisfying exhaustive-deps lint rule"
  - "DataAction type exported (was private) so downstream components can reference it"
metrics:
  duration_seconds: 276
  completed: "2026-04-05T09:43:55Z"
  tasks: 2
  tests_added: 4
  files_changed: 10
---

# Phase 02 Plan 01: Theme Foundation Layer Summary

Recharts installed, 8 chart-semantic CSS tokens in light/dark, ThemeProvider with system color-scheme detection, useCSSVar/useChartColors hooks for Recharts color resolution, RESET action in DataStore, ThresholdConfig type defined.

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Recharts, add CSS tokens, create ThemeProvider and useCSSVar hook | a2ae1f6 (RED), 927de5f (GREEN) | package.json, src/index.css, src/stores/themeStore.tsx, src/hooks/useCSSVar.ts, tests |
| 2 | Add RESET action to DataStore, ThresholdConfig type, wire ThemeProvider | 3d77180 | src/stores/dataStore.tsx, src/data/types.ts, src/main.tsx |

## What Was Built

### CSS Chart Tokens (src/index.css)
8 new chart-semantic CSS custom properties added to both `:root` (light) and `@media (prefers-color-scheme: dark)` blocks:
- `--color-posture-good`, `--color-posture-slouch`, `--color-screen-off`, `--color-threshold`
- `--color-chart-line`, `--color-chart-grid`, `--color-tooltip-bg`, `--color-tooltip-text`

### ThemeProvider (src/stores/themeStore.tsx)
- React Context provider detecting system color scheme via `window.matchMedia('(prefers-color-scheme: dark)')`
- Reactive updates via `change` event listener on MediaQueryList
- `useTheme()` hook returning `{ theme: 'light' | 'dark' }`
- Follows same Context pattern as existing DataStore

### useCSSVar Hook (src/hooks/useCSSVar.ts)
- `useCSSVar(name)` reads CSS custom property via `getComputedStyle` using `useMemo`
- Re-evaluates when theme changes (cache-busted by theme dependency)
- `useChartColors()` batch helper returning all 10 chart-relevant color strings

### DataStore RESET Action (src/stores/dataStore.tsx)
- Added `{ type: 'RESET' }` to exported `DataAction` union
- Reducer returns `{ status: 'idle' }` on RESET -- enables returning to upload page

### ThresholdConfig Type (src/data/types.ts)
- `ThresholdConfig` interface with `value: number` and `unit: '%' | 'px'`

### ThemeProvider Wiring (src/main.tsx)
- ThemeProvider wraps App inside DataProvider in component tree

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useCSSVar setState-in-effect lint violation**
- **Found during:** Task 1
- **Issue:** Original implementation using `useState` + `useEffect` triggered ESLint `react-hooks/set-state-in-effect` error
- **Fix:** Refactored to use `useMemo` with synchronous `getComputedStyle` and `void theme` reference for cache invalidation
- **Files modified:** src/hooks/useCSSVar.ts
- **Commit:** 927de5f

## Verification Results

- TypeScript compiles with zero errors (`tsc --noEmit`)
- All 25 tests pass (5 test files)
- `color-posture-good` appears 2 times in index.css (light + dark)
- `color-tooltip-bg` appears 2 times in index.css (light + dark)
- ThemeProvider wired in main.tsx
- RESET action in dataStore.tsx reducer
- ThresholdConfig exported from types.ts
- ESLint: 0 errors, 0 warnings
- Prettier: all files formatted

## Self-Check: PASSED

All 5 created/modified key files verified on disk. All 3 commits (a2ae1f6, 927de5f, 3d77180) verified in git log.
