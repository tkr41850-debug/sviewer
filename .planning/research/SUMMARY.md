# Project Research Summary

**Project:** SViewer -- Slouch Tracking Data Viewer
**Domain:** Client-side data visualization dashboard (posture/health tracking)
**Researched:** 2026-04-05
**Confidence:** HIGH

## Executive Summary

SViewer is a fully client-side, single-page data visualization dashboard that loads JSON files from a posture/slouch tracking application and renders interactive time-series charts, summary metrics, and derived analytics. The expert approach for this type of tool is a layered data pipeline architecture: raw JSON ingestion flows through parsing, validation, and normalization into a canonical data shape, which then feeds pure-function metric computations and two interchangeable charting engines (Recharts for declarative dashboards, visx/D3 for low-level customization). The stack is React 19, TypeScript 5.8, Vite 8, Tailwind CSS v4, and date-fns v4 -- all mature, well-documented choices with no meaningful risk. No backend, no component library, no state management library. The app is lean by design.

The recommended approach is to build the data layer first (parsing, validation, normalization, timestamp handling) because every feature -- charts, metrics, exports -- depends on correctly processed data. The dual charting engine, while the project's signature differentiator, is the highest-risk feature and should be implemented only after one engine is proven end-to-end. The Strategy pattern with a shared ChartAdapter interface keeps the engines decoupled. Metrics should be derived via useMemo from source data, never stored separately, to eliminate synchronization bugs.

The top risks are: SVG DOM explosion when Recharts renders large datasets without downsampling (prevent with LTTB algorithm applied before charting), React/D3 DOM ownership conflicts in the visx engine (prevent by using "D3 for math, React for DOM" from day one), timestamp format misdetection silently corrupting all downstream calculations (prevent with a robust normalizer as the first pipeline step), and main-thread freezing from synchronous JSON.parse on large files (prevent by designing Web Worker architecture into the file loading system from the start, not retrofitting later).

## Key Findings

### Recommended Stack

The stack is deliberately minimal. React 19.2 with TypeScript 5.8 on Vite 8 provides the foundation. TypeScript 6.0 was explicitly rejected as too new (days old). Two charting libraries serve the dual-engine requirement: Recharts 3.8 for the declarative view, visx 3.12 for the D3-powered view. Tailwind CSS v4 handles styling with zero-runtime CSS and native dark mode support. date-fns v4 provides tree-shakeable date utilities. No component library (the charts ARE the UI), no state management library (React Context + useReducer suffices for a few settings + one data blob), no statistics library (domain-specific arithmetic is simpler to write than to configure a generic library).

**Core technologies:**
- **React 19.2 + TypeScript 5.8:** Mature, stable foundation. Avoid TS 6.0 until ecosystem confirms support.
- **Vite 8 (Rolldown):** Project constraint. Requires Node.js 20.19+ or 22.12+. Fastest build tool available.
- **Recharts 3.8:** Declarative charting engine. 3.6M+ weekly downloads. May need `react-is` npm override for React 19 peer dependency warning.
- **visx 3.12 (xychart + scale + axis + tooltip + responsive + threshold):** D3-React bridge. Modular, ~15KB core. Pin all visx packages to same minor version.
- **Tailwind CSS v4:** CSS-first config, native `@theme` for color tokens, `dark:` variant for theming. Zero-runtime.
- **date-fns v4:** Tree-shakeable to ~3KB for the 5-6 functions needed. Functional API fits TypeScript well.
- **React Context + useReducer:** Sufficient for app state (loaded data, theme, engine selection, threshold config). No external state library needed.

**Bundle budget:** ~160-170KB gzipped estimated, well under 200KB target. Lazy-load inactive chart engine to reduce initial paint.

### Expected Features

**Must have (table stakes -- P1):**
- File loading (drag-drop, file picker, URL `?data=` param) -- the data entry gate
- Timestamp auto-detection and normalization (Unix s/ms/ISO)
- Slouch state computation with configurable threshold
- Time-series line graph with threshold line and screen-off gap visualization
- Tooltips on hover (timestamp, delta, posture state)
- Top-line KPI cards (posture score, slouch rate, screen time, session count)
- Dark/light theme with system-preference auto-detection
- Responsive layout

**Should have (differentiators -- P2):**
- Brush-to-zoom with overview minimap
- Full 12+ dashboard metrics
- Session timeline (segmented bar: green/red/gray)
- Dual charting engine toggle (Recharts vs visx)
- Export CSV and PNG
- Keyboard shortcuts

**Defer (v2+):**
- Calendar heatmap (needs multi-session data)
- Day-over-day comparison (needs multi-day data)
- Annotations on graph
- Shareable URL with view state
- Posture score breakdown donut
- Animated transitions

**Anti-features (do not build):** Real-time streaming, user accounts/persistence, AI recommendations, population comparison, push notifications, gamification, native mobile app.

### Architecture Approach

The architecture is a three-layer data pipeline: Input Layer (file picker, drag-drop, URL param converging into a Data Ingester), Data Layer (parsed store, computation engine, metrics store as derived state), and Presentation Layer (chart panel with dual-engine strategy pattern, metric card dashboard, settings panel). Cross-cutting concerns are theme provider, config store, and error boundaries. The critical architectural decisions are: (1) the data layer is pure TypeScript with zero React dependencies, fully testable in isolation; (2) metrics are derived via useMemo, never stored separately; (3) chart engines implement a shared TimeSeriesChartProps interface via the Strategy pattern; (4) theme switching uses CSS custom properties to avoid React re-renders.

**Major components:**
1. **Data Ingester** (parser + validator + normalizer) -- Pure functions, no React. Foundation for everything.
2. **Computation Engine** (12+ metric functions) -- Pure functions consuming PostureRecord[], called via useMemo.
3. **Chart Panel** (Strategy pattern switcher) -- Selects Recharts or visx implementation based on config. Shared data pipeline, lifted interaction state.
4. **Dashboard** (MetricGrid + MetricCard) -- Stateless presentational components receiving computed metrics.
5. **Config Store** -- Threshold, engine selection, theme. Persisted to localStorage.

### Critical Pitfalls

1. **SVG DOM explosion with large datasets** -- Recharts renders every point as a DOM node; past ~3K-5K points, the browser lags severely. Prevent by implementing LTTB downsampling to ~1,500 points in the data pipeline, before any chart component receives data. Disable Recharts animations for >500 points.

2. **React/D3 DOM ownership conflict** -- D3 direct DOM manipulation fights React reconciliation, causing visual glitches on re-render. Prevent by enforcing "D3 for math, React for DOM" pattern from the start. visx already follows this, but any custom D3 work must respect the boundary.

3. **Timestamp seconds vs. milliseconds misdetection** -- `new Date(unixSeconds)` silently produces 1970 dates. Prevent with a normalizer that checks digit count, applies sanity range checks (2020-2030), and normalizes everything to milliseconds at ingestion time.

4. **Main-thread JSON.parse freeze** -- Synchronous parsing of >5MB files freezes the UI with no loading indicator. Prevent by designing Web Worker architecture into file loading from the start. Retrofitting is HIGH recovery cost.

5. **Dual engine state synchronization drift** -- Engines show different zoom/selection states after toggle. Prevent by lifting interaction state (zoom range, selection) to React state above both engines, using a single downsampled dataset, and forcing full unmount/remount on engine switch via React keys.

6. **Metric division-by-zero and edge cases** -- Empty files, single data points, all-null data produce NaN/Infinity in 12+ metrics. Prevent by returning explicit "insufficient data" states and testing every metric against empty, single-point, all-null, all-slouch, and all-good datasets.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Foundation and Data Pipeline
**Rationale:** Every feature depends on correctly parsed, validated, normalized data. The architecture research identifies the data layer as having zero dependencies on anything else -- it must be built first. Timestamp misdetection (Pitfall 3) and screen-off detection errors (Pitfall 4) must be caught here, not discovered downstream.
**Delivers:** Project scaffold (Vite 8 + React 19 + TS 5.8 + Tailwind v4), data types (RawEntry, PostureRecord, ParseResult), parser, validator, normalizer with timestamp auto-detection, file loading with Web Worker architecture, URL data parameter handling, error handling for malformed data.
**Addresses features:** File loading (drag-drop/picker/URL), timestamp auto-detection, screen-off period detection.
**Avoids pitfalls:** Timestamp misdetection (#3), main-thread JSON freeze (#5), screen-off false positives (#4).

### Phase 2: Core Metrics and Dashboard Layout
**Rationale:** Once data is reliably parsed, the next dependency is the computation engine and the presentational shell. Metrics are pure functions -- they can be built and tested exhaustively before any chart exists. The dashboard layout (responsive grid, KPI cards, theme) is independent of charting. Building metrics first ensures the "looks done but isn't" edge cases (Pitfall 6) are caught early.
**Delivers:** 12+ metric computation functions with edge-case handling, MetricCard and MetricGrid components, responsive AppShell layout, dark/light theme with FOUC prevention, settings panel (threshold slider, engine toggle stub).
**Addresses features:** KPI cards (top 4-6), full dashboard metrics, dark/light theme, responsive layout, configurable slouch threshold.
**Avoids pitfalls:** Metric division-by-zero (#6), theme flash (FART).

### Phase 3: Primary Chart Engine (Recharts)
**Rationale:** The first charting engine should be the simpler, higher-level one (Recharts). This validates the ChartAdapter interface design and the data downsampling pipeline. The LTTB downsampling layer (Pitfall 1) must be built here and proven before attempting the second engine.
**Delivers:** ChartAdapter interface (TimeSeriesChartProps), LTTB downsampling utility, RechartsTimeSeries component with threshold line, null-gap handling, tooltips, Brush-to-zoom minimap.
**Addresses features:** Time-series line graph, slouch threshold line, tooltips, screen-off visualization, brush-to-zoom.
**Avoids pitfalls:** SVG DOM explosion (#1), chart-engine data coupling (Anti-Pattern 2).

### Phase 4: Secondary Chart Engine (visx/D3) and Dual-Engine Toggle
**Rationale:** The second engine is the highest-risk feature. It depends on the ChartAdapter interface proven in Phase 3, the shared downsampled data pipeline, and the lifted interaction state. This is the phase most likely to surface the React/D3 DOM conflict (Pitfall 2) and state synchronization drift (Pitfall 7).
**Delivers:** VisxTimeSeries component implementing the same ChartAdapter interface, engine toggle in ChartPanel with React key-based unmount/remount, code splitting via React.lazy() for both engines, integration tests verifying visual parity.
**Addresses features:** Dual charting engine toggle.
**Avoids pitfalls:** React/D3 DOM conflict (#2), dual engine state drift (#7), bundle size bloat.

### Phase 5: Session Timeline, Export, and Polish
**Rationale:** With both engines working, the remaining P2 features can be added. These are lower-risk, well-documented patterns. The session timeline is a simple SVG/CSS visualization. Export uses html2canvas (PNG) and Blob (CSV). Keyboard shortcuts are thin event listeners.
**Delivers:** Session timeline (segmented bar), export CSV, export PNG, keyboard shortcuts, animated transitions, any remaining metric displays.
**Addresses features:** Session timeline, export CSV, export PNG, keyboard shortcuts.
**Avoids pitfalls:** None critical -- standard patterns.

### Phase 6: Advanced Visualizations (v2)
**Rationale:** Calendar heatmap and day-over-day comparison only become meaningful with multi-session/multi-day data. Annotations require a UI design for add/edit/delete that is not yet specified. These are deferred until the core product is validated.
**Delivers:** Calendar heatmap, day-over-day comparison overlay, user annotations, shareable URL with view state, posture score breakdown donut.
**Addresses features:** All P3 features.

### Phase Ordering Rationale

- **Data before visualization:** The architecture research shows a strict dependency chain: data types -> parser/validator/normalizer -> metric computation -> chart rendering. Building out of order creates the "parsing inside components" anti-pattern.
- **Metrics before charts:** Metrics are pure functions that validate the data pipeline is correct. If metrics produce wrong numbers, the data layer has a bug. Catching this before charting saves rework.
- **One chart engine before two:** The dual-engine toggle is the biggest engineering risk. Building Recharts first proves the ChartAdapter interface design. If the interface is wrong, fixing it with one implementation is cheap; fixing it with two is expensive.
- **LTTB downsampling with first chart, not after:** The SVG DOM explosion pitfall is the most impactful performance issue. The downsampling pipeline must exist when the first chart is built, not bolted on when performance degrades.
- **Web Worker at file loading, not retrofitted:** The architecture research and pitfalls research both flag this. Retrofitting is HIGH recovery cost. Design it in during Phase 1.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Primary Chart Engine):** LTTB downsampling algorithm integration, Recharts 3.x Brush API (breaking changes from 2.x), null-gap rendering in Recharts (known issue #702).
- **Phase 4 (visx/D3 Engine):** visx xychart time-scale configuration, shared interaction state lifting pattern, React.lazy code splitting for chart engines with Vite 8's Rolldown bundler.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation/Data Pipeline):** Well-documented. JSON parsing, FileReader API, Web Workers, and timestamp handling are thoroughly covered in research.
- **Phase 2 (Metrics/Dashboard):** Pure computation + presentational components. Standard React patterns, no library-specific complexity.
- **Phase 5 (Timeline/Export/Polish):** html2canvas, CSV Blob export, and keyboard event handling are well-established patterns with abundant documentation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries are mature (5+ months stable), version-pinned, with confirmed compatibility. Recharts + React 19 peer dep is documented with known workaround. Only uncertainty is Vite 8 Rolldown being relatively new, but it is a project constraint. |
| Features | HIGH | Feature landscape is well-defined by PROJECT.md scope plus competitive analysis. Table stakes are clear from health dashboard patterns. Anti-features are well-bounded by the client-side constraint. |
| Architecture | HIGH | Layered data pipeline is the established pattern for this type of app. Strategy pattern for dual engines is textbook. Build order is deterministic from dependency analysis. |
| Pitfalls | HIGH | All critical pitfalls are documented with GitHub issues, performance benchmarks, and community discussion. Recovery costs are assessed. Pitfall-to-phase mapping is explicit. |

**Overall confidence:** HIGH

### Gaps to Address

- **LTTB downsampling library choice:** The `downsample` npm package is referenced but not version-pinned or evaluated for Vite 8/TS 5.8 compatibility. Validate during Phase 3 planning, or implement LTTB from scratch (the algorithm is ~50 lines).
- **Web Worker data transfer cost:** Structured clone of large parsed arrays from Worker to main thread may be slow. Need to profile with realistic file sizes (5-20MB) during Phase 1 implementation. Consider Transferable ArrayBuffers if structured clone is a bottleneck.
- **Recharts 3.x Brush behavior:** Recharts 3.x has breaking changes from 2.x with a new internal state model. The Brush component API may have changed. Verify during Phase 3 planning by checking Recharts 3.8 release notes.
- **visx + Recharts D3 submodule overlap:** Both libraries import D3 submodules. Vite's Rolldown bundler should deduplicate, but this should be verified in production build analysis to stay within the 200KB budget.
- **Zustand vs React Context final decision:** ARCHITECTURE.md references Zustand stores while STACK.md recommends React Context + useReducer. For this app's simple state shape, either works. Recommend React Context to avoid an external dependency, but the architecture's store boundaries are valid regardless of implementation.

## Sources

### Primary (HIGH confidence)
- [Recharts GitHub releases / v3.8.1](https://github.com/recharts/recharts/releases) -- version, API, React 19 compat
- [visx GitHub / npm v3.12.0](https://github.com/airbnb/visx) -- stable release, xychart API
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) -- Rolldown architecture, Node.js requirements
- [Tailwind CSS v4 blog](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, dark mode
- [React 19.2 blog](https://react.dev/blog/2025/10/01/react-19-2) -- stable release
- [date-fns v4 npm](https://www.npmjs.com/package/date-fns) -- tree-shaking, timezone support
- [Recharts performance issue #1146](https://github.com/recharts/recharts/issues/1146) -- SVG DOM explosion
- [Recharts null-gap issue #702](https://github.com/recharts/recharts/issues/702) -- chart gap handling

### Secondary (MEDIUM confidence)
- [Martin Fowler: Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) -- layered architecture
- [LTTB downsampling thesis](https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf) -- algorithm specification
- [Josh Comeau: The Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/) -- FOUC prevention
- [JMIR Dashboard Design Practices Review](https://www.jmir.org/2026/1/e77361) -- health dashboard UX patterns
- [SVG vs Canvas vs WebGL benchmarks 2025](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025) -- rendering performance
- [UPRIGHT Posture App](https://www.uprightpose.com/app/) -- competitor feature analysis

### Tertiary (LOW confidence)
- [downsample npm package](https://www.npmjs.com/package/downsample) -- LTTB implementation, needs version/compat validation
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- Brush API changes need verification against 3.8.x

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*
