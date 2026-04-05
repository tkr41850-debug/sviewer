# Feature Research

**Domain:** Posture/slouch tracking data visualization dashboard (client-side, JSON-based)
**Researched:** 2026-04-05
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Time-series line graph** | The hero visualization. Every health/posture tracker has this. Users expect to see their data plotted over time immediately. | MEDIUM | Already planned. X=time, Y=delta. Recharts LineChart or D3 line. Must handle null gaps (screen-off) gracefully -- break the line, don't interpolate through absences. |
| **Slouch threshold line** | Without a threshold, the graph is just wiggles. Users need a visual anchor for "good vs bad." | LOW | Already planned. Dashed ReferenceArea or ReferenceLine in Recharts, horizontal rule in D3. Make it draggable for bonus points. |
| **Tooltips on hover** | Universal expectation on any interactive chart. Hovering a data point should show timestamp, delta value, and slouch state. | LOW | Recharts provides `<Tooltip>` out of the box. Custom content renderer to show formatted time + "slouching" / "good posture" label. |
| **Summary KPI cards** | Every dashboard has a row of headline numbers at the top. Users scan these before reading graphs. UPRIGHT shows a 0-100 posture score prominently. | LOW | Already planned (12+ metrics). Present the top 4-6 as large cards above the graph: posture score, slouch rate, screen time, session count. Remaining metrics in a secondary grid. |
| **Time range selection** | Users want to focus on "this morning" or "the afternoon slump." Date/time range picker is table stakes for any time-series dashboard. | MEDIUM | Implement as Brush component below the main chart (minimap pattern). Also provide preset buttons: "Last hour," "Last 4 hours," "All data." |
| **Responsive layout** | Already planned. Users will view this on laptops and monitors. Must not break at common breakpoints. | MEDIUM | Already planned. CSS Grid or flexbox. Chart must resize with container. KPI cards should reflow to fewer columns on narrow screens. |
| **Dark/light theme** | Already planned. System-preference auto-detection is the modern standard. | LOW | Already planned. CSS custom properties + `prefers-color-scheme` media query. Both Recharts and D3 charts need theme-aware colors. |
| **File loading (drag-drop + file picker)** | Already planned. This is the data entry point. Must feel instant and forgiving (clear error messages for bad JSON). | LOW | Already planned. Drag-drop zone with visual feedback. File picker fallback. Validate JSON structure on load with specific error messages ("missing referenceRect at entry 42"). |
| **URL data parameter** | Already planned. Enables sharing data inline without file hosting. | LOW | Already planned. `?data=[...]` query param. URL-decode, parse, validate. Warn if data is very large (URL length limits ~2KB safe, ~8KB max in most browsers). |
| **Screen-off period visualization** | Users need to distinguish "slouching" from "away from screen." Null currentRect and timestamp gaps must be visually distinct from active tracking. | LOW | Already planned. Render as shaded/hatched regions on the graph with a different background color. Label as "Away" in tooltips. Do NOT connect data points across gaps. |
| **Auto-detect timestamp format** | Already planned. Users should not need to know their timestamp format. | LOW | Already planned. Detect Unix ms (13 digits), Unix seconds (10 digits), ISO strings. Parse once, normalize to Date objects. |

### Differentiators (Competitive Advantage)

Features that set SViewer apart. Not required, but create a noticeably better experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dual charting engine toggle** | Already planned. Unique among posture tools -- lets users compare Recharts vs D3 rendering of the same data. Appeals to developers and data-viz enthusiasts who want to see different visual approaches. | HIGH | Already planned. Both engines must render identical data with identical interactions. Abstract the data layer so switching is instant, not a reload. This is the single biggest engineering challenge. |
| **Brush-to-zoom with overview minimap** | Most posture apps have static graphs. A Recharts `<Brush>` component below the main chart acts as a minimap, letting users drag a window to zoom into any time range. Far more intuitive than date pickers for continuous data. | MEDIUM | Recharts has native `<Brush>` support. D3 implementation requires custom brush behavior. The minimap shows the full dataset in compressed form while the main chart shows the selected range. |
| **Calendar heatmap view** | GitHub-contribution-style heatmap showing posture quality per hour or per day. Instantly reveals patterns (e.g., "I always slouch after lunch"). UPRIGHT and other apps don't offer this. | MEDIUM | D3 calendar heatmap is well-established (cal-heatmap library or custom D3). For single-day data, show hourly blocks. For multi-day, show daily blocks. Color = posture score for that period. |
| **Session timeline (segmented bar)** | A horizontal stacked bar showing the day broken into colored segments: green (good posture), red (slouching), gray (away). Provides the entire day's story at a glance. More intuitive than a line graph for "how was my day." | LOW | Simple to implement with CSS or SVG. Each segment's width proportional to its duration. Clickable to jump to that time range in the main graph. |
| **Day-over-day comparison** | Overlay two days on the same graph to see if posture improved. FitnessView and Oura do this for activity/sleep data. Posture apps mostly don't. | MEDIUM | Normalize both days to hours-since-start (0-24h), plot as two lines with different colors. Requires a day-picker UI. Only relevant for multi-day datasets. |
| **Posture score breakdown** | The single "posture score" number is expected, but a breakdown showing what contributed (slouch frequency vs duration vs severity) builds trust and insight. | LOW | Donut or bar chart showing weighted components. E.g., "Your score is 72: frequency 80/100, duration 65/100, severity 70/100." Already have the raw data to derive these. |
| **Annotations on graph** | Let users click on a point in the graph to add a note ("started standing desk," "back pain today"). Grafana-style annotation markers. Turns passive viewing into active journaling. | MEDIUM | Store annotations in component state (no persistence needed since the app is stateless). Render as vertical lines with labels on the graph. Click handler on chart area to add. |
| **Export dashboard as PNG/PDF** | Users want to save or share their posture report. Client-side export using html2canvas (PNG) or combining with jsPDF. | MEDIUM | html2canvas renders the dashboard DOM to canvas, then `toDataURL()` for PNG. For PDF, use jsPDF with the canvas image. No server needed. Include a "Download Report" button. |
| **Export data as CSV** | Let users extract computed metrics and time-series data for their own analysis. | LOW | Map the JSON entries to CSV rows: timestamp, delta_y, is_slouching, is_away. Use Blob + URL.createObjectURL for client-side download. Include a header row. |
| **Keyboard shortcuts** | Power-user feature for navigating the dashboard: arrow keys to pan time range, +/- to zoom, 'r' to reset view, 't' to toggle theme. | LOW | Simple keydown event listeners. Display a help overlay on '?' key. Low effort, high polish signal. |
| **Animated transitions** | Smooth transitions when switching time ranges, toggling chart engines, or updating threshold. Makes the app feel polished rather than janky. | LOW | Recharts supports `isAnimationActive`. D3 has native transitions. CSS transitions for KPI card updates. Keep animations fast (200-300ms). |
| **Shareable URL with state** | Encode current view state (time range, threshold, annotations) into URL parameters so users can share a specific view. | MEDIUM | Serialize view state to URL search params. On load, restore from URL. Combines with the existing `?data=` param. Watch URL length limits. |

### Additional Metrics Beyond the 12 Already Planned

The 12 planned metrics are solid. Here are additional metrics worth considering, ranked by value:

| Metric | What It Measures | Value | Complexity | Recommendation |
|--------|-----------------|-------|------------|----------------|
| **Slouch severity distribution** | Histogram of how far below threshold (mild, moderate, severe slouch) | HIGH | LOW | Add. Simple bucketing of delta values. Reveals whether slouches are minor dips or deep collapses. |
| **Time-to-first-slouch per session** | How long after sitting down before first slouch | MEDIUM | LOW | Add. Good indicator of initial posture discipline. Average across sessions. |
| **Posture volatility** | Standard deviation of delta Y over time. High = constantly shifting, low = stable (good or bad). | MEDIUM | LOW | Add. Distinguishes "mostly good with occasional slouch" from "constantly fidgeting." |
| **Slouch-by-hour heatmap data** | Which hours have the highest slouch rate | MEDIUM | LOW | Add. Powers the calendar heatmap view. Already have worst/best hour, but the full distribution is more useful. |
| **Cumulative slouch time** | Running total of time spent slouching | LOW | LOW | Consider. Simple accumulation. Less insightful than slouch rate but satisfies "how much total" question. |
| **Recovery speed trend** | Whether time-to-correct is improving over sessions | MEDIUM | MEDIUM | Add if multi-session data. Linear regression on time-to-correct values. Shows learning/improvement. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time streaming data** | "I want to watch my posture live!" | Out of scope per PROJECT.md. Requires WebSocket or polling, fundamentally different architecture. The app processes completed JSON files. Adding streaming would double the complexity for a niche use case. | Clearly scope this as a post-session review tool. The slouch tracker itself provides real-time feedback; SViewer is for analysis after the fact. |
| **User accounts and data persistence** | "Save my history across sessions" | Out of scope per PROJECT.md. Requires a backend (auth, database, API). Contradicts the "fully client-side, stateless" constraint. Would 10x the project scope. | Offer CSV/JSON export so users can save locally. If persistence is needed later, localStorage is the maximum viable scope (and even that adds complexity). |
| **AI-powered posture recommendations** | "Tell me how to fix my posture" | Requires domain expertise in physiotherapy. Wrong advice is worse than no advice. Liability concerns. Not a data visualization feature. | Show the data clearly and let users draw conclusions. Link to external posture improvement resources if desired. |
| **Comparison with "population average"** | "How do I compare to other people?" | No backend means no aggregate data. Fabricating averages is dishonest. Individual variation makes population norms misleading for posture. | Compare the user to themselves: "You improved 15% vs last session." Self-comparison is more actionable. |
| **Push notifications / reminders** | "Remind me to check my posture" | This is a data viewer, not a posture trainer. Notifications require service workers and permission prompts, adding complexity for tangential value. | The slouch tracker itself handles real-time reminders. SViewer is the review layer. |
| **Multi-user comparison** | "Compare my posture with my colleague" | Privacy concerns. Different body proportions make raw comparisons meaningless. Reference rects differ per person. | Focus on single-user analysis. The data format is per-individual by design. |
| **Gamification (badges, streaks, leaderboards)** | "Make it fun!" | Adds significant UI complexity. Requires persistence (anti-feature above). Trivializes health data. SViewer's value is clarity, not dopamine. | The planned "slouch-free streaks" and "posture improvement rate" metrics scratch this itch without full gamification. |
| **Mobile-native app** | "I want this on my phone" | Out of scope per PROJECT.md. Responsive web covers phone viewing. Native app requires separate codebase, app store submission, maintenance. | Responsive web design means the app works on mobile browsers. PWA manifest is the maximum viable mobile investment. |

## Feature Dependencies

```
[File Loading (drag-drop/picker/URL)]
    └──required-by──> [ALL other features]

[Timestamp Parsing + Normalization]
    └──required-by──> [Time-Series Graph]
                          └──required-by──> [Tooltips]
                          └──required-by──> [Brush-to-Zoom]
                          └──required-by──> [Annotations]
                          └──required-by──> [Day-over-Day Comparison]
                          └──enhanced-by──> [Screen-Off Visualization]

[Slouch State Computation]
    └──required-by──> [Slouch Threshold Line]
    └──required-by──> [All Dashboard Metrics]
    └──required-by──> [Session Timeline]
    └──required-by──> [Calendar Heatmap]

[Dashboard Metrics Computation]
    └──required-by──> [KPI Cards]
    └──required-by──> [Posture Score Breakdown]
    └──required-by──> [Export CSV]

[Time-Series Graph]
    └──enhanced-by──> [Dual Charting Engine Toggle]

[Brush-to-Zoom] ──enhances──> [Time-Series Graph]

[Calendar Heatmap] ──requires──> [Slouch-by-Hour Data]

[Export PNG/PDF] ──requires──> [Rendered Dashboard DOM]

[Shareable URL] ──enhances──> [URL Data Parameter]
                ──enhances──> [Brush-to-Zoom (range state)]
                ──enhances──> [Slouch Threshold (value state)]
```

### Dependency Notes

- **File Loading is the gate**: Nothing works without data. This must be rock-solid first.
- **Timestamp parsing and slouch computation are the data backbone**: Every visualization and metric depends on correctly parsed, normalized time-series data with slouch states computed. Get this wrong and everything downstream is wrong.
- **Dual charting engine is the highest-risk dependency**: Both Recharts and D3 implementations must share an identical data interface. This abstraction layer needs to exist before either chart is built. Features like Brush-to-Zoom must work in both engines.
- **Calendar heatmap requires aggregated data**: The slouch-by-hour computation feeds the heatmap. This aggregation logic should live in the data layer, not the view.
- **Export PNG depends on rendered DOM**: html2canvas screenshots whatever is on screen, so the dashboard must be fully rendered first.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed for the tool to be useful.

- [ ] **File loading** (drag-drop + file picker + URL param) -- the data entry point
- [ ] **Timestamp parsing** with auto-detection (Unix ms/s/ISO) -- data backbone
- [ ] **Slouch state computation** with configurable threshold -- core logic
- [ ] **Time-series line graph** with threshold line and screen-off gaps -- the hero visualization
- [ ] **Tooltips** on data points -- expected interactivity
- [ ] **Top-line KPI cards** (posture score, slouch rate, screen time, session count) -- immediate insight
- [ ] **Dark/light theme** (system auto) -- visual polish
- [ ] **Responsive layout** -- works on any screen

### Add After Validation (v1.x)

Features to add once core is working and data pipeline is proven.

- [ ] **Brush-to-zoom** with overview minimap -- once graph works, add time navigation
- [ ] **Full dashboard metrics** (all 12+ planned) -- expand from top-4 KPIs
- [ ] **Session timeline** (segmented bar) -- quick alternative view
- [ ] **Screen-off visualization** (shaded regions) -- enhance gap handling
- [ ] **Export CSV** -- users can extract data
- [ ] **Export PNG** -- users can share dashboard screenshots
- [ ] **Dual charting engine toggle** -- the differentiating feature, but only after one engine is solid
- [ ] **Keyboard shortcuts** -- power-user polish

### Future Consideration (v2+)

Features to defer until the core product is validated.

- [ ] **Calendar heatmap view** -- requires multi-session data to be meaningful
- [ ] **Day-over-day comparison** -- requires multi-day data; less value for single-session files
- [ ] **Annotations** -- nice but requires UI design for add/edit/delete flow
- [ ] **Shareable URL with view state** -- serialize current view into URL params
- [ ] **Posture score breakdown** (component donut) -- once users trust the top-line score
- [ ] **Animated transitions** -- polish layer, add last
- [ ] **Additional metrics** (severity distribution, volatility, time-to-first-slouch) -- expand the analytics depth

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| File loading (drag-drop/picker/URL) | HIGH | LOW | P1 |
| Timestamp parsing + auto-detect | HIGH | LOW | P1 |
| Slouch state computation | HIGH | LOW | P1 |
| Time-series line graph | HIGH | MEDIUM | P1 |
| Slouch threshold line (configurable) | HIGH | LOW | P1 |
| Tooltips on hover | HIGH | LOW | P1 |
| KPI cards (top 4-6 metrics) | HIGH | LOW | P1 |
| Dark/light theme | MEDIUM | LOW | P1 |
| Responsive layout | MEDIUM | MEDIUM | P1 |
| Screen-off visualization | MEDIUM | LOW | P1 |
| Brush-to-zoom minimap | HIGH | MEDIUM | P2 |
| Full dashboard metrics (12+) | MEDIUM | MEDIUM | P2 |
| Session timeline bar | MEDIUM | LOW | P2 |
| Export CSV | MEDIUM | LOW | P2 |
| Export PNG/PDF | MEDIUM | MEDIUM | P2 |
| Dual charting engine toggle | MEDIUM | HIGH | P2 |
| Keyboard shortcuts | LOW | LOW | P2 |
| Calendar heatmap | MEDIUM | MEDIUM | P3 |
| Day-over-day comparison | MEDIUM | MEDIUM | P3 |
| Annotations | LOW | MEDIUM | P3 |
| Shareable URL with state | LOW | MEDIUM | P3 |
| Posture score breakdown | LOW | LOW | P3 |
| Animated transitions | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- the app is useless without these
- P2: Should have, add in fast-follow -- makes the app good
- P3: Nice to have, future consideration -- makes the app great

## Competitor Feature Analysis

| Feature | UPRIGHT GO App | Posture Pal | Generic Health Dashboards (Oura, FitnessView) | SViewer Approach |
|---------|---------------|-------------|----------------------------------------------|-----------------|
| Real-time tracking | Yes (wearable) | Yes (webcam) | Yes (sensors) | No -- post-session analysis by design |
| Posture score (0-100) | Yes, live + daily | No | N/A (different metrics) | Yes, computed from slouch data |
| Daily/weekly trends | Daily stats, weekly progress | Monthly comparison | Daily/weekly/monthly/yearly views | Time range is data-driven (whatever the JSON contains) |
| Heatmap view | No | No | Some (Oura sleep heatmap) | Yes -- calendar heatmap differentiator |
| Session timeline | No | No | FitnessView groups by activity | Yes -- segmented bar view |
| Comparison view | No | Monthly reports side-by-side | Oura day comparison | Day-over-day overlay on same axes |
| Export | No | No | CSV in some apps | CSV + PNG + PDF |
| Graph interactions | Static charts | Static charts | Basic (Oura has some zoom) | Full: zoom, brush, pan, tooltips |
| Dual chart engines | No | No | No | Yes -- unique to SViewer |
| Open data format | Proprietary | Proprietary | Proprietary | Open JSON -- works with any slouch tracker |
| Annotations | No | No | Oura has limited tagging | User annotations on graph |
| Theme support | App default | App default | Most support dark mode | System-auto dark/light |

**Key competitive insight:** Existing posture apps are tied to their proprietary hardware/software and offer basic, static visualizations. SViewer's differentiators are: (1) open JSON format compatibility, (2) rich interactive graph with zoom/brush/pan, (3) dual charting engine, and (4) heatmap/comparison views that no posture app currently offers.

## Sources

- [UPRIGHT Posture App](https://www.uprightpose.com/app/) -- posture score, daily stats, training plans
- [9 Best Posture Monitoring Apps 2026](https://posturereminderapp.com/blog/posture-monitoring-apps/) -- competitive landscape
- [FitnessView](https://fitnessview.app/) -- daily/weekly/monthly/yearly trend views
- [Recharts Brush/Zoom patterns](https://github.com/recharts/recharts/issues/710) -- native zoom/brush support
- [html2canvas for React export](https://blog.logrocket.com/export-react-components-as-images-html2canvas/) -- client-side PNG export
- [D3 Calendar Heatmap](https://blog.risingstack.com/tutorial-d3-js-calendar-heatmap/) -- heatmap implementation pattern
- [JMIR Dashboard Design Practices Review](https://www.jmir.org/2026/1/e77361) -- healthcare dashboard best practices
- [Observable Linked Brushing](https://observablehq.com/blog/linked-brushing) -- brush interaction patterns
- [Grafana Annotations](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/annotate-visualizations/) -- annotation UX patterns
- [Tremor Dashboard Components](https://www.tremor.so/) -- KPI card patterns for React

---
*Feature research for: posture/slouch tracking data visualization*
*Researched: 2026-04-05*
