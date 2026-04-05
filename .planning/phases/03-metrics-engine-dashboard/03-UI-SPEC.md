---
phase: "03"
phase_name: "Metrics Engine & Dashboard"
status: draft
created: "2026-04-05"
design_system: manual (Tailwind v4 + CSS custom properties)
---

# UI Design Contract: Phase 03 — Metrics Engine & Dashboard

## 1. Design System State

**Tool:** None (no shadcn). Project uses Tailwind CSS v4 with CSS-first config and oklch custom properties in `src/index.css`.

**Icon library:** lucide-react (installed, used by Phase 1 components: `AlertCircle`, `CheckCircle`, `Upload`).

**Charting library:** Recharts 3.8.1 (installed in Phase 2). Used for the ScoreBreakdown donut chart (`PieChart`, `Pie`, `Cell`). Session timeline and calendar heatmap use pure HTML/CSS (no additional charting library).

**Established patterns carried forward from Phase 2:**
- Inline `style={{ color: 'var(--color-*)' }}` for theme-aware colors
- Tailwind utility classes for layout, spacing, border-radius
- `clsx` for conditional class composition
- `useCSSVar()` hook from `src/hooks/useCSSVar.ts` to resolve CSS custom properties at render time (required for Recharts `Cell fill` which does not accept CSS var() references)
- `useChartColors()` hook for batch color resolution
- `aria-label`, `role`, accessibility attributes on interactive and semantic elements
- Components grouped under `src/components/{domain}/` (input, chart, dashboard)

## 2. Spacing

**Scale:** 8-point grid. All spacing values are multiples of 4.

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| `xs` | 4px | Legend icon-to-label gap |
| `sm` | 8px | Metric card internal gap between label and value, heatmap grid gap |
| `md` | 16px | Small metric card padding, legend row spacing, section heading margin-bottom |
| `lg` | 24px | Large KPI card padding, horizontal page padding (mobile) |
| `xl` | 32px | Gap between dashboard sections (`gap-8` = 32px) |
| `2xl` | 48px | Bottom page padding (`pb-12` = 48px) |

**Dashboard-specific spacing:**
- Dashboard horizontal padding: 16px (mobile), 24px (sm+), 32px (lg+) via `px-4 sm:px-6 lg:px-8`
- Max content width: 1280px (`max-w-7xl`)
- Gap between KPI cards: 16px (`gap-4`)
- Gap between secondary grid cards: 12px (`gap-3`)
- Gap between dashboard sections: 32px (`gap-8`)
- Heatmap cell minimum size: 20px height, 28px width
- Donut chart diameter: 160px (inner radius 50px, outer radius 80px)
- Timeline bar height: 32px (`h-8`)
- Section heading to content gap: 8px (`mb-2`)

**Touch targets:** Minimum 44px height for all interactive elements. Session timeline segments are 32px tall but are clickable buttons with full-width hit areas.

**Exceptions:**
- Heatmap cells are 20px minimum (below 44px touch target) but are not interactive controls -- they display title tooltip on hover only.
- **Heatmap cell gap: 2px.** This is an intentional exception to the 4px-minimum grid rule. Justification: heatmap cells are 20px tall by 28px wide; a 4px gap between cells would consume 17% of the cell height and create excessive whitespace that fragments the visual density of the heatmap, undermining its purpose as a dense at-a-glance pattern display. At 2px the gap is just enough to distinguish individual cells while preserving the cohesive color-field effect that makes hourly patterns readable.

## 3. Typography

**Font family:** System font stack via Tailwind default (`font-sans`). No custom fonts.

**Weights used this phase:** 2 weights -- 400 (regular) and 700 (bold).

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| KPI value (display) | 36px | 700 (bold) | 1.2 | Large metric card primary number |
| Grid value | 24px | 700 (bold) | 1.2 | Small metric card primary number |
| Section heading | 14px | 700 (bold) | 1.5 | Dashboard section headings (uppercase tracking-wide) |
| Body / label | 14px | 400 (regular) | 1.5 | Quality warning text, general body copy |
| Small label | 12px | 400 (regular) | 1.5 | Metric card label, unit suffix, heatmap axis labels, legend text, grid card label |
| Unit suffix | 60% of parent value size | 400 (regular) | 1.0 | Inline unit displayed next to value (e.g., "/100", "%", "min") |

**Section headings pattern:** All dashboard section headings (`h3`) use 14px bold (700 weight), uppercase, tracking-wide (`tracking-wide`), colored with `--color-text-secondary`. Despite sharing the same weight as metric values, section headings are visually distinct through four independent channels: size (14px vs 24-36px), case (uppercase vs normal), letter-spacing (tracking-wide vs default), and color (`--color-text-secondary` vs `--color-text-primary`). This creates a quiet, non-competing label style that does not fight the KPI numbers for attention.

**Weight justification:** Two weights provide a clean hierarchy: 400 for all body text, labels, and supporting copy; 700 for all elements requiring visual prominence (metric values and section headings). Section headings and metric values share 700 weight but are differentiated by size (14px vs 24-36px), uppercase transform, tracking-wide letter-spacing, and secondary text color -- four independent visual channels that make a third weight unnecessary.

## 4. Color

### Existing Tokens (from `src/index.css`, established in Phase 1-2)

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-bg` | `oklch(98% 0 0)` | `oklch(12% 0 0)` | Page background (60% dominant) |
| `--color-surface` | `oklch(94% 0 0)` | `oklch(18% 0 0)` | Card backgrounds (30% secondary) |
| `--color-accent` | `oklch(55% 0.2 250)` | `oklch(65% 0.18 250)` | Primary interactive elements |
| `--color-destructive` | `oklch(55% 0.22 25)` | `oklch(65% 0.2 25)` | Error states, destructive actions, "poor" color grade |
| `--color-border` | `oklch(85% 0 0)` | `oklch(28% 0 0)` | Borders, dividers, screen-off segments |
| `--color-text-primary` | `oklch(15% 0 0)` | `oklch(92% 0 0)` | Primary text, metric values |
| `--color-text-secondary` | `oklch(45% 0 0)` | `oklch(60% 0 0)` | Labels, axis text, legend text |
| `--color-posture-good` | `oklch(62% 0.19 145)` | `oklch(70% 0.17 145)` | Good posture areas (chart) |
| `--color-posture-slouch` | `oklch(62% 0.2 25)` | `oklch(68% 0.18 25)` | Slouch areas (chart) |
| `--color-screen-off` | `oklch(70% 0.02 250)` | `oklch(35% 0.02 250)` | Screen-off bands (chart) |

### New Tokens (add to `src/index.css`)

These dashboard-semantic tokens must be added for Phase 3:

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-grade-good` | `oklch(65% 0.2 145)` | `oklch(72% 0.17 145)` | Green — metric cards with good quality, timeline good segments |
| `--color-grade-moderate` | `oklch(75% 0.15 85)` | `oklch(78% 0.13 85)` | Amber — metric cards with moderate quality, quality warnings |
| `--color-grade-poor` | Use `--color-destructive` | Use `--color-destructive` | Red — metric cards with poor quality, timeline slouch segments |

**Rationale for new tokens:** The existing `--color-posture-good` and `--color-posture-slouch` are tuned for chart area fills at reduced opacity. Dashboard cards need full-opacity border accents at slightly different lightness values for solid-color contexts. The `--color-grade-*` tokens provide this separation.

### Color Application (60/30/10 Split)

- **60% dominant:** `--color-bg` — dashboard page background, visible between cards and sections
- **30% secondary:** `--color-surface` — all metric card backgrounds, heatmap empty cells, timeline container background
- **10% accent:** `--color-accent` reserved for: "Load new file" link (existing), focus rings on interactive elements. NOT used for metric color grades — metric grades use the `--color-grade-*` semantic tokens.

### Metric Card Color Grade Mapping (per D-06)

| Color Grade | Border-Left Color | Meaning |
|-------------|-------------------|---------|
| `good` | `--color-grade-good` | Metric value indicates good posture behavior |
| `moderate` | `--color-grade-moderate` | Metric value indicates moderate posture behavior |
| `poor` | `--color-destructive` | Metric value indicates poor posture behavior |
| `neutral` | `--color-border` | Metric is informational, not quality-graded (e.g., screen time, session count) |

Border-left width: 3px solid.

### Heatmap Color Scale (5-step discrete)

| Slouch Rate Range | Color | Meaning |
|-------------------|-------|---------|
| 0-20% | `oklch(75% 0.2 145)` | Excellent posture |
| 21-40% | `oklch(80% 0.15 120)` | Good posture |
| 41-60% | `oklch(80% 0.15 85)` | Moderate |
| 61-80% | `oklch(70% 0.18 50)` | Poor |
| 81-100% | `oklch(65% 0.22 25)` | Very poor |
| No data | `var(--color-surface)` | Empty cell |

### Session Timeline Segment Colors

| Segment Type | Color | Source |
|--------------|-------|--------|
| Good posture | `--color-grade-good` | Green |
| Slouching | `--color-destructive` | Red |
| Screen off | `--color-border` | Theme-aware gray |

### ScoreBreakdown Donut Colors

| Segment | Color | Resolution |
|---------|-------|------------|
| Good Posture | `--color-grade-good` | Resolved via `useCSSVar()` for Recharts Cell fill |
| Slouching | `--color-destructive` | Resolved via `useCSSVar()` for Recharts Cell fill |
| Screen Off | `oklch(60% 0 0)` light / `oklch(35% 0 0)` dark | Resolved via `useCSSVar('--color-screen-off')` |

### Quality Warning Colors

| Quality Level | Color | Usage |
|---------------|-------|-------|
| `limited` | `--color-grade-moderate` (amber) | Warning triangle icon |
| `insufficient` | `--color-destructive` (red) | Warning triangle icon |

## 5. Layout

### Dashboard Layout (per D-01, D-02, D-03)

Dashboard renders as a scrollable section below the hero graph. Graph stays at top in its existing full-viewport layout; dashboard sections flow beneath in reading order.

```
+---------------------------------------------------------------+
|  [GraphView — existing full-viewport hero chart from Phase 2] |
|  (100vh, scroll-snap or natural scroll)                       |
+---------------------------------------------------------------+
|                                                               |
|  [Dashboard Section — scrollable below graph]                 |
|  px-4 sm:px-6 lg:px-8 | max-w-7xl mx-auto                   |
|                                                               |
|  +---[KPI Cards Row]--------------------------------------+   |
|  | [Posture Score] [Slouch Rate] [Screen Time] [Sessions] |   |
|  | flex flex-wrap gap-4                                    |   |
|  +---------------------------------------------------------+  |
|                        32px gap                               |
|  +---[Secondary Metric Grid]------------------------------+   |
|  | grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3   |   |
|  | [13 small metric cards]                                 |   |
|  +---------------------------------------------------------+  |
|                        32px gap                               |
|  +---[Session Timeline]-----------------------------------+   |
|  | "Session Timeline" heading                              |   |
|  | [=====green=====][==red==][gray][===green====]          |   |
|  | [Legend: Good | Slouching | Screen Off]                 |   |
|  +---------------------------------------------------------+  |
|                        32px gap                               |
|  +---[Calendar Heatmap]-----------------------------------+   |
|  | "Posture by Hour" heading                               |   |
|  | [80px day labels | 24 hour columns]                     |   |
|  | [row per day with colored cells]                        |   |
|  | [Legend: Good ████████ Poor]                            |   |
|  +---------------------------------------------------------+  |
|                        32px gap                               |
|  +---[Score Breakdown]------------------------------------+   |
|  | "Time Distribution" heading                             |   |
|  | [Donut chart 180x180] [Legend beside]                   |   |
|  +---------------------------------------------------------+  |
|                        48px bottom padding                    |
+---------------------------------------------------------------+
```

### KPI Card Dimensions (per D-04)

- Padding: 24px
- Value font-size: 36px
- Label font-size: 12px (uppercase tracking-wide)
- Min-width: 200px
- Flex: `flex-1` within the flex row so cards share width equally
- Border-left: 3px solid color-graded

### Secondary Metric Card Dimensions (per D-05)

- Padding: 16px
- Value font-size: 24px
- Label font-size: 12px (uppercase tracking-wide)
- Uniform height across grid (natural content height, no fixed height)
- Border-left: 3px solid color-graded

### Responsive Breakpoints

| Breakpoint | KPI Cards | Metric Grid | Heatmap | Donut + Legend |
|------------|-----------|-------------|---------|----------------|
| < 640px (mobile) | Stack 2x2 (`flex-wrap`, cards at `min-w-[200px]`) | 2 columns | Horizontal scroll | Stack vertically (donut above legend) |
| 640-1023px (tablet) | 4 in a row | 3 columns | Full width, may scroll | Side by side |
| >= 1024px (desktop) | 4 in a row | 4 columns | Full width | Side by side |

### Component Hierarchy

```
App
  DataProvider
    ThemeProvider
      status === 'loaded' ->
        GraphView (existing, modified to no longer be h-screen)
        DashboardShell
          KPICards
            MetricCard (x4, size="large")
          MetricGrid
            MetricCard (x13, size="small")
          SessionTimeline
          CalendarHeatmap
          ScoreBreakdown
```

**Critical layout change:** `GraphView` must change from `h-screen` (100vh) to a natural height so the dashboard can scroll below it. The graph should still be prominent — use `min-h-[70vh]` or similar to ensure the graph remains the hero above the fold, but allows scrolling down to the dashboard.

## 6. Component Inventory

### New Components (Phase 3)

| Component | Path | Purpose |
|-----------|------|---------|
| `DashboardShell` | `src/components/dashboard/DashboardShell.tsx` | Scrollable container with section ordering, max-w-7xl constraint, padding, and gap |
| `MetricCard` | `src/components/dashboard/MetricCard.tsx` | Reusable card with color-graded border, value, label, unit, and quality warning |
| `KPICards` | `src/components/dashboard/KPICards.tsx` | 4 headline KPI cards in flex row (posture score, slouch rate, screen time, sessions) |
| `MetricGrid` | `src/components/dashboard/MetricGrid.tsx` | 13 secondary metrics in responsive grid |
| `SessionTimeline` | `src/components/dashboard/SessionTimeline.tsx` | Horizontal segmented bar with proportional-width colored segments |
| `CalendarHeatmap` | `src/components/dashboard/CalendarHeatmap.tsx` | CSS grid heatmap — hours on X-axis, days on Y-axis, cells colored by slouch rate |
| `ScoreBreakdown` | `src/components/dashboard/ScoreBreakdown.tsx` | Recharts PieChart donut showing good/slouch/screen-off time distribution |

### New Hooks

| Hook | Path | Purpose |
|------|------|---------|
| `useMetrics` | `src/hooks/useMetrics.ts` | Bridges DataProvider state to metrics engine. Calls `computeAllMetrics` inside `useMemo`, returns `DashboardMetrics \| null` |

### New Engine (non-UI, included for completeness)

| Module | Path | Purpose |
|--------|------|---------|
| Metric types | `src/metrics/types.ts` | `DashboardMetrics`, `MetricValue<T>`, `MetricQuality`, `TrendDirection`, `SeverityBucket`, `HourlySlouchRate` |
| Metrics engine | `src/metrics/engine.ts` | `computeAllMetrics(MetricsInput): DashboardMetrics` — pure function computing all 18 metrics |

### Modified Components

| Component | Change |
|-----------|--------|
| `App.tsx` | When `status === 'loaded'`, render `<GraphView>` followed by `<DashboardShell>` containing all dashboard sections |
| `GraphView` | Change from `h-screen` to natural/min-height layout to allow dashboard scroll below |
| `src/index.css` | Add `--color-grade-good` and `--color-grade-moderate` CSS custom properties |

## 7. Interaction Contracts

### 7.1 Dashboard Scroll

| Interaction | Behavior |
|-------------|----------|
| Page load with data | Graph renders above-the-fold as hero; user scrolls down to see dashboard |
| Scroll behavior | Natural page scroll — no scroll snapping, no parallax |
| Dashboard visibility | Always visible immediately on data load (per D-03) — no toggle, tab, or button to reveal |

### 7.2 Session Timeline Click (per D-08)

| Interaction | Behavior |
|-------------|----------|
| Click a timeline segment | Fires `onSegmentClick(startTime, endTime)` callback |
| Expected effect | Parent wires this to update the graph's `visibleDomain` state, causing the hero chart to zoom to the clicked time range |
| Hover on segment | Native tooltip shows segment type ("Good Posture" / "Slouching" / "Screen Off") and duration |
| Keyboard access | Timeline segments are `<button>` elements, focusable and activatable with Enter/Space |

### 7.3 Heatmap Hover

| Interaction | Behavior |
|-------------|----------|
| Hover on heatmap cell | Native `title` tooltip shows: day, hour, slouch rate %, sample count |
| Click on heatmap cell | No interaction — read-only visualization |
| Overflow | Horizontal scroll on small screens if 24 columns do not fit |

### 7.4 Quality Warning Tooltip (per D-12)

| Interaction | Behavior |
|-------------|----------|
| Hover on warning icon (unicode triangle) | Native `title` tooltip shows quality message explaining data limitation |
| Warning icon appearance | Small amber triangle for `limited`, red triangle for `insufficient` |
| Screen reader | `aria-label` on warning icon conveys the quality message |

### 7.5 Score Breakdown Donut

| Interaction | Behavior |
|-------------|----------|
| Hover on donut segment | Recharts tooltip shows segment name and percentage |
| Click | No interaction — read-only visualization |

## 8. States

### Dashboard View States

| State | Condition | Visual |
|-------|-----------|--------|
| **Loaded** | `useMetrics()` returns `DashboardMetrics` | Full dashboard with all sections rendered |
| **Computing** | Data loaded but `useMemo` has not resolved yet | Effectively instantaneous (< 50ms for 20K records); no loading skeleton needed |
| **Insufficient data — partial** | Some metrics have `quality: 'insufficient'` | Affected metric cards show value with warning indicator and tooltip (per D-12, D-13) |
| **Insufficient data — severe** | Very small dataset (< 5 active records) | Most metrics show warnings; dashboard still renders all sections (per D-13: graceful degradation) |

### MetricCard States

| State | Visual |
|-------|--------|
| **Reliable** | Value + label, color-graded border-left, no warning indicator |
| **Limited** | Value + label, color-graded border-left, amber warning triangle with tooltip |
| **Insufficient** | Value + label, color-graded border-left, red warning triangle with tooltip |

### Session Timeline States

| State | Visual |
|-------|--------|
| **Normal** | Colored segments proportional to duration, legend below |
| **No data** | Empty container with no segments (guard: if records empty, render nothing) |
| **Single state** | One full-width segment of a single color (e.g., all good posture) |

### Calendar Heatmap States

| State | Visual |
|-------|--------|
| **Multi-day** | Multiple rows, one per day |
| **Single-day** | Single row (per D-09) |
| **No active records** | All cells show `--color-surface` (empty) |

## 9. Copywriting

### Section Headings

| Element | Copy |
|---------|------|
| KPI section | No heading — KPI cards are self-evident at the top of the dashboard |
| Metric grid section | No heading — follows naturally from KPI cards |
| Session timeline heading | `Session Timeline` |
| Calendar heatmap heading | `Posture by Hour` |
| Score breakdown heading | `Time Distribution` |

### KPI Card Labels

| Card | Label | Value Format | Unit |
|------|-------|--------------|------|
| Posture Score (METR-01) | `Posture Score` | Integer 0-100 | `/100` |
| Slouch Rate (METR-02) | `Slouch Rate` | Integer 0-100 | `%` |
| Screen Time (METR-04) | `Screen Time` | Duration string (e.g., "2h 15m") | (none, embedded in value) |
| Sessions (METR-05) | `Sessions` | Integer | (none) |

### Secondary Metric Card Labels

| Metric | Label | Value Format | Unit |
|--------|-------|--------------|------|
| METR-03 | `Avg Correction Time` | Duration string | (none, embedded) |
| METR-06 | `Longest Slouch` | Duration string | (none, embedded) |
| METR-07 | `Longest Good Streak` | Duration string | (none, embedded) |
| METR-08 | `Break Frequency` | Duration string | (none, embedded) |
| METR-09 | `Worst Hour` | 12-hour format (e.g., "2 PM") | (none) |
| METR-10 | `Best Hour` | 12-hour format (e.g., "10 AM") | (none) |
| METR-11 | `Daily Trend` | Capitalized direction ("Improving" / "Declining" / "Stable") | (none) |
| METR-12 | `Improvement Rate` | Decimal to 1 place | `pts/hr` |
| METR-13 | `Slouch Severity` | Three numbers slash-separated (e.g., "12/5/2") | `M/Mod/S` |
| METR-14 | `Time to First Slouch` | Duration string | (none, embedded) |
| METR-15 | `Posture Stability` | Decimal to 1 place | `px` |
| METR-16 | `Total Slouch Time` | Duration string | (none, embedded) |
| METR-17 | `Recovery Trend` | Capitalized direction | (none) |

**Note:** METR-18 (slouchByHour) is consumed by the CalendarHeatmap view (VIEW-04), not the metric grid.

### Duration Formatting Convention

| Range | Format | Example |
|-------|--------|---------|
| < 60 seconds | `{N}s` | `45s` |
| 1-59 minutes | `{N}m` | `23m` |
| 60+ minutes | `{H}h {M}m` | `2h 15m` |

### Timeline Segment Tooltips

| Segment Type | Tooltip Copy |
|--------------|-------------|
| Good | `Good Posture -- {duration}` |
| Slouch | `Slouching -- {duration}` |
| Screen off | `Screen Off -- {duration}` |

### Legend Labels

| Component | Labels |
|-----------|--------|
| Session Timeline | `Good`, `Slouching`, `Screen Off` |
| Calendar Heatmap | `Good` (left end) ... `Poor` (right end) with 6 color swatches |
| Score Breakdown | `Good Posture`, `Slouching`, `Screen Off` |

### Quality Warning Messages (per D-12)

| Quality | Message |
|---------|---------|
| `limited` | `Based on limited data -- results may not be fully representative` |
| `insufficient` | `Insufficient data to compute this metric reliably` |

### Empty/Edge State Copy

| State | Copy | Where |
|-------|------|-------|
| All screen-off, no active data | Metric values show `0` or `N/A` with `insufficient` quality warning | All metric cards |
| Single record | Metrics compute what is possible; quality warnings on trend/comparison metrics | Per-metric quality indicators |

### Error States

| Scenario | Copy |
|----------|------|
| Metrics engine throws (caught by error boundary) | `Dashboard could not compute metrics. Try loading a different file.` |

**No destructive actions in this phase.** Dashboard is read-only. No data is modified, deleted, or exported. The "Load new file" action exists in GraphView (Phase 2) and is already covered by its UI-SPEC as a no-confirmation text link.

## 10. Accessibility

- **Dashboard section:** `<section>` element with `aria-label="Posture analytics dashboard"`
- **Metric cards:** Each card is a `<div>` — no interactive role needed (read-only display)
- **Quality warning icon:** Unicode triangle with `aria-label` set to the quality message; `title` attribute for sighted hover tooltip
- **Session timeline segments:** `<button>` elements with `aria-label="{type} segment, {duration}"` for screen readers
- **Heatmap cells:** `title` attribute for native tooltip; no ARIA role needed (decorative grid)
- **Score breakdown donut:** Wrap in `<div>` with `aria-label="Posture score breakdown"`. Recharts SVG is decorative; legend beside the donut provides text-based data.
- **Section headings:** `<h3>` elements for screen reader navigation within the dashboard
- **Color contrast:** All text meets WCAG 2.1 AA (4.5:1 minimum). Quality grades are never communicated by color alone — each metric has a text label and numeric value independent of the color accent.
- **Reduced motion:** Recharts PieChart animation disabled when `prefers-reduced-motion: reduce` via `isAnimationActive={false}`. CSS grid and flex layouts have no animation.

## 11. Theme Contract

### Implementation

All dashboard components use CSS custom properties resolved through:
1. Direct `var(--color-*)` in `style` props — works for backgrounds, borders, text colors
2. `useCSSVar()` hook — required only for `ScoreBreakdown` where Recharts `Cell fill` needs resolved color strings

### Dark Mode Verification Checklist

- [ ] Card backgrounds match `--color-surface`
- [ ] Card borders use `--color-border`
- [ ] Card text uses `--color-text-primary` (values) and `--color-text-secondary` (labels)
- [ ] Grade colors (good/moderate/poor) are visible and distinguishable in both themes
- [ ] Heatmap cells are distinguishable across the 5-step color scale in both themes
- [ ] Timeline segments are distinguishable (good green / slouch red / screen-off gray) in both themes
- [ ] Donut chart segments match theme-resolved colors
- [ ] Section headings use `--color-text-secondary`
- [ ] Dashboard background matches `--color-bg`
- [ ] Warning triangle icons are visible against `--color-surface` card backgrounds

## 12. Responsive Contract

| Breakpoint | Layout Change |
|------------|---------------|
| < 640px | KPI cards: 2 per row (flex-wrap). Grid: 2 columns. Heatmap: horizontal scroll. Donut/legend: stack vertically. Dashboard padding: 16px. |
| 640-1023px | KPI cards: 4 per row. Grid: 3 columns. Heatmap: full width. Donut/legend: side by side. Dashboard padding: 24px. |
| >= 1024px | KPI cards: 4 per row. Grid: 4 columns. Heatmap: full width. Donut/legend: side by side. Dashboard padding: 32px. |

**Minimum viewport width:** 320px (same as Phase 2 chart minimum).

## 13. Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Dashboard appearance | None — rendered immediately with data (per D-03) | 0ms | N/A |
| Donut chart initial render | Recharts default pie animation | 400ms | ease-out |
| Metric card appearance | None — static render | 0ms | N/A |
| Timeline segment hover | Opacity transition to 80% | 150ms | ease |
| Heatmap cell hover | None — native tooltip only | N/A | N/A |

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, set Recharts `isAnimationActive={false}` on PieChart. Timeline opacity transition is exempt (under 200ms).

## 14. Registry

**shadcn:** Not applicable — project does not use shadcn.

**Third-party registries:** None.

**Third-party chart plugins:** None — Recharts core PieChart only for the donut chart.

## 15. Dependencies

No new dependencies to install for Phase 3. All required packages are already available:

| Package | Status | Usage in Phase 3 |
|---------|--------|-------------------|
| `recharts` | Installed (Phase 2) | PieChart, Pie, Cell, ResponsiveContainer, Tooltip for ScoreBreakdown donut |
| `date-fns` | Installed (Phase 1) | `format()` for heatmap day labels |
| `clsx` | Installed (Phase 1) | Conditional class composition |
| `lucide-react` | Installed (Phase 1) | Not actively used in Phase 3 dashboard components (warning uses unicode, not icon component) |

---

_Contract created: 2026-04-05_
_Revised: 2026-04-05 -- fixed typography weight contradiction (3 weights declared), heatmap cell gap exception documented_
_Revised: 2026-04-05 -- collapsed from 3 weights to 2 (removed 600/semibold; section headings now use 700/bold, differentiated by size, case, tracking, and color)_
_Status: draft -- awaiting checker validation_
