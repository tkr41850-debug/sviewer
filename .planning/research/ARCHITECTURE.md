# Architecture Research

**Domain:** Client-side data visualization dashboard (posture/slouch tracking)
**Researched:** 2026-04-05
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       INPUT LAYER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  File Picker  │  │  Drag & Drop │  │  URL Param   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         └──────────────────┼─────────────────┘                      │
│                            ▼                                        │
│                   ┌────────────────┐                                 │
│                   │  Data Ingester │                                 │
│                   │  (parse/valid) │                                 │
│                   └────────┬───────┘                                 │
├────────────────────────────┼────────────────────────────────────────┤
│                     DATA LAYER                                      │
│                            ▼                                        │
│                   ┌────────────────┐                                 │
│                   │  Parsed Store  │ (validated, normalized records) │
│                   └────────┬───────┘                                 │
│                            ▼                                        │
│               ┌────────────────────────┐                            │
│               │   Computation Engine   │                            │
│               │  (12+ derived metrics) │                            │
│               └────────────┬───────────┘                            │
│                            ▼                                        │
│                   ┌────────────────┐                                 │
│                   │ Metrics Store  │ (computed dashboard data)       │
│                   └────────┬───────┘                                 │
├────────────────────────────┼────────────────────────────────────────┤
│                  PRESENTATION LAYER                                  │
│         ┌──────────────────┼──────────────────┐                     │
│         ▼                  ▼                   ▼                     │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐              │
│  │ Chart Panel │  │  Dashboard    │  │  Settings    │              │
│  │ (dual eng.) │  │  (metric      │  │  (threshold, │              │
│  │             │  │   cards)      │  │   engine,    │              │
│  │ ┌─────────┐│  │               │  │   theme)     │              │
│  │ │Recharts ││  │               │  │              │              │
│  │ ├─────────┤│  │               │  │              │              │
│  │ │ visx/D3 ││  │               │  │              │              │
│  │ └─────────┘│  │               │  │              │              │
│  └─────────────┘  └───────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                    CROSS-CUTTING                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Theme     │  │    Config    │  │  Error       │              │
│  │   Provider   │  │    Store     │  │  Boundary    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Data Ingester | Accept raw JSON from any input source, detect timestamp format, validate schema, normalize records | Pure functions + FileReader API; no React dependency |
| Parsed Store | Hold validated, normalized time-series records in memory | React state (useState or Zustand store) |
| Computation Engine | Derive 12+ metrics from parsed data: slouch rate, time-to-correct, session detection, streaks, etc. | Pure functions called via useMemo; zero side effects |
| Metrics Store | Hold computed metric values ready for rendering | Derived state (useMemo output), not a separate store |
| Chart Panel | Render time-series graph using the selected charting engine | Strategy pattern: shared ChartAdapter interface, two implementations |
| Dashboard | Render metric cards in responsive grid layout | Stateless presentational components receiving props |
| Settings | User controls: slouch threshold, chart engine toggle, (future) theme override | Config store feeding into computation and presentation |
| Theme Provider | System-preference dark/light with CSS custom properties | prefers-color-scheme media query + CSS variables |
| Config Store | Persist user preferences (threshold, selected engine) | Zustand with optional localStorage persistence |
| Error Boundary | Catch rendering errors, show fallback UI for bad data | React ErrorBoundary wrapping each major section |

## Recommended Project Structure

```
src/
├── data/                   # Data layer (zero React dependencies)
│   ├── parser.ts           # JSON parsing, timestamp auto-detection
│   ├── validator.ts        # Schema validation, error messages
│   ├── normalizer.ts       # Normalize records to canonical shape
│   └── types.ts            # PostureRecord, RawEntry, ParseResult types
├── metrics/                # Computation layer (pure functions)
│   ├── slouch.ts           # Slouch state computation, threshold logic
│   ├── sessions.ts         # Screen-on/off detection, session splitting
│   ├── aggregations.ts     # Rates, averages, streaks, trends
│   ├── time-analysis.ts    # Best/worst hour, daily patterns
│   └── index.ts            # computeAllMetrics() orchestrator
├── charts/                 # Chart abstraction layer
│   ├── types.ts            # ChartAdapter interface, ChartProps
│   ├── recharts/           # Recharts implementation
│   │   └── RechartsTimeSeries.tsx
│   ├── visx/               # visx/D3 implementation
│   │   └── VisxTimeSeries.tsx
│   └── ChartPanel.tsx      # Engine switcher component
├── components/             # Presentation layer
│   ├── input/              # File picker, drag-drop zone, URL loader
│   │   ├── DropZone.tsx
│   │   ├── FilePicker.tsx
│   │   └── DataLoader.tsx  # Orchestrates all input methods
│   ├── dashboard/          # Metric cards and layout
│   │   ├── MetricCard.tsx
│   │   ├── MetricGrid.tsx
│   │   └── cards/          # Individual metric card variants
│   ├── settings/           # Threshold slider, engine toggle
│   │   └── SettingsPanel.tsx
│   └── layout/             # Shell, header, responsive containers
│       ├── AppShell.tsx
│       └── ErrorFallback.tsx
├── stores/                 # State management
│   ├── dataStore.ts        # Parsed records + loading state
│   └── configStore.ts      # User preferences (threshold, engine)
├── hooks/                  # Custom hooks bridging layers
│   ├── useFileLoader.ts    # File input -> parse -> store
│   ├── useMetrics.ts       # Memoized metric computation
│   └── useTheme.ts         # System preference detection
├── theme/                  # Theming
│   ├── variables.css       # CSS custom properties for both themes
│   └── index.ts            # Theme utilities
├── App.tsx                 # Root composition
└── main.tsx                # Vite entry point
```

### Structure Rationale

- **data/:** Pure TypeScript, zero React imports. Testable in isolation. The data layer must never import from components/ or hooks/. This is the foundation everything else depends on.
- **metrics/:** Pure functions that accept normalized records and return metric objects. Separated from data/ because parsing is a one-time operation while metrics recompute when thresholds change.
- **charts/:** The Strategy pattern boundary. ChartPanel.tsx selects the implementation based on config. Each engine subfolder owns its own React component. Adding a third engine means adding a folder, not touching existing code.
- **components/:** Presentational React components. Receive data via props or hooks. No direct data parsing or metric computation here.
- **stores/:** Minimal -- only two stores needed for this app. dataStore holds parsed records, configStore holds user preferences. Metrics are derived, not stored.
- **hooks/:** Bridge between layers. useMetrics calls pure metric functions inside useMemo. useFileLoader orchestrates the input-to-store pipeline.

## Architectural Patterns

### Pattern 1: Layered Data Pipeline

**What:** Data flows in one direction through distinct layers: Input -> Parse/Validate -> Normalize -> Compute -> Render. Each layer is a pure transformation with a defined input and output type.
**When to use:** Always -- this is the backbone of the app.
**Trade-offs:** Slightly more files than a monolithic approach, but each layer is independently testable and the mental model is trivially simple.

**Example:**
```typescript
// data/types.ts
interface RawEntry {
  timestamp: number | string;
  referenceRect: Rect;
  currentRect: Rect | null;
}

interface PostureRecord {
  time: number;          // Unix ms, always
  referenceY: number;    // Midpoint Y of reference rect
  currentY: number | null; // Midpoint Y of current rect, null = screen-off
  deltaY: number | null;   // currentY - referenceY, null = screen-off
  isSlouching: boolean;    // deltaY exceeds threshold
  isScreenOff: boolean;
}

interface ParseResult {
  records: PostureRecord[];
  errors: ParseError[];
  metadata: { startTime: number; endTime: number; totalEntries: number };
}
```

### Pattern 2: Strategy Pattern for Dual Chart Engine

**What:** Define a common interface (ChartProps) that both charting engines implement. A switcher component reads the selected engine from config and renders the correct implementation. Neither engine knows about the other.
**When to use:** Whenever multiple implementations must be interchangeable at runtime.
**Trade-offs:** Requires disciplined prop typing. Both engines must render identical data representations despite very different APIs (Recharts is declarative JSX; visx is low-level primitives). The abstraction must be at the data level, not the rendering level.

**Example:**
```typescript
// charts/types.ts
interface TimeSeriesChartProps {
  records: PostureRecord[];
  threshold: number;
  width?: number;
  height?: number;
  onPointHover?: (record: PostureRecord | null) => void;
}

// charts/ChartPanel.tsx
function ChartPanel(props: TimeSeriesChartProps) {
  const engine = useConfigStore((s) => s.chartEngine);

  switch (engine) {
    case 'recharts':
      return <RechartsTimeSeries {...props} />;
    case 'visx':
      return <VisxTimeSeries {...props} />;
  }
}
```

### Pattern 3: Derived State via useMemo (Not Separate Store)

**What:** Metrics are not stored -- they are computed on-the-fly from records + config using useMemo. When records or threshold change, metrics recompute. This eliminates synchronization bugs between "source data" and "derived data."
**When to use:** When derived data is a pure function of source data, and computation cost is manageable (sub-100ms for typical datasets).
**Trade-offs:** If datasets grow very large (100K+ records), computation may need to move to a Web Worker. For the expected data sizes (hours of tracking at 1-second intervals = ~3,600 records per hour), useMemo is more than sufficient.

**Example:**
```typescript
// hooks/useMetrics.ts
function useMetrics() {
  const records = useDataStore((s) => s.records);
  const threshold = useConfigStore((s) => s.threshold);

  const metrics = useMemo(
    () => computeAllMetrics(records, threshold),
    [records, threshold]
  );

  return metrics;
}
```

## Data Flow

### Primary Data Flow

```
[User drops file / picks file / URL has ?data param]
    |
    v
[DataLoader component]
    |
    v  (raw string)
[parser.ts] ──parse JSON──> [validator.ts] ──check schema──> [normalizer.ts]
    |                            |                                  |
    | (ParseError[])             | (ValidationError[])              |
    v                            v                                  v
[Error display]            [Error display]              [PostureRecord[]]
                                                               |
                                                               v
                                                     [dataStore.records]
                                                               |
                               ┌───────────────────────────────┤
                               |                               |
                               v                               v
                    [useMetrics hook]                  [ChartPanel]
                    useMemo(computeAll)                reads records
                               |                      + threshold
                               v                               |
                    [MetricGrid]                               v
                    renders 12+ cards              [Recharts OR visx]
                                                   renders time-series
```

### State Management

```
┌─────────────────────────────────────────┐
│              configStore                 │
│  - threshold: number                    │
│  - chartEngine: 'recharts' | 'visx'    │
│  - (persisted to localStorage)          │
└──────────────────┬──────────────────────┘
                   │ subscribes
    ┌──────────────┼──────────────┐
    v              v              v
[ChartPanel]  [useMetrics]  [SettingsPanel]
    │              │
    │              v
    │     ┌───────────────┐
    │     │   dataStore    │
    │     │  - records[]   │
    │     │  - isLoading   │
    │     │  - error       │
    │     └───────┬───────┘
    │             │ subscribes
    │      ┌──────┼──────┐
    v      v             v
[ChartPanel]       [useMetrics]
                        │
                        v (useMemo)
                   [MetricGrid]
```

### Key Data Flows

1. **File ingestion flow:** User action -> FileReader.readAsText() -> JSON.parse() -> validate schema -> normalize timestamps + compute midpoints -> store in dataStore. All synchronous for typical file sizes (< 5MB). Entire pipeline is < 50ms for 10K records.

2. **Metric computation flow:** dataStore.records + configStore.threshold -> computeAllMetrics() via useMemo -> 12+ metric values -> MetricGrid renders cards. Recomputes only when records or threshold change.

3. **Chart rendering flow:** dataStore.records + configStore.threshold + configStore.chartEngine -> ChartPanel selects engine -> engine-specific component renders SVG. Recharts uses declarative `<LineChart>` composition. visx uses imperative scale/axis/path primitives.

4. **Theme flow:** System `prefers-color-scheme` -> CSS media query applies correct CSS variable set -> all components inherit colors. No React re-renders needed for theme changes when using pure CSS approach.

5. **Settings flow:** User adjusts threshold slider -> configStore updates -> useMetrics recomputes (records unchanged, threshold changed) -> MetricGrid + ChartPanel re-render with new threshold line position and updated slouch classifications.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| < 10K records | No optimization needed. useMemo handles computation. Recharts/visx render directly. This is the expected case. |
| 10K-100K records | Downsample for chart rendering (every Nth point, or LTTB algorithm). Keep full dataset for metric computation. Consider virtualized dashboard if many cards. |
| 100K+ records | Move metric computation to Web Worker to avoid main-thread blocking. Implement progressive chart rendering. Stream-parse the JSON file. |

### Scaling Priorities

1. **First bottleneck: Chart rendering.** SVG performance degrades with thousands of DOM nodes. Recharts and visx both struggle past ~5K visible data points. Solution: data downsampling before charting (the metrics still use the full dataset). LTTB (Largest Triangle Three Buckets) is the standard downsampling algorithm for time-series that preserves visual shape.
2. **Second bottleneck: Initial parse time.** Large JSON files (> 10MB) may block the main thread during JSON.parse(). Solution: Web Worker for parsing. Not needed for v1 since typical tracking sessions produce < 1MB of JSON.

## Anti-Patterns

### Anti-Pattern 1: Metrics in State

**What people do:** Store computed metrics in a separate Zustand store or useState, then manually keep them "in sync" with source data.
**Why it's wrong:** Creates synchronization bugs. When threshold changes but metrics don't recompute, the dashboard shows stale data. Two sources of truth for values that should have one.
**Do this instead:** Derive metrics via useMemo from source data + config. One source of truth (records + threshold), one derivation point (computeAllMetrics), zero synchronization.

### Anti-Pattern 2: Chart Engine Leaking Into Data Layer

**What people do:** Format data differently for Recharts vs D3 in the data layer, creating engine-specific data shapes.
**Why it's wrong:** The data layer now has coupling to presentation concerns. Adding or changing a chart engine forces changes in the data pipeline.
**Do this instead:** The data layer produces one canonical PostureRecord[] shape. Each chart engine adapter transforms PostureRecord[] into whatever its library needs, inside the charts/ folder.

### Anti-Pattern 3: Parsing Inside Components

**What people do:** Put JSON.parse, timestamp detection, and validation logic directly in the FileUpload component.
**Why it's wrong:** Untestable without rendering React components. Cannot reuse parsing logic for URL param input. Component becomes a 300-line monster mixing I/O, validation, and UI.
**Do this instead:** Components call hooks. Hooks call pure functions. The DropZone component fires onFile(file), useFileLoader reads and parses it, parser/validator/normalizer do the work, result lands in the store.

### Anti-Pattern 4: Single Monolithic useMemo

**What people do:** Compute all 12+ metrics in a single useMemo call that returns one giant object.
**Why it's wrong:** Any threshold change recomputes everything, including metrics that don't depend on threshold (e.g., total screen time, session count). Harder to test individual metrics.
**Do this instead:** Group metrics by dependency. Metrics that depend only on records go in one useMemo. Metrics that depend on records + threshold go in another. computeAllMetrics() internally should be composed of smaller, focused functions.

### Anti-Pattern 5: CSS-in-JS for Theming

**What people do:** Use styled-components or Emotion for dark/light theme switching, causing React re-renders on theme change.
**Why it's wrong:** Theme changes trigger re-render of every themed component. For a chart-heavy app, this means SVG re-renders that are expensive.
**Do this instead:** Use CSS custom properties (variables) scoped under a `.dark` / `.light` class or `prefers-color-scheme` media query. Theme switch = one class change on `<html>`, zero React re-renders. Components reference `var(--color-bg)` etc.

## Integration Points

### External Services

None. This is a fully client-side application. No API calls, no backend, no external data fetching.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Input -> Data Layer | Pure function calls: `parseJSON(text)` returns `ParseResult` | FileReader provides the text string; data layer has no knowledge of how the file was obtained |
| Data Layer -> Stores | Store setter: `dataStore.setRecords(result.records)` | One-directional. Data layer produces, store holds. |
| Stores -> Computation | Hook subscription: `useDataStore(s => s.records)` inside `useMetrics` | Read-only from computation's perspective |
| Computation -> Presentation | Hook return: `useMetrics()` returns typed metric object | Presentational components receive metrics as props from parent, or call the hook directly |
| Config Store -> Chart Panel | Hook subscription: `useConfigStore(s => s.chartEngine)` | Drives engine selection at render time |
| Chart Adapter -> Engine | Strategy pattern: ChartPanel passes `TimeSeriesChartProps` to selected engine component | Each engine subfolder is self-contained |

## Build Order (Dependencies)

The architecture has clear dependency ordering that dictates build sequence:

```
Phase 1: data/ (types, parser, validator, normalizer)
  └── No dependencies on anything else. Pure TypeScript.
      Build and test first. Everything else depends on this.

Phase 2: metrics/ (computation engine)
  └── Depends on: data/types.ts only.
      Pure functions. Test with fixture data.

Phase 3: stores/ (dataStore, configStore)
  └── Depends on: data/types.ts for record shape.
      Thin layer. Zustand stores are ~20 lines each.

Phase 4: hooks/ (useFileLoader, useMetrics, useTheme)
  └── Depends on: stores/, metrics/, data/.
      Bridges all layers. Integration point.

Phase 5: charts/ (abstraction + both engines)
  └── Depends on: data/types.ts for PostureRecord shape.
      ChartPanel depends on configStore for engine selection.
      Can be built in parallel with dashboard.

Phase 6: components/ (input, dashboard, settings, layout)
  └── Depends on: hooks/, stores/.
      Presentational. Can be built incrementally.

Phase 7: Integration (App.tsx wires everything together)
  └── Depends on: all of the above.
```

**Critical path:** data/ -> metrics/ -> hooks/useMetrics -> dashboard cards. The chart and input layers can be built in parallel once the data types are defined.

## Sources

- [Martin Fowler: Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) -- layered architecture patterns
- [FreeCodeCamp: Three Layer Application with React](https://www.freecodecamp.org/news/how-to-create-a-three-layer-application-with-react-8621741baca0) -- data/domain/presentation separation
- [Refactoring Guru: Strategy Pattern in TypeScript](https://refactoring.guru/design-patterns/strategy/typescript/example) -- dual engine abstraction
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- current Recharts API
- [Airbnb visx](https://github.com/airbnb/visx) -- low-level D3 visualization components for React
- [DEV: Applying Strategy Pattern in React](https://dev.to/itswillt/applying-design-patterns-in-react-strategy-pattern-enn) -- React-specific strategy pattern
- [React.dev: useMemo](https://react.dev/reference/react/useMemo) -- derived state computation
- [DEV: Web Workers for JSON Processing](https://dev.to/marabesi/web-workers-to-the-rescue-how-to-work-with-json-strings-without-blocking-user-interactions-2jf2) -- scaling path for large files
- [Tailwind CSS: Dark Mode](https://tailwindcss.com/docs/dark-mode) -- system preference theming via CSS

---
*Architecture research for: SViewer -- client-side posture tracking data visualization dashboard*
*Researched: 2026-04-05*
