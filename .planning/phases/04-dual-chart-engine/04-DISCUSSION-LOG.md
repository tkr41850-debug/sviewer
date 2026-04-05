# Phase 4: Dual Chart Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 04-dual-chart-engine
**Areas discussed:** Engine toggle UX, Day-over-day comparison, Graph annotations, visx feature parity

---

## Engine Toggle UX

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right toolbar button group | Small segmented control (Recharts \| visx) in chart header, always visible | |
| Settings dropdown | Inside a settings/gear menu, less prominent but keeps chart clean | ✓ |
| Keyboard shortcut only | No visible UI, toggle with a key (e.g., 'e') | |

**User's choice:** Settings dropdown
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Instant swap | No animation, new engine renders immediately | ✓ |
| Crossfade | Short opacity fade (200-300ms) between engines | |
| You decide | Claude picks | |

**User's choice:** Instant swap
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Small label in chart corner | Subtle text like 'Recharts' or 'visx' in bottom-left | ✓ |
| Only in settings | Dropdown shows selection, no label on chart | |
| You decide | Claude picks | |

**User's choice:** Small label in chart corner
**Notes:** None

---

## Day-over-Day Comparison

| Option | Description | Selected |
|--------|-------------|----------|
| Two date pickers | Two date dropdowns populated from available dates | ✓ |
| Click calendar heatmap | Click two days on Phase 3 heatmap to compare | |
| Current day + previous day auto | Always compare last two tracked days | |

**User's choice:** Two date pickers
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded lines | Day 1 in primary accent, Day 2 in secondary color | ✓ |
| Solid vs dashed lines | Same color, different line style | |
| You decide | Claude picks | |

**User's choice:** Color-coded lines
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Time-of-day (00:00-23:59) | Normalize both days to clock time for alignment | ✓ |
| Session-relative time | Start both from 0:00 of first session | |
| You decide | Claude picks | |

**User's choice:** Time-of-day (00:00-23:59)
**Notes:** None

---

## Graph Annotations

| Option | Description | Selected |
|--------|-------------|----------|
| Click point, type inline | Click data point, inline text input appears at location | ✓ |
| Click point, sidebar panel | Side panel opens for note entry | |
| Right-click context menu | Context menu with 'Add annotation' option | |

**User's choice:** Click point, type inline
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Small flag/pin with truncated text | Colored marker with ~20 chars visible, hover for full | ✓ |
| Full text label | Complete text displayed next to point | |
| Dot marker only, text on hover | Just a dot, full text on hover only | |

**User's choice:** Small flag/pin with truncated text
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Click to edit, X to delete | Click annotation to edit, X to remove | ✓ |
| Delete only, no editing | X to remove, create new to change | |
| You decide | Claude picks | |

**User's choice:** Click to edit, X to delete
**Notes:** None

---

## visx Feature Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Full parity | visx replicates ALL Phase 2 features identically | ✓ |
| Core parity, some differences OK | Main features match, minimap/brush can differ | |
| Minimal — visx shows raw power | Same data, different interaction model | |

**User's choice:** Full parity
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Common ChartAdapter interface | Shared props interface, each engine implements it | ✓ |
| Shared wrapper component | One container, conditional rendering inside | |
| You decide | Claude picks | |

**User's choice:** Common ChartAdapter interface
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Both engines | Day overlay and annotations in both Recharts and visx | ✓ |
| visx only for advanced features | Advanced features only in visx | |
| You decide | Claude picks | |

**User's choice:** Both engines
**Notes:** None

---

## Claude's Discretion

- Exact ChartAdapterProps type design and callback signatures
- visx package selection (@visx/xychart vs lower-level primitives)
- Annotation z-index and collision handling
- Settings dropdown component design
- Date picker implementation approach

## Deferred Ideas

None — discussion stayed within phase scope.
