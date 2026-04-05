---
phase: "02"
phase_name: "Time-Series Graph & Theme"
status: draft
created: "2026-04-05"
revised: "2026-04-05"
design_system: manual (Tailwind v4 + CSS custom properties)
---

# UI Design Contract: Phase 02 — Time-Series Graph & Theme

## 1. Design System State

**Tool:** None (no shadcn). Project uses Tailwind CSS v4 with CSS-first config and oklch custom properties in `src/index.css`.

**Icon library:** lucide-react (already installed, used by Phase 1 components).

**Charting library:** Recharts (to be installed). Recharts only for this phase; visx/D3 deferred to Phase 4.

**Established patterns carried forward:**
- Inline `style={{ color: 'var(--color-*)' }}` for theme-aware colors
- Tailwind utility classes for layout, spacing, border-radius
- `clsx` for conditional class composition
- `aria-live`, `role="alert"`, `sr-only` for accessibility

## 2. Spacing

**Scale:** 8-point grid. All spacing values are multiples of 4.

| Token   | Value | Usage |
|---------|-------|-------|
| `xs`    | 4px   | Inline icon gaps, axis tick padding |
| `sm`    | 8px   | Tooltip internal padding, compact gaps |
| `md`    | 16px  | Card padding, section gaps, chart margins |
| `lg`    | 24px  | Graph area padding from viewport edge |
| `xl`    | 32px  | Major section separation |
| `2xl`   | 48px  | Not used this phase |

**Chart-specific spacing:**
- Chart left margin (Y-axis labels): 48px
- Chart right margin: 16px
- Chart top margin: 16px
- Chart bottom margin (X-axis labels): 32px
- Gap between main chart and minimap: 16px
- Threshold control overlay inset from top-right: 16px top, 16px right

**Touch targets:** Minimum 44px height for all interactive elements (established in Phase 1). Applies to threshold input, unit toggle, and any chart controls.

## 3. Typography

**Font family:** System font stack via Tailwind default (`font-sans`). No custom fonts.

**Weights used this phase:** 2 weights only — 400 (regular) and 600 (semibold).

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body / controls | 14px | 400 (regular) | 1.5 | Threshold label, unit toggle text, empty-state messages |
| Axis ticks / tooltip | 12px | 400 (regular) | 1.0 | X-axis timestamps, Y-axis delta values, tooltip content lines |

**Note:** 28px (page heading) and 16px (chart title) are defined in Phase 1 and are not part of this phase's graph view typography. Heading weight 600 (semibold) is reserved for future phases that add headings to the graph view; it is declared here so downstream phases can reference it but has no usage in the Phase 2 graph layout.

**Axis label formatting:**
- X-axis: `HH:MM` for ranges under 24h, `MMM dd HH:MM` for multi-day
- Y-axis: Integer pixel values with "px" suffix (e.g., "12px", "-5px")

## 4. Color

### Existing Tokens (from `src/index.css`)

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-bg` | `oklch(98% 0 0)` | `oklch(12% 0 0)` | Page background (60% dominant) |
| `--color-surface` | `oklch(94% 0 0)` | `oklch(18% 0 0)` | Cards, overlays (30% secondary) |
| `--color-accent` | `oklch(55% 0.2 250)` | `oklch(65% 0.18 250)` | Primary interactive elements |
| `--color-destructive` | `oklch(55% 0.22 25)` | `oklch(65% 0.2 25)` | Error states, destructive actions |
| `--color-border` | `oklch(85% 0 0)` | `oklch(28% 0 0)` | Borders, dividers |
| `--color-text-primary` | `oklch(15% 0 0)` | `oklch(92% 0 0)` | Primary text |
| `--color-text-secondary` | `oklch(45% 0 0)` | `oklch(60% 0 0)` | Secondary text, axis labels |

### New Tokens (add to `src/index.css`)

These chart-semantic tokens must be added for Phase 2:

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-posture-good` | `oklch(62% 0.19 145)` | `oklch(70% 0.17 145)` | Green — good posture area fill, line segments |
| `--color-posture-slouch` | `oklch(62% 0.2 25)` | `oklch(68% 0.18 25)` | Red-orange — slouch area fill, line segments |
| `--color-screen-off` | `oklch(70% 0.02 250)` | `oklch(35% 0.02 250)` | Gray-blue — screen-off shaded bands |
| `--color-threshold` | `oklch(55% 0.15 60)` | `oklch(65% 0.13 60)` | Amber/gold — threshold dashed line |
| `--color-chart-line` | `oklch(45% 0.18 250)` | `oklch(72% 0.15 250)` | Primary data line (blue, derived from accent) |
| `--color-chart-grid` | `oklch(88% 0 0)` | `oklch(22% 0 0)` | Chart gridlines — subtle, low contrast |
| `--color-tooltip-bg` | `oklch(15% 0 0)` | `oklch(22% 0.01 250)` | Tooltip background — inverted for contrast |
| `--color-tooltip-text` | `oklch(95% 0 0)` | `oklch(92% 0 0)` | Tooltip text — high contrast on tooltip bg |

### Color Application (60/30/10 Split)

- **60% dominant:** `--color-bg` — page background, chart plot area background
- **30% secondary:** `--color-surface` — threshold control overlay, tooltip background is inverted
- **10% accent:** `--color-accent` reserved for: threshold control focus ring, "Load new file" link, active brush handles. NOT used for chart data — chart data uses semantic posture colors.

### Area Fill Opacity

- Good posture fill: 15% opacity (`oklch(... / 0.15)`)
- Slouch fill: 20% opacity (`oklch(... / 0.20)`)
- Screen-off bands: 12% opacity (`oklch(... / 0.12)`)

## 5. Layout

### Graph View (replaces upload page when `status === 'loaded'`)

```
+---------------------------------------------------------------+
|  [full-width, full-height viewport]                           |
|                                                               |
|  +--[threshold-control]--+                                    |
|  | 15% [___] [%|px]      |    (top-right overlay, absolute)  |
|  +-----------------------+                                    |
|                                                               |
|  +---------------------------------------------------+        |
|  |  Y-axis  |        Main Chart (~70vh)               |        |
|  |  labels  |        - Line graph                     |        |
|  |          |        - Area fills (good/slouch)       |        |
|  |          |        - Threshold dashed line           |        |
|  |          |        - Screen-off shaded bands         |        |
|  |          |        - Hover tooltip                   |        |
|  +---------------------------------------------------+        |
|  |          |        X-axis labels                     |        |
|  +---------------------------------------------------+        |
|                        16px gap                               |
|  +---------------------------------------------------+        |
|  |          |        Minimap/Brush (~15vh)             |        |
|  |          |        - Condensed line + brush handles  |        |
|  +---------------------------------------------------+        |
|                        16px gap                               |
|  [load-new-file link, bottom-left]                            |
+---------------------------------------------------------------+
```

**Dimensions:**
- Graph view: 100vw width, 100vh height (full viewport)
- Main chart area: `calc(100vh - minimap - gaps - padding)` approximately 70% of viewport height
- Minimap area: 80px fixed height
- Horizontal padding: 24px on each side (16px below 640px)
- Threshold control: positioned `absolute`, top-right, 16px inset

**Responsive breakpoints:**
- Above 640px: Full layout as described above
- Below 640px: Stack vertically, minimap converts to a simple horizontal range slider (native `<input type="range">`), threshold control moves to a horizontal bar above the chart, chart area reduces to ~60vh

### Upload Page (existing, unchanged)

Remains as-is from Phase 1. Centered card layout at max-width 480px.

## 6. Component Inventory

### New Components (Phase 2)

| Component | Path | Purpose |
|-----------|------|---------|
| `PostureChart` | `src/components/chart/PostureChart.tsx` | Top-level chart wrapper — receives `ChartData`, manages threshold state, composes all chart sub-components |
| `MainChart` | `src/components/chart/MainChart.tsx` | Recharts `ComposedChart` with line, area fills, threshold reference line, screen-off reference areas |
| `ChartTooltip` | `src/components/chart/ChartTooltip.tsx` | Custom Recharts tooltip — renders timestamp, delta Y, posture state |
| `MinimapBrush` | `src/components/chart/MinimapBrush.tsx` | Condensed chart with Recharts `Brush` or equivalent — controls visible time range of main chart |
| `ThresholdControl` | `src/components/chart/ThresholdControl.tsx` | Numeric input + unit toggle (%/px) overlay — controls threshold line position |
| `ScreenOffBand` | `src/components/chart/ScreenOffBand.tsx` | Custom Recharts `ReferenceArea` config for rendering screen-off regions |
| `GraphView` | `src/components/chart/GraphView.tsx` | Full-viewport layout shell — positions MainChart, MinimapBrush, ThresholdControl, and "load new file" link |
| `ThemeProvider` | `src/stores/themeStore.tsx` | Context provider — reads `prefers-color-scheme`, provides current theme to chart color resolution |

### Modified Components

| Component | Change |
|-----------|--------|
| `App.tsx` | When `status === 'loaded'`, render `<GraphView>` instead of `<SuccessIndicator>` |
| `src/index.css` | Add 8 new chart-semantic CSS custom properties |
| `DataProvider` (dataStore.tsx) | Add `RESET` action to allow returning to upload page |

### Component Hierarchy

```
App
  DataProvider
    ThemeProvider
      status === 'idle'|'loading'|'error' -> UploadPage (existing)
      status === 'loaded' -> GraphView
        ThresholdControl (absolute positioned overlay)
        PostureChart
          MainChart
            ChartTooltip
            ScreenOffBand (per screen-off period)
          MinimapBrush
        "Load new file" link (triggers RESET)
```

## 7. Interaction Contracts

### 7.1 Threshold Adjustment

| Interaction | Behavior |
|-------------|----------|
| Drag threshold line on chart | Update threshold value in real-time; area fills recalculate instantly |
| Type in numeric input | Update threshold value on blur or Enter; clamp to 0-100 for %, 0-500 for px |
| Toggle %/px dropdown | Convert current value between units using reference height from data metadata |
| Default value | 15% of reference height |
| State persistence | Threshold value lives in `PostureChart` local state (not global — resets on new file load) |

### 7.2 Tooltip

| Interaction | Behavior |
|-------------|----------|
| Mouse hover on chart area | Tooltip follows cursor horizontally, anchored vertically to data point |
| Tooltip content | Line 1: timestamp formatted as `HH:MM:SS`; Line 2: delta Y value with "px" suffix; Line 3: posture state badge ("Good" in green, "Slouching" in red, "Screen Off" in gray) |
| Mouse leave chart | Tooltip disappears immediately (no delay) |
| Touch on mobile | Tooltip appears on tap, disappears on tap elsewhere |

### 7.3 Brush-to-Zoom (Minimap)

| Interaction | Behavior |
|-------------|----------|
| Drag brush handles on minimap | Main chart zooms to selected time range with no animation delay |
| Drag brush body | Pan the selected range left/right |
| Click outside brush on minimap | Reset to full time range |
| Initial state | Brush covers full time range (no zoom) |
| Below 640px | Minimap replaced by dual-thumb range slider; same zoom behavior |

### 7.4 Screen-Off Bands

| Interaction | Behavior |
|-------------|----------|
| Visual | Vertical gray bands spanning full chart height at each screen-off period |
| Line behavior | Data line BREAKS at screen-off boundaries — no connecting line across gaps |
| Tooltip on hover | Shows "Screen Off" state with start/end timestamps of the gap |

### 7.5 Navigation

| Interaction | Behavior |
|-------------|----------|
| "Load new file" link | Dispatches `RESET` action, returns to upload page. No confirmation dialog needed — action is low-stakes and easily reversible by re-uploading the same file. |
| Browser back | No special handling this phase (deferred to Phase 5 URL state) |

## 8. States

### Graph View States

| State | Condition | Visual |
|-------|-----------|--------|
| **Rendering** | Data loaded, chart initializing | Brief skeleton: gray rectangle at chart dimensions, pulsing opacity. Duration: <200ms expected, no spinner. |
| **Active** | Chart rendered with data | Full chart with line, fills, threshold, minimap |
| **Empty zoom** | User brush-zooms to a range with no data points | Main chart area shows centered text: "No data points in selected range" in `--color-text-secondary` at 14px. Minimap still visible with full data. |
| **All screen-off** | Entire visible range is screen-off | Chart area entirely gray-banded, no line visible. Centered overlay text: "Screen was off during this period" |

### Threshold Control States

| State | Visual |
|-------|--------|
| **Default** | Input shows "15", dropdown shows "%", threshold line visible on chart |
| **Editing** | Input focused with accent ring (`--color-accent`), 2px solid |
| **Invalid** | Input border turns `--color-destructive`, value clamped on blur |
| **Dragging** | Threshold line follows cursor, input updates in real-time |

## 9. Copywriting

### Labels and Controls

| Element | Copy | Notes |
|---------|------|-------|
| Threshold input label | `Threshold` | Displayed to left of numeric input |
| Unit toggle options | `%` / `px` | Two-option segmented control or dropdown |
| Load new file link | `Load new file` | Bottom-left of graph view, styled as text link with underline. No confirmation needed — low-stakes, easily reversible action. |

### Tooltip Content

| Line | Format | Example |
|------|--------|---------|
| Timestamp | `HH:MM:SS` | `14:32:07` |
| Delta Y | `{value}px` | `+12px` or `-3px` (signed) |
| Posture state | `Good` / `Slouching` / `Screen Off` | Color-coded badge text |

### Empty/Edge States

| State | Copy |
|-------|------|
| Empty zoom range | `No data points in selected range` |
| All screen-off in range | `Screen was off during this period` |
| Threshold at 0% | Area fill covers entire chart in red — acceptable, no warning needed |

### Error States (chart-specific)

| Scenario | Copy |
|----------|------|
| Recharts render error (caught by error boundary) | `Chart could not render. Try loading a different file.` |
| Data has zero non-screen-off points | `No active posture data found. All records show screen off.` |

## 10. Accessibility

- **Chart region:** `role="img"` with `aria-label="Posture data time-series graph showing vertical position delta over time"`
- **Threshold input:** `<input type="number">` with `aria-label="Slouch threshold value"` and visible label
- **Unit toggle:** `aria-label="Threshold unit"` on the select/segmented control
- **Tooltip:** `aria-hidden="true"` (visual enhancement only; data is in the chart)
- **Minimap brush:** Brush handles must be focusable and operable with arrow keys (left/right to move, shift+arrow to resize)
- **Screen-off bands:** No additional ARIA — decorative within the chart `role="img"`
- **"Load new file" link:** Standard `<a>` or `<button>` with visible text, keyboard accessible
- **Color contrast:** All text meets WCAG 2.1 AA (4.5:1 minimum). Posture state is never communicated by color alone — text labels ("Good"/"Slouching"/"Screen Off") always accompany color.
- **Reduced motion:** Respect `prefers-reduced-motion: reduce` — disable chart animations, brush transitions

## 11. Theme Contract

### Implementation

- Theme detection: `prefers-color-scheme` media query in CSS (already established in Phase 1)
- No manual toggle this phase (toggle deferred to Phase 5, THME-04)
- All chart colors reference CSS custom properties — Recharts components receive colors via JavaScript reading `getComputedStyle()` or by passing CSS variable strings

### Color Resolution in Recharts

Recharts accepts hex/rgb color strings, not CSS variables directly. Implementation must resolve CSS variables at render time:

```typescript
// Pattern: read computed CSS variable value
function useCSSVar(name: string): string {
  // Returns resolved color string for Recharts props
}
```

Call `useCSSVar('--color-posture-good')` to get the resolved oklch string. This ensures theme changes (system preference flip) propagate to chart colors.

### Dark Mode Verification Checklist

- [ ] Chart background matches `--color-bg`
- [ ] Gridlines use `--color-chart-grid` (not hardcoded gray)
- [ ] Data line uses `--color-chart-line`
- [ ] Area fills use posture-good/posture-slouch with correct opacity
- [ ] Screen-off bands use `--color-screen-off`
- [ ] Threshold line uses `--color-threshold`
- [ ] Tooltip bg/text use inverted tokens
- [ ] Axis labels use `--color-text-secondary`
- [ ] Brush handles are visible in both themes

## 12. Responsive Contract

| Breakpoint | Layout Change |
|------------|---------------|
| >= 640px | Full layout: main chart + minimap below + threshold overlay top-right |
| < 640px | Threshold control moves above chart as horizontal bar; minimap becomes range slider; horizontal padding reduces to 16px; chart area reduces to ~60vh |

**Chart minimum dimensions:**
- Minimum width: 320px (viewport minimum)
- Minimum main chart height: 200px
- Minimap height: 80px (fixed) above 640px, 48px (range slider) below 640px

## 13. Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transition (upload -> graph) | None — instant swap via conditional render | 0ms | N/A |
| Chart initial render | Recharts default line draw animation | 400ms | ease-out |
| Brush zoom | Main chart re-renders with new domain — no transition animation | 0ms (immediate) | N/A |
| Threshold drag | Real-time update, no animation | 0ms | N/A |
| Tooltip appear/disappear | Opacity fade | 100ms | linear |

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, set Recharts `isAnimationActive={false}` on all animated components. Tooltip opacity change is exempt (under 100ms).

## 14. Registry

**shadcn:** Not applicable — project does not use shadcn.

**Third-party registries:** None.

**Third-party chart plugins:** None — Recharts core only.

## 15. Dependencies to Install

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | `^3.8.1` | Charting library — ComposedChart, Line, Area, Brush, ReferenceLine, ReferenceArea, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer |

No other new dependencies required. `date-fns` (already installed) handles timestamp formatting for axis labels and tooltips.

---

_Contract created: 2026-04-05_
_Revised: 2026-04-05 — Fix typography (2 weights, 2 sizes for graph view), add "Load new file" no-confirmation note_
_Status: draft — awaiting checker validation_
