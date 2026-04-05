# SViewer — Slouch Tracking Data Viewer

## What This Is

A React + TypeScript web app that visualizes posture/slouch tracking data from a JSON file. Users upload (drag-and-drop or file picker) or pass data inline via URL parameter. The app renders a time-series graph of vertical position delta with a configurable slouch threshold, followed by a comprehensive analytics dashboard with 12+ derived posture and screen-time metrics.

## Core Value

Turn raw slouch-tracking JSON into an instantly understandable visual picture of posture habits — the graph is the hero, the dashboard is the depth.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Load JSON data via drag-and-drop, file picker, or inline URL parameter (`?data=[...]`)
- [ ] Parse flexible timestamps (Unix ms, Unix seconds, ISO strings — auto-detect)
- [ ] Parse entries: `{timestamp, referenceRect: {x,y,w,h}, currentRect: {x,y,w,h}|null}`
- [ ] Compute slouch state: current rect midpoint Y below reference rect midpoint Y
- [ ] Time-series graph: X = time, Y = delta Y-position, dashed line at slouch threshold
- [ ] Configurable slouch threshold (percentage of reference height OR absolute pixel value)
- [ ] Switchable charting engine: Recharts and D3-based — user can toggle between them
- [ ] Detect screen-off periods: currentRect is null OR gaps in timestamps
- [ ] Dashboard with 12+ metrics: slouch rate, time-to-correct, screen time, session count, longest slouch streak, average posture score, break frequency, slouch-free streaks, worst hour, best hour, daily trend, posture improvement rate
- [ ] Dark/light theme following system preference (auto)
- [ ] Responsive layout

### Out of Scope

- Backend / server-side processing — this is a fully client-side app
- Real-time streaming data — works on completed JSON files only
- User accounts or data persistence — stateless, load-and-view
- Mobile-native app — web only, but responsive

## Context

The input data comes from an external slouch tracker that records face/head position rectangles at regular intervals. A "reference rect" is the calibrated upright posture, and "current rect" is where the person's head is now. When current rect midpoint is below reference midpoint, the person is slouching. When current rect is null or data gaps exist, the person has left the screen.

Two charting libraries will be integrated (Recharts and a D3-based solution) so the user can switch between them to find the best visual representation. Both should render the same data.

## Constraints

- **Stack**: React + TypeScript + Vite
- **Client-side only**: No server, no API calls — everything runs in the browser
- **Charting**: Recharts + D3-based (both available, user-switchable)
- **Theming**: System-preference auto dark/light

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dual charting libraries (Recharts + D3) | User wants to compare visual quality | — Pending |
| Inline URL data param (not file URL) | Simplicity — no CORS issues | — Pending |
| Auto-detect timestamp format | User unsure of format; handle all three | — Pending |
| Screen-off = null currentRect OR timestamp gaps | Tracker may produce either pattern | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*
