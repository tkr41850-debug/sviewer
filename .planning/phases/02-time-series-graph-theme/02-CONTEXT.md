# Phase 2: Time-Series Graph & Theme - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see their posture data as an interactive time-series graph with theme support and responsive layout. This phase delivers the primary visualization — the hero graph with threshold line, tooltips, screen-off regions, and brush-to-zoom with minimap. Recharts only (dual engine is Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Graph Layout & Navigation
- Replace upload page with full-width graph view after data loads — single-page transition via DataProvider state
- Main chart ~70% height, minimap/brush bar ~15% below, threshold control ~15% top-right overlay
- Brush on minimap selects range, main chart zooms — click minimap background to reset
- Stack vertically on small screens, minimap collapses to simple range slider below 640px

### Threshold Line & Interaction
- Default slouch threshold: 15% of reference height (matches typical face-tracking drift tolerance)
- Draggable horizontal line on graph + numeric input in top-right overlay for threshold adjustment
- Area fill below threshold in green, above in red/orange (semitransparent) to visualize slouch state
- Default to %, allow toggle to absolute px via dropdown next to numeric input

### Screen-Off & Tooltip Display
- Screen-off periods rendered as vertical shaded bands (gray, semi-transparent) spanning chart height — line breaks at boundaries
- Tooltip follows cursor: timestamp (HH:MM:SS), delta Y value (px), posture state (Good/Slouching/Screen Off)
- Use Recharts only for this phase — dual engine is Phase 4
- Pull chart colors from existing CSS custom properties (--color-accent, --color-destructive) — auto dark/light

### Claude's Discretion
- Component file structure and naming within src/components/chart/
- Exact Recharts component composition (Line vs Area, ComposedChart vs LineChart)
- Animation and transition details
- Minimap implementation specifics (Recharts Brush component or custom)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataProvider` (src/stores/dataStore.tsx) — Context + useReducer for app state
- `ChartData` type with `points` (LTTB-downsampled, up to 1500) and `fullRecords`
- `PostureRecord` with `time`, `deltaY`, `isScreenOff`, `isSlouching`, `sessionIndex`
- `parseAndProcess()` returns `ParseResult` with records + metadata
- CSS custom properties for theming in index.css (oklch light/dark)

### Established Patterns
- State management: React Context + useReducer (DataProvider)
- Styling: Tailwind utility classes + CSS custom properties for theme colors
- Data contract: types.ts defines stable interfaces, downstream code builds against them
- File structure: src/components/{domain}/ grouping

### Integration Points
- App.tsx: currently renders UploadPage when idle/loading/error, SuccessIndicator when loaded — needs to render graph view when `status === 'loaded'`
- DataProvider wraps entire app in main.tsx
- Theme: prefers-color-scheme media query with oklch custom properties

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
