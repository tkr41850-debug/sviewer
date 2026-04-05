# Pitfalls Research

**Domain:** Client-side time-series data visualization dashboard (posture/slouch tracking)
**Researched:** 2026-04-05
**Confidence:** HIGH (corroborated across multiple sources, documented issues, and official library discussions)

## Critical Pitfalls

### Pitfall 1: SVG DOM Explosion from Recharts with Large Datasets

**What goes wrong:**
Recharts renders every data point as an individual SVG DOM node. With hours or days of posture tracking data at high frequency (e.g., one sample per second = 86,400 points per day), the browser creates tens of thousands of SVG elements. Past ~3,000-5,000 SVG nodes, the browser begins lagging severely. At 10,000+, interaction becomes unusable -- scrolling stutters, tooltips freeze, and the tab may crash.

**Why it happens:**
Recharts is an SVG-based charting library by design. SVG elements live in the DOM and each one participates in style recalculation, layout, and paint. Developers prototype with small datasets (100-500 points) where SVG performs beautifully, then deploy against real data and discover the performance cliff is sudden, not gradual.

**How to avoid:**
- Implement data downsampling before rendering. Use the LTTB (Largest-Triangle-Three-Buckets) algorithm via the `downsample` npm package. LTTB reduces 86,400 points to ~750-1,500 while preserving visual shape -- a 98%+ reduction.
- Set a maximum rendered point count (e.g., 1,500 points) and downsample to that target regardless of input size.
- Disable Recharts animations (`isAnimationActive={false}`) for datasets over ~500 points. Animation multiplies the rendering cost.
- For the D3-based chart engine, render to Canvas instead of SVG when point counts exceed the threshold.

**Warning signs:**
- Chart takes >500ms to render during development
- Browser DevTools shows >3,000 SVG child elements in the chart container
- Tooltip hover has visible delay
- Chart re-renders cause the entire page to stutter

**Phase to address:**
Data processing layer (before any chart rendering). The downsampling pipeline must exist before charting is implemented, not bolted on after.

---

### Pitfall 2: React and D3 DOM Ownership Conflict

**What goes wrong:**
Both React and D3 want to own the DOM. React uses a virtual DOM and reconciliation; D3 uses `d3.select()` to directly mutate DOM nodes. When both operate on the same elements, React's reconciliation overwrites D3's mutations on re-render, causing visual glitches -- elements disappear, positions reset, transitions break mid-animation. Conversely, D3 mutations that React does not know about cause stale virtual DOM references.

**Why it happens:**
Developers use `useEffect` to run D3 code after React renders, which works on initial mount. But on re-renders (theme change, window resize, data update), React reconciles the DOM and clobbers D3's changes, or D3 creates elements React does not track. The two systems fight over the same DOM subtree.

**How to avoid:**
Use the "React for structure, D3 for math" pattern:
- React owns ALL DOM rendering. D3 is used only for its computational utilities: `d3.scaleLinear()`, `d3.line()`, `d3.axisBottom()` output generation, etc.
- D3 computes scales, paths, and positions. React renders the resulting SVG/Canvas via JSX.
- If you must use D3 for direct DOM manipulation (complex animations), give D3 a dedicated `<div ref={d3Ref}>` container and never let React touch its children. Use `useRef` + `useEffect` with proper cleanup.
- Never mix: React rendering some SVG children and D3 rendering others within the same parent element.

**Warning signs:**
- Elements flicker or reset position on state changes
- `useEffect` D3 code runs but visual output disappears after a React re-render
- Console warnings about unexpected DOM mutations
- Chart renders correctly on mount but breaks on theme toggle or data reload

**Phase to address:**
Architecture/foundation phase. The DOM ownership boundary must be established as an architectural decision before either charting engine is built. Document which approach each engine uses and enforce it.

---

### Pitfall 3: Unix Timestamp Seconds vs. Milliseconds Misdetection

**What goes wrong:**
The slouch tracker may produce timestamps in Unix seconds (10 digits, e.g., `1711000000`), Unix milliseconds (13 digits, e.g., `1711000000000`), or ISO strings. If seconds are passed directly to `new Date()`, JavaScript interprets them as milliseconds, producing dates in January 1970 -- off by 54 years. The chart X-axis shows nonsensical dates, or worse, the data silently appears to work but all time calculations (session duration, slouch streaks, screen-off gaps) are wrong by a factor of 1000.

**Why it happens:**
JavaScript's `Date` constructor expects milliseconds. Python, Go, and most Unix tools produce seconds. Auto-detection heuristics based on digit count (10 = seconds, 13 = milliseconds) work for current dates but break for edge cases: very old timestamps, timestamps with microsecond precision (16 digits), or string-encoded numbers.

**How to avoid:**
- Implement a robust timestamp normalizer as the first step of the data pipeline, before any other processing.
- Detection heuristic: if numeric and < 1e12, treat as seconds (multiply by 1000). If numeric and >= 1e12 and < 1e16, treat as milliseconds. If string, attempt ISO 8601 parse first, then fall back to numeric detection.
- Add a sanity check: after normalization, verify the resulting date falls within a reasonable range (e.g., 2020-2030). If not, the detection was wrong -- throw a clear error.
- Normalize ALL timestamps to milliseconds at ingestion time. Every downstream function should assume milliseconds.

**Warning signs:**
- Chart X-axis shows dates in 1970 or year 55000+
- Session durations calculate to fractions of a second or millions of hours
- Time gap detection (screen-off) fires on every single data point

**Phase to address:**
Data parsing/ingestion phase. This must be the very first data transformation, tested with all three timestamp formats before any metric calculation or chart rendering is built.

---

### Pitfall 4: Screen-Off Detection Producing False Positives and Negatives

**What goes wrong:**
The app must detect when the user left the screen via two signals: `currentRect` is null, or there are gaps in timestamps. Naive gap detection (e.g., "any gap > 5 seconds") produces false positives from normal tracking jitter (the tracker occasionally skips a beat) and false negatives when the gap threshold is set too high. Metric calculations for "screen time," "break frequency," and "session count" become unreliable, making the entire dashboard misleading.

**Why it happens:**
The tracker's sampling rate is not perfectly uniform -- it may vary by +/- 100ms or occasionally miss a sample. A fixed threshold does not account for this variance. Additionally, `currentRect: null` and timestamp gaps may overlap (both present for the same absence), causing double-counting of breaks if not deduplicated.

**How to avoid:**
- Calculate the median sampling interval from the actual data (not assumed). Use a gap threshold of `median_interval * N` where N is a configurable multiplier (e.g., 3x-5x).
- Merge adjacent null-rect entries and timestamp gaps into unified "absence periods" before calculating any metrics. Two gap types should collapse into one absence event.
- Provide the gap threshold as a user-configurable setting with a sensible default, since different trackers may have different sampling rates.
- Edge case: if the file starts or ends with nulls, do not count those as screen-off periods of unknown length -- bound them to the first/last valid timestamp.

**Warning signs:**
- Unreasonably high "break count" (e.g., 200 breaks in a 2-hour session)
- Total screen time + total break time does not approximately equal total session time
- Session count is far higher than expected (many tiny sessions instead of a few long ones)

**Phase to address:**
Data processing/metrics phase. Must be implemented and validated before any dashboard metrics that depend on session boundaries.

---

### Pitfall 5: Unbounded JSON Parsing Freezing the Main Thread

**What goes wrong:**
`JSON.parse()` of a large file (10MB+ is realistic for a full day of high-frequency tracking) is synchronous and blocks the main thread. The UI freezes completely during parsing -- no loading spinner, no progress indication, no ability to cancel. Users think the app is broken and close the tab. For very large files (50MB+), the browser may show a "page unresponsive" dialog.

**Why it happens:**
`JSON.parse()` is a single synchronous operation in JavaScript. There is no built-in streaming JSON parser in browsers. Developers test with small files during development and never encounter the freeze. The `FileReader.readAsText()` call itself is async, but the subsequent `JSON.parse()` on the full string is synchronous.

**How to avoid:**
- Move JSON parsing to a Web Worker. The worker parses the data off the main thread, then posts the result back. The main thread remains responsive and can show a loading indicator.
- Show a loading state immediately when a file is selected/dropped, before parsing begins.
- For very large files (>50MB), consider chunked parsing via a streaming JSON parser like `oboe.js` or manual chunking, though for this project's data structure (array of objects), Web Worker parsing is likely sufficient.
- Set a maximum file size limit (e.g., 100MB) and show a clear error if exceeded.

**Warning signs:**
- No loading indicator visible when files are dropped
- UI freezes for >1 second during file load
- Browser "page unresponsive" dialog appears with large test files

**Phase to address:**
File loading/data ingestion phase. Web Worker architecture must be designed before file loading is implemented, not retrofitted.

---

### Pitfall 6: Metric Calculations with Division-by-Zero and Empty Dataset Edge Cases

**What goes wrong:**
12+ derived metrics calculated from time-series data are riddled with edge cases. Division by zero when total time is zero (empty file or all-null data). NaN propagating through calculations when any input metric is undefined. "Best hour" and "worst hour" being meaningless for sessions shorter than an hour. "Posture improvement rate" being undefined for single-session data. Infinity values from dividing by near-zero durations corrupting downstream calculations.

**Why it happens:**
Developers implement metrics against the happy path (a nice multi-hour session with mixed posture) and never test: empty files, files with only null entries, sub-minute sessions, sessions with 100% good or 100% bad posture, files with a single data point.

**How to avoid:**
- Every metric calculation function must handle: empty input, single data point, all-null data, all-slouch data, all-good-posture data, sub-threshold duration.
- Return explicit "insufficient data" states (not zero, not NaN) for metrics that require minimum data. For example, "improvement rate" needs at least 2 distinct time periods.
- Guard every division: `denominator === 0 ? null : numerator / denominator`.
- Format display values to handle null/undefined gracefully -- show "-" or "N/A" instead of "NaN%" or "Infinity hours".
- Write unit tests for each metric with at least: empty array, single point, all-null, all-slouch, all-good, realistic session.

**Warning signs:**
- "NaN" or "Infinity" appearing anywhere in the dashboard
- Metrics showing 0% when they should show N/A
- Percentage metrics exceeding 100% or going below 0%
- Console errors about accessing properties of undefined during metric calculation

**Phase to address:**
Metrics calculation phase. Each metric must be developed with edge-case tests from the start, not added later.

---

### Pitfall 7: Dual Chart Engine State Synchronization Drift

**What goes wrong:**
When users toggle between Recharts and D3 chart engines, the two charts show different visual states: different zoom levels, different tooltip positions, different highlighted regions. The Recharts chart may show downsampled data at one resolution while the D3 chart shows a different resolution. Worse, if state is not properly cleaned up during switch, the previous engine's event listeners or DOM nodes leak, causing memory growth and ghost interactions.

**Why it happens:**
Each charting engine maintains its own internal state for interactions (zoom, pan, hover). If the shared data pipeline feeds both engines independently, subtle differences in how each engine handles the same data (rounding, null handling, axis scaling) produce different visual outputs. Cleanup of the previous engine's resources on switch is often incomplete.

**How to avoid:**
- Single source of truth: one shared data processing pipeline that produces a single processed/downsampled dataset consumed by both engines.
- Lift interaction state (zoom range, selected time range) to React state above both chart components. Each engine reads from and writes to the same state.
- On engine switch, fully unmount the previous engine's component (not just hide it). Use React keys to force complete remount: `<ChartWrapper key={engineType}>`.
- Both engines must use the exact same downsampled data, the same scale domain/range calculations, and the same null-handling rules. Extract these into shared utility functions.

**Warning signs:**
- Visual differences when toggling between engines on the same data
- Memory usage increasing each time the engine is toggled
- Interaction handlers from the previous engine firing after switch
- One engine handles edge data differently than the other

**Phase to address:**
Architecture phase (shared data pipeline) and chart implementation phase (integration testing between engines).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline data processing in chart components | Faster initial implementation | Every chart re-render reprocesses data; impossible to share between dual engines | Never -- extract from day one |
| Hardcoded sampling rate assumption (e.g., 1 sample/sec) | Simpler gap detection | Breaks with different tracker configurations; subtle metric errors | Never -- calculate from data |
| Using `any` type for parsed JSON data | Skip writing TypeScript interfaces | No autocomplete, no compile-time error detection, runtime crashes on unexpected data shapes | Only in initial prototype, refactor within same phase |
| Theme colors as inline hex values in chart config | Quick theming | Every theme change requires updating every chart's color config; colors drift between components | Never -- use CSS variables from the start |
| Skipping Web Worker for JSON parsing | Less architecture to build | UI freeze on files >5MB; poor UX that is expensive to retrofit | Acceptable only if files are guaranteed <2MB (they are not) |
| Calculating all 12+ metrics on every render | Simpler component structure | Expensive recalculation on every interaction; sluggish dashboard with large datasets | Never -- use memoization with dependency tracking |

## Integration Gotchas

Common mistakes when connecting libraries and APIs in this project.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Recharts + CSS Variables | Recharts accepts color strings, not CSS variable references; colors do not update on theme toggle | Read CSS variable values via `getComputedStyle()` and pass as props; re-read on theme change via a theme context listener |
| D3 scales + React state | Creating new D3 scale objects on every render, causing unnecessary downstream re-renders | Memoize D3 scale creation with `useMemo`, keyed on data extent and chart dimensions |
| FileReader + Web Worker | Transferring the parsed JSON object from Worker to main thread via structured clone (slow for large objects) | Use `Transferable` objects where possible, or keep the data in the Worker and query it. For JSON arrays, structured clone is unavoidable but faster than re-parsing |
| Recharts + D3 in same bundle | Both import overlapping D3 submodules, inflating bundle size | Use Vite's `build.rollupOptions.output.manualChunks` to deduplicate D3 submodules into a shared chunk; lazy-load each chart engine with `React.lazy()` |
| `prefers-color-scheme` + React state | Initial render flashes wrong theme because React state initializes before media query is read | Initialize theme state from `window.matchMedia('(prefers-color-scheme: dark)')` synchronously; use CSS `prefers-color-scheme` media query in base CSS as immediate fallback |
| Drag-and-drop + URL data param | Both entry points produce data but through different async paths; components assume one loading mechanism | Unify into single data provider that abstracts the source; components consume `useData()` hook regardless of how data was loaded |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all data points without downsampling | Chart loads slowly, browser tab hangs | LTTB downsampling to max ~1,500 visible points | >3,000 data points (about 50 minutes at 1/sec) |
| Recalculating all 12 metrics on every chart interaction | Dashboard feels sluggish, input lag on threshold slider | `useMemo` for each metric with proper dependency arrays; separate metrics into independent calculations | >10,000 source data points |
| Storing full parsed dataset in React state | Every `setState` triggers deep comparison and re-render cascade | Store data in a ref or external store; only store derived/display values in React state | >5MB parsed data object |
| Recharts animation on large datasets | Initial render takes 2-5 seconds; browser appears frozen | `isAnimationActive={false}` when data.length > 500 | >500 animated data points |
| Synchronous timestamp parsing in a loop | Parsing 100K timestamps blocks main thread for seconds | Batch parsing in Web Worker alongside JSON parse | >50,000 data points |
| Unthrottled window resize handler re-rendering charts | CPU spike on resize, dropped frames | Debounce resize handler (200ms), use ResizeObserver for container | Always, but noticeable >2 charts |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Parsing URL `?data=[...]` parameter without size limits | Attacker crafts URL with massive data payload, crashes recipient's browser tab (DoS via link sharing) | Enforce maximum URL parameter length (e.g., 50KB); show error for oversized payloads |
| No JSON schema validation on loaded files | Malformed JSON with deeply nested objects causes stack overflow during processing; unexpected field types cause runtime crashes | Validate JSON structure against expected schema before processing; reject non-conforming data with clear error message |
| Using `eval()` or `new Function()` for data parsing flexibility | Remote code execution if data contains executable strings | Always use `JSON.parse()` only; never evaluate data as code |
| Rendering user-supplied strings from JSON data into DOM without sanitization | XSS if data contains `<script>` tags or event handlers in field values | React's JSX auto-escapes by default, but avoid `dangerouslySetInnerHTML`; validate that numeric fields are actually numeric |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during file parsing | User drops file, nothing happens for 2-5 seconds, assumes it failed | Show spinner immediately on file drop; display parsing progress if possible |
| Chart renders but is empty with no explanation for invalid data | User sees blank chart, no idea what went wrong | Show specific error: "No valid data points found" or "Timestamps could not be parsed" with guidance |
| Slouch threshold slider re-renders entire chart on every pixel of drag | Slider interaction is laggy and frustrating | Debounce chart re-render (100-200ms delay); update threshold line position immediately via lightweight overlay |
| Dashboard metrics show raw numbers without context | "Slouch Rate: 0.4237" means nothing to users | Format as percentages, durations ("2h 15m"), and include comparative context ("better than your average") |
| Dark/light theme flash on load | Brief white flash in dark mode (FART -- Flash of inAccurate coloR Theme) | Set theme via inline `<script>` in HTML `<head>` before body renders; use CSS `prefers-color-scheme` media query as base |
| No way to identify what time range or date the data covers | User loads a file and cannot tell if it is today's data or last week's | Display date range prominently: "Session: March 15, 2026, 9:00 AM - 5:30 PM" |
| Chart tooltip shows raw delta Y pixels instead of meaningful posture info | Numbers are meaningless without domain context | Tooltip should show: time, posture state (good/slouching), how far from threshold, duration at current state |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **File loading:** Often missing error handling for non-JSON files, empty files, files with valid JSON but wrong schema, and files exceeding browser memory -- verify all four
- [ ] **Timestamp parsing:** Often missing validation that detected format is consistent across entire file (not mixed formats) -- verify with mixed-format test data
- [ ] **Chart rendering:** Often missing proper null/gap handling -- verify chart shows visual gaps for screen-off periods, not connected lines through absence
- [ ] **Metric calculations:** Often missing edge case handling -- verify each metric returns sensible output for: empty data, single point, all-null, all-slouch, all-good
- [ ] **Theme switching:** Often missing chart color update -- verify chart colors actually change when toggling theme, not just the surrounding UI
- [ ] **Responsive layout:** Often missing chart resize handling -- verify chart actually redraws at correct dimensions after window resize, not just scales the SVG
- [ ] **Dual engine toggle:** Often missing state preservation -- verify toggling Recharts to D3 and back preserves the data view, does not reset zoom/selection
- [ ] **Slouch threshold config:** Often missing live chart update -- verify changing threshold updates both the threshold line AND all dependent metrics simultaneously
- [ ] **URL data parameter:** Often missing URL length limits and encoding validation -- verify behavior with malformed URL encoding and oversized data
- [ ] **Dashboard metrics:** Often missing loading/empty states -- verify dashboard shows meaningful placeholders while data loads, not NaN or 0

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SVG DOM explosion (no downsampling) | MEDIUM | Add LTTB downsampling layer between data pipeline and chart components; if data pipeline is well-separated, this is a one-file addition |
| React/D3 DOM conflict | HIGH | Requires rearchitecting the D3 chart component. If D3 was doing direct DOM manipulation, rewrite to "D3 for math, React for DOM" pattern. Typically 2-3 days for one chart. |
| Timestamp misdetection | LOW | Add normalizer function at pipeline entry point. All downstream code already works with Date objects -- just fix the input. |
| Screen-off false positives | LOW | Adjust gap detection threshold and merge logic. Metrics recalculate automatically from corrected absence periods. |
| Main thread JSON freeze | HIGH | Retrofitting Web Worker requires restructuring async data flow. All components expecting synchronous data access need refactoring to handle async loading state. Design this in from the start. |
| Metric division-by-zero | LOW | Add guards to individual metric functions. Each fix is isolated and does not affect other metrics. |
| Dual engine state drift | MEDIUM | Extract shared state management and unified data pipeline. Moderate effort if components were loosely coupled, high effort if tightly integrated. |
| Theme flash (FART) | LOW | Add inline script to HTML head. Does not require changing React code. 15-minute fix. |
| Bundle size bloat from dual libraries | MEDIUM | Add code splitting with React.lazy() and Vite manual chunks. Requires restructuring imports but not logic. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SVG DOM explosion | Data Processing Pipeline | Profile chart render time with 86,400-point test file; must render in <1 second |
| React/D3 DOM conflict | Architecture / Chart Foundation | Toggle theme and resize window 10 times; no visual glitches or console errors |
| Timestamp misdetection | Data Parsing / Ingestion | Unit tests passing for Unix seconds, Unix milliseconds, and ISO strings; sanity check dates in range |
| Screen-off detection errors | Data Processing / Metrics | Total screen time + break time equals total session span (within 1 sample interval tolerance) |
| Main thread JSON freeze | File Loading / Data Ingestion | Load 20MB test file; UI loading spinner visible within 100ms; no "page unresponsive" dialog |
| Metric edge cases | Metrics / Dashboard | Unit test suite covers empty, single-point, all-null, all-slouch, all-good for every metric |
| Dual engine state drift | Chart Architecture | Toggle between engines 5 times; visual output identical each time; no memory leak in DevTools |
| Theme flash | UI Foundation / Theming | Load app in dark-mode OS setting; no white flash visible (test with throttled CPU) |
| Bundle size bloat | Build Configuration | Production build analysis shows D3 submodules deduplicated; each chart engine is a separate lazy chunk |

## Sources

- [Recharts performance issue #1146: slow with large data](https://github.com/recharts/recharts/issues/1146)
- [Recharts issue #1356: downsample / LTTB algorithm discussion](https://github.com/recharts/recharts/issues/1356)
- [Recharts issue #3697: large bundle size](https://github.com/recharts/recharts/issues/3697)
- [Recharts issue #702: chart gap when data is null](https://github.com/recharts/recharts/issues/702)
- [Recharts official performance guide](https://recharts.github.io/en-US/guide/performance/)
- [D3 + React integration patterns (GitHub gist)](https://gist.github.com/alexcjohnson/a4b714eee8afd2123ee00cb5b3278a5f)
- [SVG vs Canvas vs WebGL benchmarks 2025](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025)
- [LTTB downsampling algorithm (Master's thesis)](https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf)
- [downsample npm package](https://www.npmjs.com/package/downsample)
- [Common timestamp pitfalls guide](https://www.datetimeapp.com/learn/common-timestamp-pitfalls)
- [Flash of inAccurate coloR Theme (FART) -- CSS-Tricks](https://css-tricks.com/flash-of-inaccurate-color-theme-fart/)
- [Josh Comeau: The Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/)
- [Large JSON parsing in browser -- 2026 guide](https://www.bigjson.online/en/parse-large-json-files-2026)
- [Vite code splitting and lazy loading](https://sambitsahoo.com/blog/vite-code-splitting-that-works.html)
- [React useMemo official docs](https://react.dev/reference/react/useMemo)

---
*Pitfalls research for: SViewer -- client-side posture data visualization dashboard*
*Researched: 2026-04-05*
