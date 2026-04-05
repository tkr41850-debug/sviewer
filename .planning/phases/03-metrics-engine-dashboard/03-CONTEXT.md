# Phase 3: Metrics Engine & Dashboard - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Compute 18 posture metrics from loaded data and display them in a comprehensive dashboard with KPI cards, metric grid, session timeline, calendar heatmap, and score breakdown chart. Recharts for all chart components (dual engine is Phase 4). No export or keyboard shortcuts (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Placement
- **D-01:** Dashboard renders as a scrollable page below the hero graph — graph stays at top, dashboard sections flow beneath in reading order
- **D-02:** All 5 views appear on a single page in this order: KPI cards → metric grid → session timeline → calendar heatmap → score breakdown
- **D-03:** Dashboard is always visible immediately on data load — no toggle or button required

### Metric Card Design
- **D-04:** 4 headline KPI cards (posture score, slouch rate, screen time, session count) displayed as large prominent cards in a row — big number, label, subtle color accent (Stripe dashboard style)
- **D-05:** 14 secondary metrics displayed in a responsive 3-4 column grid of uniform small cards, each showing metric name, value, and unit
- **D-06:** Metrics use color to indicate quality — green for good (e.g., posture score >70), amber for moderate (40-70), red for poor (<40). Uses existing `--color-accent` and `--color-destructive` CSS custom properties

### Session Timeline
- **D-07:** Horizontal bar spanning full width, time flowing left-to-right. Green segments = good posture, red = slouching, gray = screen off. Segment widths proportional to duration
- **D-08:** Clicking a timeline segment should jump to that time range in the graph above (cross-component interaction)

### Calendar Heatmap
- **D-09:** Hour-of-day heatmap grid: hours on X-axis, days on Y-axis (if multi-day data), cells colored by posture quality. Falls back to single-row for single-day datasets
- **D-10:** Shows patterns like "always slouch after lunch" — hourly granularity is key

### Score Breakdown
- **D-11:** Donut chart showing time distribution: good posture %, slouching %, screen off %. Recharts PieChart with inner radius

### Edge Cases & Data Quality
- **D-12:** When a metric has insufficient data (e.g., daily trend from 1 hour of data), still compute and display the value but show a warning indicator with tooltip explaining data limitations (e.g., "Based on only 1 hour of data — results may not be meaningful")
- **D-13:** Any non-empty dataset should render whatever metrics are computable. Graceful degradation — basic metrics always work, trend/heatmap show warnings for tiny datasets rather than hiding

### Claude's Discretion
- Component file structure and naming within src/components/dashboard/
- Exact metric computation algorithms (e.g., posture score formula, severity bucket thresholds)
- Recharts component composition for heatmap and timeline (custom or built-in)
- Animation and transition details
- Exact green/amber/red threshold values for each metric
- Grid responsive breakpoints

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md metric definitions (METR-01 through METR-18, VIEW-01 through VIEW-05).

### Data Contract
- `src/data/types.ts` — PostureRecord, ChartData (fullRecords for metrics), ParseResult with metadata

### State Management
- `src/stores/dataStore.tsx` — DataProvider context + useReducer; metrics engine consumes ParseResult

### Theming
- `src/index.css` — CSS custom properties (oklch) for dark/light mode; dashboard must use these

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChartData.fullRecords` — Full-resolution PostureRecord[] explicitly designed for metric calculations (not downsampled)
- `ParseResult.metadata` — startTime, endTime, totalEntries, sessionCount, samplingIntervalMs already computed
- `PostureRecord` — has time, deltaY, isScreenOff, isSlouching, sessionIndex — all fields needed for metrics
- CSS custom properties (`--color-accent`, `--color-destructive`, `--color-bg`, `--color-surface`, `--color-border`) — ready for dashboard theming

### Established Patterns
- State: React Context + useReducer (DataProvider)
- Styling: Tailwind utility classes + CSS custom properties for theme
- Components: `src/components/{domain}/` grouping
- Data contract: types.ts defines stable interfaces

### Integration Points
- App.tsx: currently renders UploadPage or SuccessIndicator — Phase 2 adds graph view, Phase 3 adds dashboard below graph
- DataProvider wraps entire app in main.tsx — dashboard components can useDataState() to access ParseResult
- Session timeline click-to-jump will need to communicate with graph's zoom/pan state (cross-component via DataProvider or callback)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-metrics-engine-dashboard*
*Context gathered: 2026-04-05*
