# Phase 3: Metrics Engine & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 03-Metrics Engine & Dashboard
**Areas discussed:** Dashboard layout, Metric card design, Session timeline & heatmap, Edge cases & data quality

---

## Dashboard Layout

### Spatial Relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable below graph | Graph stays at top as hero, dashboard sections flow below in single scrollable page | ✓ |
| Tabbed: Graph / Dashboard | Two tabs — one for graph, one for dashboard. Can't see both at once | |
| Split: graph left, dashboard right | Side-by-side on wide screens. Gets cramped on smaller screens | |

**User's choice:** Scrollable below graph
**Notes:** None

### View Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Single page, all sections | KPI cards → metric grid → session timeline → heatmap → score breakdown, all visible as you scroll | ✓ |
| Collapsible sections | Each view in its own collapsible accordion | |
| You decide | Claude picks the best approach | |

**User's choice:** Single page, all sections
**Notes:** None

### Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Dashboard renders as soon as data loads, user naturally scrolls to see metrics | ✓ |
| "Show Dashboard" button | Dashboard hidden initially, user clicks button to reveal | |

**User's choice:** Always visible
**Notes:** None

---

## Metric Card Design

### KPI Cards

| Option | Description | Selected |
|--------|-------------|----------|
| Large prominent cards | 4 cards in a row, big number + label + color accent. Stripe dashboard style | ✓ |
| Compact stat bar | Horizontal bar with all 4 values inline, status strip style | |
| You decide | Claude picks the visual treatment | |

**User's choice:** Large prominent cards
**Notes:** None

### Secondary Metrics

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive grid of small cards | 3-4 column grid of uniform cards with metric name, value, unit | ✓ |
| Grouped by category | Related metrics under subheadings (slouch metrics, time metrics, trend metrics) | |
| You decide | Claude picks the layout | |

**User's choice:** Responsive grid of small cards
**Notes:** None

### Color Coding

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded | Green/amber/red based on quality thresholds | ✓ |
| Neutral colors only | All metrics use same text color | |
| You decide | Claude picks appropriate color use | |

**User's choice:** Color-coded
**Notes:** None

---

## Session Timeline & Heatmap

### Session Timeline

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal bar with proportional segments | Full-width bar, time left-to-right. Green=good, red=slouch, gray=off. Click to jump to graph | ✓ |
| Stacked vertical bars per session | Each session gets own vertical bar chart showing proportion | |
| You decide | Claude picks the timeline representation | |

**User's choice:** Horizontal bar with proportional segments
**Notes:** None

### Calendar Heatmap

| Option | Description | Selected |
|--------|-------------|----------|
| Hour-of-day heatmap | Grid with hours on X, days on Y. Cells colored by posture quality. Single-row fallback for single-day | ✓ |
| Daily aggregate only | One cell per day, colored by average. Only useful for multi-day datasets | |
| You decide | Claude picks the heatmap design | |

**User's choice:** Hour-of-day heatmap
**Notes:** None

### Score Breakdown Chart

| Option | Description | Selected |
|--------|-------------|----------|
| Donut chart | Time distribution: good %, slouching %, screen off %. Recharts PieChart with inner radius | ✓ |
| Stacked bar chart | Horizontal bar showing same proportions | |
| You decide | Claude picks the chart type | |

**User's choice:** Donut chart
**Notes:** None

---

## Edge Cases & Data Quality

### Insufficient Data Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Show '—' with tooltip | Em dash in place of value, hover tooltip explains why | |
| Hide the card entirely | Only show metrics with meaningful data | |
| Show 0 or N/A | Display '0' or 'N/A' text | |
| Compute with warning (custom) | Still compute and show the value, but display warning indicator with tooltip about data limitations | ✓ |

**User's choice:** Compute the value anyway, but show a warning indicator with tooltip explaining data is insufficient
**Notes:** User prefers to always show computed values rather than hiding them, but with clear warnings about data quality limitations

### Minimum Dataset

| Option | Description | Selected |
|--------|-------------|----------|
| Any non-empty dataset | Even 10 records should show whatever is computable. Graceful degradation | ✓ |
| At least 5 minutes | Show 'dataset too small' for very tiny files | |
| You decide | Claude sets per-metric thresholds | |

**User's choice:** Any non-empty dataset
**Notes:** None

---

## Claude's Discretion

- Component file structure and naming
- Exact metric computation algorithms
- Recharts component composition for heatmap and timeline
- Animation and transition details
- Exact color threshold values
- Grid responsive breakpoints

## Deferred Ideas

None — discussion stayed within phase scope.
