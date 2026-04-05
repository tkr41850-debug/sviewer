# Technology Stack

**Project:** SViewer -- Slouch Tracking Data Viewer
**Researched:** 2026-04-05

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | ^19.2.4 | UI framework | Current stable. React 19 is mature (5+ months since 19.2). Server components irrelevant here (client-only app), but hooks/Suspense patterns are well-established. | HIGH |
| TypeScript | ^5.8.3 | Type safety | Use 5.8.x, not 6.0 (released days ago -- too new, ecosystem compatibility unproven). 5.8 is battle-tested with all libraries in this stack. TS 6.0 can be adopted later once visx/recharts confirm support. | HIGH |
| Vite | ^8.0.3 | Build tool | Project constraint. Vite 8 uses Rolldown (Rust-based bundler) replacing esbuild+Rollup. Faster builds, unified pipeline. Requires Node.js 20.19+ or 22.12+. | HIGH |

### Charting (Dual Engine -- Project Requirement)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | ^3.8.1 | Declarative chart engine | 3.6M+ weekly downloads, React-native API, composable components. Recharts 3.x has breaking changes from 2.x (new internal state model, hooks-based access) but is now stable. Ideal for the "quick, polished dashboard" view. | HIGH |
| @visx/xychart | ^3.12.0 | D3-based chart engine | Airbnb's D3-React bridge. Modular (only import what you use, ~15KB core). XYChart component provides high-level time-series API with `xScale={{ type: 'time' }}`. Gives the "D3 power" option for the switchable view. Stable release; 4.0 is only alpha. | HIGH |
| @visx/scale | ^3.12.0 | D3 scale utilities | Required for time scales in visx charts | HIGH |
| @visx/axis | ^3.12.0 | Axis rendering | Required for visx chart axes | HIGH |
| @visx/tooltip | ^3.12.0 | Tooltip component | Hover-to-inspect data points in visx view | HIGH |
| @visx/responsive | ^3.12.0 | Responsive SVG wrapper | ParentSize component for auto-resizing visx charts | HIGH |
| @visx/threshold | ^3.12.0 | Threshold area rendering | For rendering the slouch threshold line/area in visx view | MEDIUM |

**Why Recharts + visx (not Nivo, not raw D3):**
- Recharts: Highest adoption, declarative React API, fast to build standard line/area charts. Exactly right for "just show me the data" mode.
- visx: True D3 primitives wrapped in React. Lets you do custom annotations (threshold lines, gap indicators), custom interactivity. No opinion on styling -- you control everything. This is the "power user" view.
- NOT Nivo: Nivo is opinionated (theme-heavy, less customizable for threshold annotations). Bundle is larger. Adding a third charting library is unnecessary.
- NOT raw D3: Imperative DOM manipulation fights React. visx solves this cleanly.

**Recharts + React 19 note:** Recharts 3.8.x works with React 19 but may emit a peer dependency warning from `react-is`. If install warns, add an npm override for `react-is` to match React 19. This is a known, documented workaround.

### Styling and Theming

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2.2 | Utility-first CSS | v4 is CSS-first config (no tailwind.config.js needed), cascade layers, `@import "tailwindcss"` one-liner setup. Dark mode via `dark:` variant with class strategy. ~5x faster builds than v3. | HIGH |
| clsx | ^2.1.1 | Conditional classnames | 239 bytes. Drop-in classnames replacement, faster, tree-shakeable. Standard companion to Tailwind in React. | HIGH |

**Theming approach (dark/light auto):**
1. CSS custom properties for color tokens (Tailwind v4 supports `@theme` natively)
2. System preference detection via `prefers-color-scheme` media query
3. Class strategy (`dark` class on `<html>`) so Tailwind `dark:` variants work
4. Tiny inline `<script>` in index.html before React loads to prevent FOUC (flash of wrong theme)
5. React context for theme state + localStorage persistence for manual override
6. CSS transitions (200ms) on theme switch, respecting `prefers-reduced-motion`

**NOT using a component library (MUI, Ant, Mantine, etc.):** This is a data visualization dashboard, not a forms-heavy CRUD app. A component library would add 50-200KB+ for buttons and cards we can build in 20 lines of Tailwind. The charts ARE the UI. Keep the bundle lean.

### Data Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | ^4.1.0 | Date/time manipulation | Functional API, tree-shakeable, works on native Date objects. v4 adds first-class timezone support. Only import `format`, `differenceInMinutes`, `parseISO`, etc. -- bundle only what you use. ~3KB for typical usage. | HIGH |

**Why date-fns over Day.js:** Day.js (2KB) is smaller up-front but not tree-shakeable -- you get the whole library. date-fns v4 tree-shakes to ~3KB for the 5-6 functions this project needs (parseISO, format, differenceInSeconds, differenceInMinutes, isValid, fromUnixTime). Functional style fits TypeScript better (no `.extend()` plugin pattern). The project needs precise time-series work, not just display formatting.

**NOT using simple-statistics or timeseries-analysis:** The 12+ metrics (slouch rate, time-to-correct, streaks, hourly aggregation) are domain-specific arithmetic. A stats library adds weight for generic functions we won't use. Write purpose-built utility functions: they'll be simpler, fully typed, and testable. If later a metric needs regression or percentile, `simple-statistics` can be added then (~15KB).

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Context + useReducer | built-in | App state | This app has minimal global state: loaded data, active chart engine, theme, threshold config. React Context with useReducer handles this without external deps. No prop-drilling problem (flat component tree). | HIGH |

**NOT using Zustand/Jotai/Redux:** Overkill. The app loads a file, computes derived data, and renders. There is no complex async state, no multiple data sources, no cross-cutting concerns. When the state shape is "one blob of loaded data + a few settings," Context is the right tool. Adding a state library for this would be resume-driven development.

### Build Tooling and DX

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | ^8.0.3 | Dev server + bundler | Project constraint. Rolldown-powered, fastest dev experience in 2026. | HIGH |
| Vitest | ^4.1.2 | Unit/integration testing | Native Vite integration, same config, same transforms. Replaces Jest for Vite projects. | HIGH |
| @testing-library/react | ^16.x | Component testing | Standard React testing approach, tests behavior not implementation. | MEDIUM |
| ESLint | ^9.x | Linting | Flat config format (eslint.config.mjs). Use `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks`. | HIGH |
| Prettier | ^3.x | Code formatting | Standard. Integrates with ESLint via `eslint-config-prettier`. | HIGH |

### Supporting Utilities

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| clsx | ^2.1.1 | Class construction | Every component with conditional styles | HIGH |
| @visx/mock-data | ^3.12.0 | Mock data for dev | Development only -- generate sample chart data for testing visx | MEDIUM |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charting (declarative) | Recharts 3.8 | Nivo | Heavier bundle, opinionated theming conflicts with Tailwind, less customizable threshold annotations |
| Charting (D3-based) | visx (xychart) | Raw D3 | Imperative DOM manipulation fights React reconciliation; visx wraps D3 in React idioms |
| Charting (D3-based) | visx (xychart) | Observable Plot | No React wrapper; requires useRef + manual DOM management; great for notebooks, wrong for React apps |
| Styling | Tailwind CSS v4 | CSS Modules | Less expressive for dark mode, no utility classes for rapid prototyping, more boilerplate |
| Styling | Tailwind CSS v4 | styled-components | Runtime CSS-in-JS has performance cost; Tailwind is zero-runtime. styled-components also has React 19 compatibility concerns |
| Component library | None (Tailwind) | MUI / Ant Design / Mantine | Massive bundle for a viz dashboard that needs 5 UI components (card, button, toggle, dropdown, file input) |
| Date utilities | date-fns v4 | Day.js | Not tree-shakeable; plugin extension pattern is awkward in TypeScript |
| Date utilities | date-fns v4 | Temporal API | Not shipped in all browsers yet (2026-2027 expected); can't rely on it for production |
| State management | React Context | Zustand | App state is simple (loaded data + settings); external lib is unnecessary complexity |
| State management | React Context | Redux Toolkit | Far too much ceremony for 3 state values |
| TypeScript | 5.8.x | 6.0.x | TS 6.0 is days old; wait for ecosystem confirmation |

## Version Pinning Strategy

Use caret ranges (`^`) for all dependencies. This project is a standalone client app, not a library -- caret ranges give patch/minor updates automatically. Lock exact versions via `package-lock.json`.

**Exception:** Pin visx packages to the same minor version (`^3.12.0`) to avoid internal incompatibility between visx subpackages.

## Installation

```bash
# Scaffold
npm create vite@latest sviewer -- --template react-ts
cd sviewer

# Core charting
npm install recharts @visx/xychart @visx/scale @visx/axis @visx/tooltip @visx/responsive @visx/threshold

# Styling
npm install tailwindcss @tailwindcss/vite clsx

# Data processing
npm install date-fns

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-config-prettier prettier
```

### Vite Config for Tailwind v4

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### Tailwind v4 CSS Entry

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Color tokens for light/dark theming */
  --color-surface: #ffffff;
  --color-surface-dark: #1a1a2e;
  --color-text: #1a1a2e;
  --color-text-dark: #e0e0e0;
  --color-accent: #6366f1;
  --color-slouch: #ef4444;
  --color-good-posture: #22c55e;
}
```

## Node.js Requirement

Vite 8 requires **Node.js 20.19+ or 22.12+**. Verify with `node -v` before starting.

## Bundle Size Budget

Target: < 200KB gzipped for initial load (excluding chart data).

| Package | Estimated gzipped size |
|---------|----------------------|
| React + ReactDOM | ~45KB |
| Recharts | ~65KB |
| visx (xychart + deps) | ~25KB (tree-shaken) |
| Tailwind (used classes only) | ~8KB |
| date-fns (used functions only) | ~3KB |
| clsx | ~0.2KB |
| App code | ~15-25KB |
| **Total estimate** | **~160-170KB** |

This is well within budget. Recharts is the largest dependency -- lazy-load the inactive chart engine (code-split Recharts vs visx views) to reduce initial paint.

## Sources

- [Recharts GitHub releases](https://github.com/recharts/recharts/releases) -- v3.8.1 confirmed
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- breaking changes from v2
- [visx GitHub / npm](https://github.com/airbnb/visx) -- v3.12.0 stable, v4.0.0-alpha in progress
- [visx xychart README](https://github.com/airbnb/visx/blob/master/packages/visx-xychart/README.md) -- time series API
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) -- Rolldown architecture
- [Vite releases](https://vite.dev/releases) -- v8.0.3 confirmed
- [Tailwind CSS v4.0 blog](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config
- [Tailwind dark mode docs](https://tailwindcss.com/docs/dark-mode) -- class strategy
- [date-fns v4 release / npm](https://www.npmjs.com/package/date-fns) -- v4.1.0, timezone support
- [React 19.2 blog](https://react.dev/blog/2025/10/01/react-19-2) -- v19.2.4 latest patch
- [TypeScript 5.8 docs](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) -- stable release
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) -- v4.1.2 latest
- [clsx npm](https://www.npmjs.com/package/clsx) -- 239B utility
- [Recharts React 19 issue](https://github.com/recharts/recharts/issues/4558) -- peer dependency workaround
