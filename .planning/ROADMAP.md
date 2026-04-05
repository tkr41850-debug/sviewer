# Roadmap: SViewer

## Overview

SViewer transforms raw slouch-tracking JSON into visual posture insights. The roadmap builds from data inward: first a reliable parsing and processing pipeline with quality tooling, then the hero time-series graph with theming, then the full metrics engine and dashboard, then the dual chart engine differentiator, and finally export and keyboard polish. Each phase delivers a coherent, verifiable capability that builds on the previous. Quality gates (tests, formatting, linting) are established in Phase 1 and enforced in every subsequent phase.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Pipeline** - Load, parse, validate, and process slouch-tracking JSON from any input method; establish quality tooling (completed 2026-04-05)
- [x] **Phase 2: Time-Series Graph & Theme** - Render the hero chart with one engine, themed and responsive (completed 2026-04-05)
- [ ] **Phase 3: Metrics Engine & Dashboard** - Compute all posture metrics and display them in a comprehensive dashboard
- [ ] **Phase 4: Dual Chart Engine** - Add visx/D3 engine and advanced graph interactions
- [ ] **Phase 5: Export & Polish** - CSV/PNG export, keyboard shortcuts, and final refinements
- [x] **Phase 6: GitHub Pages + CI** - CI pipeline and GitHub Pages deployment (completed 2026-04-05)

## Phase Details

### Phase 1: Data Pipeline

**Goal**: Users can load slouch-tracking JSON from any supported input method and the app reliably parses, validates, and processes it into a normalized data structure. Developer quality tooling (tests, formatting, linting) is configured and passing.
**Depends on**: Nothing (first phase)
**Requirements**: LOAD-01, LOAD-02, LOAD-03, LOAD-04, LOAD-05, LOAD-06, PROC-01, PROC-02, PROC-03, PROC-04, PROC-05, PROC-06, TOOL-01, TOOL-02, TOOL-03
**Success Criteria** (what must be TRUE):

1. User can drop a JSON file onto the page or use a file picker and see confirmation that data loaded successfully
2. User can pass JSON data via URL parameter (?data=[...]) and the app loads it without manual interaction
3. App correctly handles all three timestamp formats (Unix seconds, Unix ms, ISO strings) without user configuration
4. App displays specific, helpful error messages when JSON is malformed or missing required fields
5. App remains responsive (no UI freeze) when loading files up to 20MB
6. Vitest is configured with at least one passing test suite covering data loading/processing logic
7. Prettier is configured and `prettier --check .` passes with zero formatting violations
8. ts-eslint is configured and `eslint .` passes with zero errors
   **Plans**: 4 plans

Plans:

- [x] 01-01-PLAN.md — Scaffold Vite project, install all dependencies, configure Tailwind v4 CSS tokens
- [x] 01-02-PLAN.md — Define canonical data types contract (types.ts) and write RED test scaffolds
- [x] 01-03-PLAN.md — Implement data pipeline: normalizer, validator, and parser (tests GREEN)
- [x] 01-04-PLAN.md — Build Web Worker, data store, upload UI components, and App shell; end-to-end verify

### Phase 2: Time-Series Graph & Theme

**Goal**: Users see their posture data as an interactive time-series graph with theme support and responsive layout
**Depends on**: Phase 1
**Requirements**: GRPH-01, GRPH-02, GRPH-03, GRPH-04, GRPH-05, GRPH-06, THME-01, THME-02, THME-03
**Success Criteria** (what must be TRUE):

1. User sees a time-series line graph with time on X-axis and vertical position delta on Y-axis immediately after data loads
2. User sees a dashed threshold line on the graph and can adjust the threshold value (percentage or absolute)
3. User can hover over any point to see a tooltip with timestamp, delta value, and posture state
4. Screen-off periods appear as shaded/hatched regions rather than connected lines
5. User can brush-to-zoom on a time range with a minimap overview below the main chart
6. **Quality gate**: All tests pass (`vitest run`), formatting is clean (`prettier --check .`), and linting is clean (`eslint .`) with zero errors
   **Plans**: 3 plans
   **UI hint**: yes

Plans:

- [x] 02-01-PLAN.md — Install Recharts, add chart CSS tokens, create ThemeProvider + useCSSVar hook, wire theme and RESET action
- [x] 02-02-PLAN.md — Build core chart components: MainChart, PostureChart, ChartTooltip, ScreenOffBand
- [x] 02-03-PLAN.md — Build GraphView layout, ThresholdControl, MinimapBrush, and wire App.tsx graph view

### Phase 3: Metrics Engine & Dashboard

**Goal**: Users can see a comprehensive analytics dashboard with 18 computed posture metrics and 5 visualization views
**Depends on**: Phase 2
**Requirements**: METR-01, METR-02, METR-03, METR-04, METR-05, METR-06, METR-07, METR-08, METR-09, METR-10, METR-11, METR-12, METR-13, METR-14, METR-15, METR-16, METR-17, METR-18, VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05
**Success Criteria** (what must be TRUE):

1. User sees top KPI cards (posture score, slouch rate, screen time, session count) prominently displayed
2. User sees a secondary grid with all remaining metrics, each showing a labeled value
3. User sees a session timeline bar showing green (good posture), red (slouching), and gray (away) segments
4. User sees a calendar heatmap showing posture quality distribution across hours or days
5. All metrics display meaningful values (not NaN/Infinity/0) or an explicit "insufficient data" indicator for edge cases
6. **Quality gate**: All tests pass (`vitest run`), formatting is clean (`prettier --check .`), and linting is clean (`eslint .`) with zero errors
   **Plans**: 4 plans
   **UI hint**: yes

Plans:

- [x] 03-01-PLAN.md — Define metric types and implement TDD metrics engine (all 18 metrics with tests)
- [x] 03-02-PLAN.md — Create useMetrics hook, MetricCard, KPICards, MetricGrid, and DashboardShell components
- [x] 03-03-PLAN.md — Build SessionTimeline, CalendarHeatmap, and ScoreBreakdown visualization views
- [x] 03-04-PLAN.md — Wire Dashboard composition into App.tsx and visual verification checkpoint

### Phase 4: Dual Chart Engine

**Goal**: Users can switch between Recharts and visx/D3 chart engines and access advanced graph features
**Depends on**: Phase 2
**Requirements**: GRPH-07, GRPH-08, GRPH-09, GRPH-10, GRPH-11
**Success Criteria** (what must be TRUE):

1. User can toggle between Recharts and visx/D3 engines and both render the same data with consistent interactions
2. Switching engines preserves the current zoom range, threshold, and other view state
3. User can overlay two different days on the same graph for day-over-day posture comparison
4. User can click on graph points to add text annotations that persist while the data is loaded
5. **Quality gate**: All tests pass (`vitest run`), formatting is clean (`prettier --check .`), and linting is clean (`eslint .`) with zero errors
   **Plans**: 3 plans
   **UI hint**: yes

Plans:

- [x] 04-01-PLAN.md — Define ChartAdapterProps interface, install visx, create ChartStore, build SettingsDropdown and EngineLabel
- [x] 04-02-PLAN.md — Refactor Recharts into RechartsAdapter, build VisxAdapter with full feature parity, wire engine switching
- [x] 04-03-PLAN.md — Implement day-over-day comparison and clickable graph annotations in both engines

### Phase 5: Export & Polish

**Goal**: Users can export their data and navigate efficiently with keyboard shortcuts
**Depends on**: Phase 3, Phase 4
**Requirements**: EXPT-01, EXPT-02, EXPT-03, THME-04
**Success Criteria** (what must be TRUE):

1. User can download time-series data and computed metrics as a CSV file
2. User can export the current dashboard view as a PNG screenshot
3. URL reflects current view state (time range, threshold, chart engine) so users can share links
4. User can navigate with keyboard shortcuts (arrows to pan, +/- to zoom, r to reset, t to toggle theme, ? for help)
5. **Quality gate**: All tests pass (`vitest run`), formatting is clean (`prettier --check .`), and linting is clean (`eslint .`) with zero errors
   **Plans**: 2 plans

Plans:

- [ ] 05-01-PLAN.md — Install html-to-image, add theme override CSS, create ViewStore, implement export hooks (CSV/PNG) and URL state hook
- [ ] 05-02-PLAN.md — Build keyboard shortcuts, export dropdown, copy link, help modal, key toast, toolbar; wire into App.tsx

### Phase 6: GitHub Pages Export + CI Workflow

**Goal:** CI pipeline runs lint, test, and format checks on every push/PR; deploys the built SPA to GitHub Pages on push to main via official GitHub Actions
**Depends on:** Phase 1 (quality gates established)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Plans:** 1 plan

**Success Criteria** (what must be TRUE):

1. GitHub Actions workflow runs lint, test, and format check in parallel on every push and PR
2. Build job only proceeds if all three quality gates pass
3. Deploy to GitHub Pages only occurs on push to main or workflow_dispatch
4. Deployed app loads correctly with proper asset paths (dynamic base path via resolvePagesBase())
5. Local development is unaffected (base path remains / when not in CI)

Plans:

- [x] 06-01-PLAN.md — Add resolvePagesBase() to vite.config.ts, format:check script to package.json, create CI + Pages deploy workflow

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase                         | Plans Complete | Status      | Completed  |
| ----------------------------- | -------------- | ----------- | ---------- |
| 1. Data Pipeline              | 4/4            | Complete    | 2026-04-05 |
| 2. Time-Series Graph & Theme  | 3/3            | Complete    | 2026-04-05 |
| 3. Metrics Engine & Dashboard | 0/4            | Planned     | -          |
| 4. Dual Chart Engine          | 0/3            | Planned     | -          |
| 5. Export & Polish            | 0/2            | Planned     | -          |
| 6. GitHub Pages + CI          | 1/1            | Complete    | 2026-04-05 |
