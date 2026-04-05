# Phase 4: Dual Chart Engine - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can switch between Recharts and visx/D3 chart engines and access advanced graph features: day-over-day posture comparison and clickable text annotations. Both engines render the same data with consistent interactions. This phase adds visx as the second engine and the advanced graph interactions — it does not change the core graph or dashboard from Phases 2-3.

</domain>

<decisions>
## Implementation Decisions

### Engine Toggle UX
- **D-01:** Engine toggle lives in a settings dropdown (not a visible toolbar button group)
- **D-02:** Switching engines is an instant swap — no animation or crossfade
- **D-03:** A small label in the chart corner indicates which engine is active (e.g., "Recharts" or "visx")

### Day-over-Day Comparison
- **D-04:** Two date picker dropdowns populated from available dates in the dataset for selecting which days to overlay
- **D-05:** Overlaid days distinguished by color-coded lines (Day 1 = primary accent, Day 2 = secondary color)
- **D-06:** X-axis normalized to time-of-day (00:00–23:59) when comparing two days, so both align by clock time

### Graph Annotations
- **D-07:** Click a data point to create an annotation — a small inline text input appears at the point location, type and press Enter
- **D-08:** Annotations display as small flag/pin markers with truncated text (~20 chars), hover to see full text
- **D-09:** Click an existing annotation to edit its text, small X button to delete it
- **D-10:** Annotations are in-memory only — persist while data is loaded, cleared on new file load

### visx Feature Parity & Architecture
- **D-11:** visx engine must replicate ALL Phase 2 Recharts features: threshold line (draggable), brush-to-zoom, minimap, tooltips, screen-off shaded bands
- **D-12:** Switching engines preserves current zoom range, threshold value, and all view state
- **D-13:** Common ChartAdapter interface (ChartAdapterProps) — each engine is a component that implements it; parent passes data + callbacks, engine handles rendering
- **D-14:** Day-over-day comparison and annotations work in BOTH engines (full parity extends to new features)

### Claude's Discretion
- Exact ChartAdapterProps type design and callback signatures
- visx package selection (@visx/xychart vs lower-level @visx/shape + @visx/scale)
- Annotation z-index and collision handling when annotations overlap
- Settings dropdown component design and positioning
- Date picker component implementation (native HTML date input vs custom)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md:

- `REQUIREMENTS.md` — GRPH-07 (toggle engines), GRPH-08 (identical data), GRPH-09 (smooth transitions), GRPH-10 (day overlay), GRPH-11 (annotations)
- `.planning/phases/02-time-series-graph-theme/02-CONTEXT.md` — Phase 2 Recharts decisions that visx must match (layout, threshold, tooltips, screen-off bands, minimap)
- `src/data/types.ts` — Canonical data contract (PostureRecord, ChartData) that both engines consume

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataProvider` (src/stores/dataStore.tsx) — Context + useReducer for app state; will need new state for active engine, annotations, comparison mode
- `ChartData` type with `points` (LTTB-downsampled, max 1500) and `fullRecords` — both engines consume `points`
- `PostureRecord` with `time`, `deltaY`, `isScreenOff`, `isSlouching`, `sessionIndex` — stable contract
- CSS custom properties (oklch) in index.css for theme-aware chart colors

### Established Patterns
- State management: React Context + useReducer (DataProvider)
- Styling: Tailwind utility classes + CSS custom properties for theme colors
- Data contract: types.ts defines stable interfaces, no charting library imports in data layer
- File structure: src/components/{domain}/ grouping

### Integration Points
- App.tsx renders graph view when `status === 'loaded'` — engine toggle and new features integrate here
- Phase 2 Recharts chart components will need to be refactored to implement ChartAdapterProps interface
- DataProvider needs additional state: `activeEngine: 'recharts' | 'visx'`, `annotations: Annotation[]`, `comparisonDay: Date | null`
- visx packages (@visx/xychart, @visx/scale, @visx/axis, @visx/tooltip, @visx/responsive, @visx/threshold) need to be installed

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

*Phase: 04-dual-chart-engine*
*Context gathered: 2026-04-05*
