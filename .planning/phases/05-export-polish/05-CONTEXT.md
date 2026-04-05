# Phase 5: Export & Polish - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can export their data (CSV and PNG), share their current view via URL, and navigate the app efficiently with keyboard shortcuts. This is the final usability layer — no new data processing or visualization features.

</domain>

<decisions>
## Implementation Decisions

### CSV Export
- **D-01:** Two separate CSV files — one for time-series records (PostureRecord fields), one for computed metrics
- **D-02:** Single "Export" button with dropdown menu offering: Records CSV, Metrics CSV, Dashboard PNG (and later Both CSVs)
- **D-03:** Timestamps in exported CSV use ISO 8601 format (e.g., 2026-04-05T14:30:00.000Z)
- **D-04:** Filenames are date-stamped using the data's time range (e.g., slouch-records-2026-04-05.csv, slouch-metrics-2026-04-05.csv)

### PNG Screenshot
- **D-05:** PNG captures the full dashboard (chart + metrics cards + session timeline — everything visible)
- **D-06:** PNG export lives in the same Export dropdown as CSV options
- **D-07:** No branding or watermark on exported PNG — clean data visualization only

### URL State Sharing
- **D-08:** View state encoded in URL hash fragment (#range=...&threshold=...&engine=...) — keeps ?data= in query string for data import, no conflict
- **D-09:** URL hash updates via debounced live sync (500ms after last interaction) — always current but doesn't spam browser history during drag operations
- **D-10:** Dedicated "Copy link" button that copies current URL (with hash state) to clipboard with brief "Copied!" confirmation

### Keyboard Shortcuts
- **D-11:** Press ? to toggle a centered modal dialog showing all shortcuts in a grid (GitHub/VS Code pattern). Esc or ? to dismiss.
- **D-12:** Shortcuts are global with input guard — active everywhere except when an input/textarea/select is focused
- **D-13:** Arrow keys pan the chart by a fixed 10% of current view width per press
- **D-14:** Brief key toast feedback in corner showing key + action (e.g., "r — Reset zoom") for ~1 second when a shortcut triggers
- **D-15:** Full shortcut set per requirements: arrows=pan, +/-=zoom, r=reset, t=toggle theme, ?=help

### Claude's Discretion
- Export dropdown component design and positioning
- html2canvas vs dom-to-image for PNG capture (pick best library for full-page screenshot)
- Exact hash parameter naming and encoding scheme
- Key toast animation and positioning
- Help modal layout and shortcut grouping

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Export requirements
- `.planning/REQUIREMENTS.md` — EXPT-01 (CSV), EXPT-02 (PNG), EXPT-03 (URL state)

### Keyboard shortcuts
- `.planning/REQUIREMENTS.md` — THME-04 (keyboard shortcuts: arrows pan, +/- zoom, r reset, t toggle theme, ? help)

### Data contract
- `src/data/types.ts` — PostureRecord and ChartData interfaces that CSV export must serialize

### Existing URL handling
- `src/App.tsx` lines 19-52 — Existing ?data= URL parameter loading (must not conflict with hash-based view state)

### State management
- `src/stores/dataStore.tsx` — DataProvider context/reducer pattern that view state will extend or parallel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataProvider` (src/stores/dataStore.tsx) — Context + useReducer pattern for app state; view state (threshold, range, engine) could follow same pattern or extend it
- `PostureRecord` type (src/data/types.ts) — Defines all fields the records CSV needs to serialize
- `ChartData.fullRecords` — Full-resolution records for CSV export (not the downsampled `points`)
- CSS custom properties in index.css (oklch light/dark) — theme toggle shortcut will flip these
- Tailwind utility classes — consistent styling for Export dropdown, help modal, toasts

### Established Patterns
- State management: React Context + useReducer (DataProvider)
- Styling: Tailwind utility classes + CSS custom properties for theme colors
- Data contract: types.ts defines stable interfaces, downstream code builds against them
- File structure: src/components/{domain}/ grouping

### Integration Points
- App.tsx renders different views based on DataProvider state — Export button and keyboard listeners attach to the loaded/dashboard view
- URL ?data= param in App.tsx useEffect — hash-based view state must load after data loads
- Theme: prefers-color-scheme media query — t shortcut needs to override system preference

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

*Phase: 05-export-polish*
*Context gathered: 2026-04-05*
