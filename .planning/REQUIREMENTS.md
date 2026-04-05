# Requirements: SViewer

**Defined:** 2026-04-05
**Core Value:** Turn raw slouch-tracking JSON into an instantly understandable visual picture of posture habits

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Loading

- [x] **LOAD-01**: User can load JSON data via drag-and-drop onto the page
- [x] **LOAD-02**: User can load JSON data via file picker dialog
- [x] **LOAD-03**: User can load JSON data via inline URL parameter (`?data=[...]`)
- [x] **LOAD-04**: App auto-detects timestamp format (Unix seconds, Unix milliseconds, ISO strings)
- [x] **LOAD-05**: App validates JSON structure and shows specific error messages for malformed data
- [x] **LOAD-06**: App handles large files without freezing the UI (Web Worker for parsing)

### Data Processing

- [x] **PROC-01**: App computes slouch state by comparing current rect midpoint Y to reference rect midpoint Y
- [x] **PROC-02**: App detects screen-off periods from null currentRect entries
- [x] **PROC-03**: App detects screen-off periods from timestamp gaps
- [x] **PROC-04**: App segments data into sessions based on screen-off gaps
- [x] **PROC-05**: App normalizes all timestamps to Date objects regardless of input format
- [x] **PROC-06**: App applies LTTB downsampling for large datasets before charting

### Developer Tooling

- [x] **TOOL-01**: Vitest is configured and running with test coverage for data loading/processing logic
- [x] **TOOL-02**: Prettier is configured and enforced (`prettier --check .` passes with zero violations)
- [x] **TOOL-03**: ts-eslint is configured and enforced (`eslint .` passes with zero errors)

### Time-Series Graph

- [ ] **GRPH-01**: App renders time-series line graph with X=time, Y=delta Y-position
- [ ] **GRPH-02**: Graph displays configurable slouch threshold as a dashed line
- [ ] **GRPH-03**: Slouch threshold is configurable as percentage of reference height OR absolute pixel value
- [ ] **GRPH-04**: Graph shows tooltips on hover with timestamp, delta value, and posture state
- [ ] **GRPH-05**: Graph visualizes screen-off periods as shaded/hatched regions (not connected lines)
- [ ] **GRPH-06**: User can brush-to-zoom with an overview minimap below the main chart
- [x] **GRPH-07**: User can toggle between Recharts and visx/D3 charting engines
- [x] **GRPH-08**: Both chart engines render identical data with consistent interactions
- [x] **GRPH-09**: Smooth animated transitions when switching time ranges or chart engines
- [ ] **GRPH-10**: User can overlay two days on the same graph for day-over-day comparison
- [ ] **GRPH-11**: User can click on graph points to add text annotations

### Dashboard Metrics

- [ ] **METR-01**: Posture score (0-100 composite score)
- [ ] **METR-02**: Slouch rate (percentage of active time spent slouching)
- [ ] **METR-03**: Average time-to-correct posture after slouch onset
- [ ] **METR-04**: Total screen time (active tracking time excluding screen-off)
- [ ] **METR-05**: Session count (number of distinct tracking sessions)
- [ ] **METR-06**: Longest slouch streak (duration of longest continuous slouch)
- [ ] **METR-07**: Longest slouch-free streak (duration of longest good-posture run)
- [ ] **METR-08**: Break frequency (average time between screen-off periods)
- [ ] **METR-09**: Worst hour (hour of day with highest slouch rate)
- [ ] **METR-10**: Best hour (hour of day with lowest slouch rate)
- [ ] **METR-11**: Daily posture trend (improving/declining over the dataset)
- [ ] **METR-12**: Posture improvement rate (slope of posture score over time)
- [ ] **METR-13**: Slouch severity distribution (mild/moderate/severe buckets)
- [ ] **METR-14**: Time-to-first-slouch per session (average)
- [ ] **METR-15**: Posture volatility (standard deviation of delta Y)
- [ ] **METR-16**: Cumulative slouch time (total minutes/hours spent slouching)
- [ ] **METR-17**: Recovery speed trend (whether time-to-correct is improving over sessions)
- [ ] **METR-18**: Slouch-by-hour distribution (slouch rate per hour of day)

### Dashboard Views

- [ ] **VIEW-01**: Top KPI cards displaying headline metrics (posture score, slouch rate, screen time, session count)
- [ ] **VIEW-02**: Secondary metric grid displaying all remaining metrics
- [ ] **VIEW-03**: Session timeline as horizontal segmented bar (green=good, red=slouch, gray=away)
- [ ] **VIEW-04**: Calendar heatmap showing posture quality per hour or per day
- [ ] **VIEW-05**: Posture score breakdown (donut/bar chart of score components)

### Export & Sharing

- [ ] **EXPT-01**: User can export time-series data and metrics as CSV
- [ ] **EXPT-02**: User can export dashboard screenshot as PNG
- [ ] **EXPT-03**: URL encodes current view state (time range, threshold, chart engine) for sharing

### Theme & Layout

- [ ] **THME-01**: App follows system dark/light preference automatically
- [ ] **THME-02**: Both chart engines use theme-aware colors
- [ ] **THME-03**: Responsive layout that reflows on different screen sizes
- [ ] **THME-04**: Keyboard shortcuts for navigation (arrows to pan, +/- zoom, r reset, t toggle theme, ? help)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Persistence & History

- **HIST-01**: localStorage persistence for recent files and settings
- **HIST-02**: Comparison across multiple loaded files

### Advanced Analytics

- **ADVN-01**: Correlation analysis between slouch patterns and time-of-day
- **ADVN-02**: Predictive slouch alerts based on historical patterns

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                            | Reason                                                            |
| ---------------------------------- | ----------------------------------------------------------------- |
| Real-time streaming data           | App processes completed JSON files, not live feeds                |
| User accounts / authentication     | Fully client-side, stateless by design                            |
| Backend / API / database           | Everything runs in the browser                                    |
| AI posture recommendations         | Not a health advice tool -- pure data visualization               |
| Population comparison              | No backend for aggregate data; self-comparison is more actionable |
| Push notifications                 | Data viewer, not a posture trainer                                |
| Multi-user comparison              | Privacy concerns; reference rects differ per person               |
| Gamification (badges/leaderboards) | Adds persistence complexity; metrics scratch this itch            |
| Native mobile app                  | Responsive web covers mobile viewing                              |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| LOAD-01     | Phase 1 | Complete |
| LOAD-02     | Phase 1 | Complete |
| LOAD-03     | Phase 1 | Complete |
| LOAD-04     | Phase 1 | Complete |
| LOAD-05     | Phase 1 | Complete |
| LOAD-06     | Phase 1 | Complete |
| PROC-01     | Phase 1 | Complete |
| PROC-02     | Phase 1 | Complete |
| PROC-03     | Phase 1 | Complete |
| PROC-04     | Phase 1 | Complete |
| PROC-05     | Phase 1 | Complete |
| PROC-06     | Phase 1 | Complete |
| TOOL-01     | Phase 1 | Complete |
| TOOL-02     | Phase 1 | Complete |
| TOOL-03     | Phase 1 | Complete |
| GRPH-01     | Phase 2 | Pending |
| GRPH-02     | Phase 2 | Pending |
| GRPH-03     | Phase 2 | Pending |
| GRPH-04     | Phase 2 | Pending |
| GRPH-05     | Phase 2 | Pending |
| GRPH-06     | Phase 2 | Pending |
| GRPH-07     | Phase 4 | Complete |
| GRPH-08     | Phase 4 | Complete |
| GRPH-09     | Phase 4 | Complete |
| GRPH-10     | Phase 4 | Pending |
| GRPH-11     | Phase 4 | Pending |
| METR-01     | Phase 3 | Pending |
| METR-02     | Phase 3 | Pending |
| METR-03     | Phase 3 | Pending |
| METR-04     | Phase 3 | Pending |
| METR-05     | Phase 3 | Pending |
| METR-06     | Phase 3 | Pending |
| METR-07     | Phase 3 | Pending |
| METR-08     | Phase 3 | Pending |
| METR-09     | Phase 3 | Pending |
| METR-10     | Phase 3 | Pending |
| METR-11     | Phase 3 | Pending |
| METR-12     | Phase 3 | Pending |
| METR-13     | Phase 3 | Pending |
| METR-14     | Phase 3 | Pending |
| METR-15     | Phase 3 | Pending |
| METR-16     | Phase 3 | Pending |
| METR-17     | Phase 3 | Pending |
| METR-18     | Phase 3 | Pending |
| VIEW-01     | Phase 3 | Pending |
| VIEW-02     | Phase 3 | Pending |
| VIEW-03     | Phase 3 | Pending |
| VIEW-04     | Phase 3 | Pending |
| VIEW-05     | Phase 3 | Pending |
| EXPT-01     | Phase 5 | Pending |
| EXPT-02     | Phase 5 | Pending |
| EXPT-03     | Phase 5 | Pending |
| THME-01     | Phase 2 | Pending |
| THME-02     | Phase 2 | Pending |
| THME-03     | Phase 2 | Pending |
| THME-04     | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0

---

_Requirements defined: 2026-04-05_
_Last updated: 2026-04-05 after roadmap revision (added TOOL-01, TOOL-02, TOOL-03)_
