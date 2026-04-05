# Phase 1: Data Pipeline - Research

**Researched:** 2026-04-05
**Domain:** Vite project scaffolding, file ingestion APIs, JSON validation, Web Worker messaging, LTTB downsampling, developer tooling (Vitest, Prettier, ESLint)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Claude's Discretion
All implementation choices.

### Deferred Ideas (OUT OF SCOPE)
None — discuss phase skipped.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOAD-01 | User can load JSON data via drag-and-drop onto the page | FileReader API + drag event pattern; DropZone component design in UI-SPEC |
| LOAD-02 | User can load JSON data via file picker dialog | `<input type="file">` with styled label; 44px touch target per UI-SPEC |
| LOAD-03 | User can load JSON data via inline URL parameter (`?data=[...]`) | URLSearchParams API; size guard (50KB max per PITFALLS); synchronous at app init |
| LOAD-04 | App auto-detects timestamp format (Unix seconds, Unix ms, ISO strings) | Digit-count heuristic + sanity-range check; all normalization to ms; tested with three formats |
| LOAD-05 | App validates JSON structure and shows specific error messages for malformed data | Schema validation pure functions returning typed ParseError; exact copy strings in UI-SPEC |
| LOAD-06 | App handles large files without freezing the UI (Web Worker for parsing) | Web Worker + postMessage pattern; ProcessingIndicator from UI-SPEC; Transferable not applicable for JSON |
| PROC-01 | App computes slouch state by comparing current rect midpoint Y to reference rect midpoint Y | midpointY = y + h/2; deltaY = currentMidY - refMidY; isSlouching = deltaY > threshold |
| PROC-02 | App detects screen-off periods from null currentRect entries | null-guard on currentRect; isScreenOff flag in PostureRecord |
| PROC-03 | App detects screen-off periods from timestamp gaps | Median-interval gap detection; gap > N * medianInterval = screen off |
| PROC-04 | App segments data into sessions based on screen-off gaps | Contiguous run of non-absent records = session; sessions[] array in ProcessedData |
| PROC-05 | App normalizes all timestamps to Date objects regardless of input format | normalizeTimestamp() -> number (Unix ms) -> new Date(); done once at ingestion |
| PROC-06 | App applies LTTB downsampling for large datasets before charting | `downsample` npm package v1.4.0; target 1,500 points; full dataset kept for metrics |
| TOOL-01 | Vitest is configured and running with test coverage for data loading/processing logic | Vitest v4.1.2; vitest.config.ts; jsdom environment; at least one passing suite covering data/ |
| TOOL-02 | Prettier is configured and enforced (`prettier --check .` passes with zero violations) | Prettier v3.8.1; .prettierrc.json; eslint-config-prettier to disable conflicting rules |
| TOOL-03 | ts-eslint is configured and enforced (`eslint .` passes with zero errors) | ESLint v10.2.0; typescript-eslint v8.58.0; flat config (eslint.config.mjs) |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield build: the working directory has no `package.json`, no `src/`, no `index.html`. The first task is scaffolding via `npm create vite@latest` with the `react-ts` template. From there, the phase has three distinct work streams: (1) the data pipeline — pure TypeScript modules in `src/data/` for parsing, validation, timestamp normalization, and LTTB downsampling; (2) the upload UI — a minimal landing page implementing all three data entry points (drag-and-drop, file picker, URL param) with a Web Worker for off-main-thread JSON parsing; (3) developer tooling — Vitest, Prettier, and ESLint configured and passing, establishing the quality gates all subsequent phases inherit.

The existing project research (STACK.md, ARCHITECTURE.md, PITFALLS.md) is thorough and directly applicable. All technology choices, architectural patterns, and pitfall mitigations have been pre-researched at HIGH confidence. This research phase focuses on Phase 1-specific implementation details: the exact scaffold command, Web Worker mechanics in Vite, the `downsample` package API, ESLint 10 flat config syntax, Vitest 4 configuration, and what the data layer types must look like so Phase 2 (charting) can build against them without breaking changes.

**Primary recommendation:** Scaffold first, establish the type contract in `src/data/types.ts` second — every other module in Phase 1 (and every downstream phase) depends on that contract being stable.

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint |
|-----------|------------|
| Stack | React + TypeScript + Vite — no substitutions |
| Client-side only | No server, no API calls, no backend dependencies |
| Charting | Recharts + D3/visx (both; user-switchable) — Phase 2/4 concern, but data types must not couple to either |
| Theming | System-preference auto dark/light via CSS custom properties and `prefers-color-scheme` |
| No component library | Hand-rolled Tailwind components only (MUI/Ant/Mantine explicitly ruled out) |
| Quality gates | `vitest run`, `prettier --check .`, `eslint .` must all pass with zero errors/violations before commit |
| Commit convention | Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` |
| TypeScript version | 5.8.x (CLAUDE.md explicitly warns against 6.0.x) — however see State of the Art section |
| icon library | `lucide-react` (lightest tree-shakeable React icon lib) |

---

## Standard Stack

### Core (Phase 1 installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.4 | UI framework | Current stable; verified on npm |
| TypeScript | ^5.8.3 | Type safety | CLAUDE.md explicitly recommends 5.8.x; TS 6.0.2 released 2026-03-23, only 13 days old — ecosystem adoption unverified for visx/recharts |
| Vite | ^8.0.3 | Build + dev server | Project constraint; Rolldown-powered; verified on npm |
| @vitejs/plugin-react | ^6.0.1 | React Fast Refresh | Required for Vite+React; verified on npm |
| Tailwind CSS | ^4.2.2 | Utility CSS | Project constraint; CSS-first v4 config; verified on npm |
| @tailwindcss/vite | ^4.2.2 | Tailwind Vite plugin | Official Vite integration for Tailwind v4; verified on npm |
| clsx | ^2.1.1 | Conditional classnames | 239-byte companion to Tailwind; verified on npm |
| date-fns | ^4.1.0 | Date manipulation | Tree-shakeable; v4 adds timezone support; verified on npm |
| lucide-react | ^1.7.0 | Icons | UI-SPEC prescribes this; tree-shakeable; verified on npm |
| downsample | ^1.4.0 | LTTB downsampling | PROC-06; only npm package providing LTTB for time-series; verified on npm |

### Developer Tooling (Phase 1 installs, all phases inherit)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^4.1.2 | Test runner | Native Vite integration; TOOL-01; verified on npm |
| @testing-library/react | ^16.3.2 | Component testing | Standard behavior-first testing for React; verified on npm |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers | Extends Vitest expect with `toBeInTheDocument()` etc.; verified on npm |
| jsdom | ^29.0.1 | DOM environment | Vitest environment for browser-like tests; verified on npm |
| ESLint | ^10.2.0 | Linting | TOOL-03; flat config era; requires Node >=24 (satisfied: v24.13.0); verified on npm |
| typescript-eslint | ^8.58.0 | TypeScript ESLint rules | TOOL-03; flat config compatible; verified on npm |
| eslint-plugin-react-hooks | ^7.0.1 | Hooks linting | Catch invalid hook usage; verified on npm |
| eslint-config-prettier | ^10.1.8 | Disable conflicting rules | Prevent ESLint/Prettier conflicts; verified on npm |
| Prettier | ^3.8.1 | Code formatting | TOOL-02; verified on npm |

**Installation commands:**

```bash
# Inside /home/alpine/sviewer after scaffold

# Core dependencies
npm install clsx date-fns lucide-react downsample

# Tailwind
npm install tailwindcss @tailwindcss/vite

# Dev tools
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-config-prettier prettier
```

**Scaffold command (run from /home/alpine/ NOT /home/alpine/sviewer/):**

```bash
# The sviewer directory already exists as a git repo.
# Use --template to scaffold into it, then merge the generated files.
# OR scaffold to a temp location and move files over.
# Recommended: scaffold into the existing dir directly
cd /home/alpine/sviewer
npm create vite@latest . -- --template react-ts
# Answer "yes" to overwrite existing files (only .gitignore will be relevant)
```

**Version verification:** All versions above confirmed against npm registry on 2026-04-05.

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
src/
├── data/                    # Pure TypeScript — zero React imports (Phase 1 builds this entirely)
│   ├── types.ts             # PostureRecord, RawEntry, ParseResult, ParseError types
│   ├── parser.ts            # JSON.parse wrapper + schema detection
│   ├── validator.ts         # Schema validation, specific error messages
│   ├── normalizer.ts        # Timestamp normalization, midpoint computation, LTTB
│   └── worker.ts            # Web Worker entry point — receives raw string, posts ParseResult
├── components/
│   └── input/               # Upload UI components (Phase 1 builds this entirely)
│       ├── DropZone.tsx     # Drag-and-drop with drag-over state
│       ├── FilePickerButton.tsx
│       ├── ProcessingIndicator.tsx
│       ├── ErrorMessage.tsx
│       └── SuccessIndicator.tsx
├── hooks/
│   └── useFileLoader.ts     # Orchestrates: file input -> Worker -> data store
├── stores/
│   └── dataStore.ts         # React Context + useReducer for loaded data state
├── index.css                # Tailwind import + CSS custom property tokens from UI-SPEC
├── App.tsx                  # Root: URL param check + DropZone/upload screen
└── main.tsx                 # Vite entry
public/
├── parser.worker.js         # (compiled from src/data/worker.ts via Vite worker build)
vitest.config.ts
eslint.config.mjs
.prettierrc.json
```

### Pattern 1: Web Worker for JSON Parsing (LOAD-06)

**What:** Parse JSON in a dedicated Worker thread. Main thread stays responsive and can show `ProcessingIndicator` immediately on file drop.

**Why Phase 1 must establish this:** Retrofitting a Worker after synchronous parsing is architected is HIGH recovery cost (per PITFALLS.md). Design in from day one.

**Vite Worker import syntax:**

```typescript
// src/hooks/useFileLoader.ts
// Vite 8 Worker syntax — use "?worker" suffix
import ParserWorker from '../data/worker?worker';

export function useFileLoader() {
  const dispatch = useDataDispatch();

  const loadFile = useCallback((file: File) => {
    dispatch({ type: 'LOADING_START' });
    const worker = new ParserWorker();

    worker.onmessage = (e: MessageEvent<WorkerResult>) => {
      if (e.data.type === 'success') {
        dispatch({ type: 'LOADING_SUCCESS', payload: e.data.records });
      } else {
        dispatch({ type: 'LOADING_ERROR', payload: e.data.error });
      }
      worker.terminate();
    };

    // FileReader reads on main thread, passes text to worker
    const reader = new FileReader();
    reader.onload = (ev) => {
      worker.postMessage({ type: 'PARSE', text: ev.target!.result as string });
    };
    reader.readAsText(file);
  }, [dispatch]);

  return { loadFile };
}
```

```typescript
// src/data/worker.ts — runs in Worker thread
import { parseAndProcess } from './parser';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === 'PARSE') {
    try {
      const result = parseAndProcess(e.data.text);
      self.postMessage({ type: 'success', records: result.records });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }
};
```

**Note:** `postMessage` with a plain array uses structured clone (not Transferable — JSON arrays cannot be transferred, only cloned). For 20MB worth of records this is still faster than re-parsing on the main thread.

### Pattern 2: Canonical Data Types (types.ts — phase contract)

**What:** Define the canonical `PostureRecord` shape that all downstream phases (charting, metrics) build against. This is the most important contract in Phase 1.

**Critical:** Do NOT couple types to any charting library. Both Recharts and visx receive `PostureRecord[]` and transform internally.

```typescript
// src/data/types.ts

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Raw entry from the slouch tracker JSON file. */
export interface RawEntry {
  timestamp: number | string;
  referenceRect: Rect;
  currentRect: Rect | null;
}

/** Normalized record after parsing + processing. All downstream code uses this. */
export interface PostureRecord {
  /** Unix milliseconds — always. Normalized from any input format. */
  time: number;
  /** Midpoint Y of reference rect (calibrated upright position). */
  referenceY: number;
  /** Midpoint Y of current rect. null when screen is off. */
  currentY: number | null;
  /** currentY - referenceY. Positive = slouching down. null when screen is off. */
  deltaY: number | null;
  /** True when deltaY exceeds the slouch threshold (applied later; false during parsing). */
  isSlouching: boolean;
  /** True when currentRect was null OR timestamp gap detected. */
  isScreenOff: boolean;
  /** Index of the session this record belongs to (0-based). */
  sessionIndex: number;
}

export interface ParseError {
  code:
    | 'MALFORMED_JSON'
    | 'MISSING_REQUIRED_FIELDS'
    | 'UNRECOGNISED_TIMESTAMP'
    | 'EMPTY_FILE';
  message: string;
  entryIndex?: number;
}

export interface ParseResult {
  records: PostureRecord[];
  errors: ParseError[];
  metadata: {
    startTime: number;       // Unix ms
    endTime: number;         // Unix ms
    totalEntries: number;
    sessionCount: number;
    samplingIntervalMs: number; // Median sampling interval
  };
}

/** Downsampled view for charting. Full dataset kept separately for metrics. */
export interface ChartData {
  /** Up to 1,500 points, LTTB-sampled from records. */
  points: PostureRecord[];
  /** Original full-resolution records (for metrics, not for chart rendering). */
  fullRecords: PostureRecord[];
}
```

### Pattern 3: Timestamp Normalization (LOAD-04, PROC-05)

**What:** Auto-detect and normalize all timestamps to Unix milliseconds before any other processing.

**Detection heuristic (verified against PITFALLS.md):**

```typescript
// src/data/normalizer.ts

const YEAR_2020_MS = 1577836800000;
const YEAR_2050_MS = 2524608000000;

export function normalizeTimestamp(raw: number | string): number {
  if (typeof raw === 'string') {
    // Try ISO 8601 first
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) return parsed;
    // Fall back to numeric string
    const numeric = Number(raw);
    if (isNaN(numeric)) throw new Error(`Unrecognised timestamp: ${raw}`);
    return normalizeTimestamp(numeric);
  }

  // Unix seconds: 10 digits, value < 1e12
  if (raw < 1e12) {
    const ms = raw * 1000;
    if (ms >= YEAR_2020_MS && ms <= YEAR_2050_MS) return ms;
  }

  // Unix milliseconds: 13 digits, value >= 1e12
  if (raw >= YEAR_2020_MS && raw <= YEAR_2050_MS) return raw;

  throw new Error(
    `Timestamp ${raw} out of expected range (2020-2050) — check format`
  );
}
```

**Sanity range check:** If normalized date falls outside 2020-2050, throw `UNRECOGNISED_TIMESTAMP` error with the UI-SPEC copy: "Unrecognised timestamp format — expected Unix seconds, Unix milliseconds, or ISO 8601".

### Pattern 4: Screen-Off Detection (PROC-02, PROC-03)

**What:** Derive absence periods from two independent signals and merge them.

**Algorithm:**
1. Compute median sampling interval from consecutive timestamp differences.
2. For each record: `isScreenOff = currentRect === null || gapToPrevious > medianInterval * 4`.
3. The gap multiplier (4x) is a sensible default — configurable in `configStore` later but hardcoded for Phase 1.

### Pattern 5: LTTB Downsampling (PROC-06)

**What:** Reduce large datasets to ~1,500 points for chart rendering while preserving visual shape.

**`downsample` package API (v1.4.0):**

```typescript
// src/data/normalizer.ts
import { downsampleLTTB } from 'downsample';

const MAX_CHART_POINTS = 1500;

export function downsampleForChart(records: PostureRecord[]): PostureRecord[] {
  if (records.length <= MAX_CHART_POINTS) return records;

  // downsampleLTTB expects { x: number, y: number }[] — map and restore
  const points = records.map((r, i) => ({ x: r.time, y: r.deltaY ?? 0, index: i }));
  const sampled = downsampleLTTB(points, MAX_CHART_POINTS);
  return sampled.map((p) => records[(p as { index: number }).index]);
}
```

**Important:** Keep `fullRecords` for all metric calculations. Chart receives `downsampledRecords`. This split must be established in Phase 1's `ChartData` type and `dataStore`.

### Pattern 6: URL Parameter Loading (LOAD-03)

**What:** Parse `?data=[...]` on app init before rendering.

**Implementation in `App.tsx`:**

```typescript
// src/App.tsx
const MAX_URL_DATA_BYTES = 50 * 1024; // 50KB safety limit per PITFALLS security section

function App() {
  const dispatch = useDataDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (!data) return;

    if (data.length > MAX_URL_DATA_BYTES) {
      dispatch({
        type: 'LOADING_ERROR',
        payload: { code: 'MALFORMED_JSON', message: 'URL data parameter exceeds size limit (50KB)' }
      });
      return;
    }

    dispatch({ type: 'LOADING_START' });
    // URL param parsing can stay synchronous — data is bounded by the 50KB check
    try {
      const result = parseAndProcess(decodeURIComponent(data));
      dispatch({ type: 'LOADING_SUCCESS', payload: result });
    } catch (err) {
      dispatch({ type: 'LOADING_ERROR', payload: err });
    }
  }, []);
  // ...
}
```

### Pattern 7: State Store (dataStore)

**What:** React Context + useReducer for loaded data state. Minimal — only two states: loading and loaded.

```typescript
// src/stores/dataStore.ts

type DataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; result: ParseResult }
  | { status: 'error'; error: ParseError };

type DataAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_SUCCESS'; payload: ParseResult }
  | { type: 'LOADING_ERROR'; payload: ParseError };
```

### Pattern 8: Vitest Configuration (TOOL-01)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

**Minimum test suite for TOOL-01:** `src/data/normalizer.test.ts` — covers `normalizeTimestamp()` with Unix seconds, Unix ms, ISO string, out-of-range (expects throw), mixed format.

### Pattern 9: ESLint Flat Config (TOOL-03)

ESLint 10 uses flat config exclusively (`eslint.config.mjs`). The legacy `.eslintrc.*` format is removed.

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  prettierConfig,
  {
    ignores: ['dist/', 'node_modules/'],
  }
);
```

### Pattern 10: Prettier Configuration (TOOL-02)

```json
// .prettierrc.json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pattern 11: Tailwind v4 + CSS Tokens (UI-SPEC compliance)

```css
/* src/index.css */
@import "tailwindcss";

:root {
  --color-bg: oklch(98% 0 0);
  --color-surface: oklch(94% 0 0);
  --color-accent: oklch(55% 0.2 250);
  --color-destructive: oklch(55% 0.22 25);
  --color-border: oklch(85% 0 0);
  --color-text-primary: oklch(15% 0 0);
  --color-text-secondary: oklch(45% 0 0);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(12% 0 0);
    --color-surface: oklch(18% 0 0);
    --color-accent: oklch(65% 0.18 250);
    --color-destructive: oklch(65% 0.2 25);
    --color-border: oklch(28% 0 0);
    --color-text-primary: oklch(92% 0 0);
    --color-text-secondary: oklch(60% 0 0);
  }
}
```

Token names match UI-SPEC exactly. No hex values in component code.

### Anti-Patterns to Avoid

- **Parsing inside components:** Components call `useFileLoader()`. Pure parse functions live in `src/data/`. Never `JSON.parse()` inside a React component.
- **Storing metrics in state:** Metrics are Phase 3 concern. `dataStore` holds only `ParseResult`. Downstream phases derive metrics via `useMemo`.
- **TypeScript `any` for raw JSON:** Define `RawEntry` as an interface with required fields. Use a type guard to narrow `unknown` to `RawEntry` during validation — never use `any`.
- **Synchronous main-thread parsing without UI feedback:** Always dispatch `LOADING_START` before reading the file so `ProcessingIndicator` renders immediately.
- **Coupling data types to charting library shapes:** `PostureRecord` has no Recharts or D3 concerns. Chart adapters transform the canonical shape internally in Phase 2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LTTB downsampling | Custom triangle-bucket algorithm | `downsample` npm package v1.4.0 | The algorithm has subtle edge-case math (empty buckets, single-point bins). The `downsampleLTTB` export is a proven, typed implementation. |
| Icon SVGs | Copy-paste SVGs into components | `lucide-react` (tree-shakeable) | Icons need hover/focus states, consistent sizing, and dark/light coloring. lucide-react provides all that with `<Upload>`, `<AlertCircle>`, `<CheckCircle>` etc. |
| Test environment boilerplate | Manual jsdom setup | `@testing-library/jest-dom` + Vitest `environment: 'jsdom'` | The setup is non-trivial; testing-library provides everything wired up correctly. |
| Drag-and-drop state machine | Custom drag tracking state | Standard HTML5 drag events (`ondragenter`, `ondragover`, `ondragleave`, `ondrop`) | No library needed — the browser drag API is sufficient for a single-zone drop target. |

**Key insight:** The data processing logic (timestamp detection, midpoint calculation, session splitting) is genuinely domain-specific and SHOULD be hand-rolled — it's where the project's value lives and it's simple enough to write correctly with unit tests. Only reach for libraries when the problem has genuine complexity hidden beneath the surface (LTTB math, icon rendering).

---

## Common Pitfalls

### Pitfall 1: Scaffold Into Existing Git Repo

**What goes wrong:** `npm create vite@latest sviewer` from the parent directory creates a NEW directory, breaking the existing git history. Running it inside `/home/alpine/sviewer/` with `.` as the project name and accepting "overwrite" prompts is the correct approach.

**How to avoid:** Run `npm create vite@latest . -- --template react-ts` from inside `/home/alpine/sviewer/`. Vite will prompt to overwrite — accept. The generated `index.html`, `vite.config.ts`, `tsconfig.json` replace placeholders. Existing `.planning/`, `CLAUDE.md` are untouched.

**Warning signs:** A new subdirectory named `sviewer` appears inside the repo.

### Pitfall 2: TypeScript Version Conflict

**What goes wrong:** `npm create vite@latest` installs `typescript@latest` which is currently 6.0.2. CLAUDE.md explicitly mandates 5.8.x. TS 6 introduces breaking changes (module resolution, strict flag behavior) that haven't been validated against the full stack (Recharts 3.x, visx 3.x, Tailwind 4.x).

**How to avoid:** After scaffold, explicitly install `typescript@~5.8.3` to pin 5.8.x: `npm install -D typescript@~5.8.3`. Verify with `npx tsc --version`.

**Warning signs:** `tsc --version` shows `Version 6.0.x`. Type errors in `node_modules` types that weren't present before.

### Pitfall 3: ESLint 9 vs ESLint 10

**What goes wrong:** `npm create vite@latest` may generate an `.eslintrc.cjs` (old format) or install ESLint 9. CLAUDE.md requires ts-eslint enforcement. ESLint 10 uses flat config only.

**How to avoid:** After scaffold, check what was installed. If ESLint 9: `npm install -D eslint@^10.2.0`. Delete any `.eslintrc.*` files. Create `eslint.config.mjs` using the flat config pattern above.

**Warning signs:** A `.eslintrc.cjs` file exists. ESLint warns "You are using a legacy config file."

### Pitfall 4: Vite Worker Build Configuration

**What goes wrong:** Using `new Worker(new URL('../data/worker.ts', import.meta.url))` (the classic pattern) works in development but breaks in production builds because Vite does not bundle worker files by that import path by default.

**How to avoid:** Use Vite's native Worker syntax: `import ParserWorker from '../data/worker?worker'`. This tells Vite to compile and bundle the worker as a separate chunk. No additional `vite.config.ts` changes needed.

**Warning signs:** Worker works in `vite dev` but `worker.postMessage` is never received in `vite build` output.

### Pitfall 5: Timestamp Edge Cases in Production Data

**What goes wrong:** The normalization heuristic (< 1e12 = seconds, >= 1e12 = ms) breaks for very old Unix timestamps (pre-2001) or microsecond timestamps (16 digits). The sanity range check (2020–2050) catches most of these but must throw a clear `UNRECOGNISED_TIMESTAMP` error, not silently produce wrong dates.

**How to avoid:** Always throw (not return a fallback Date) when the sanity check fails. The error surfaces immediately with the exact UI-SPEC error copy. Unit test with out-of-range values.

**Warning signs:** Chart X-axis showing dates in 1970. Session durations calculating as millions of hours.

### Pitfall 6: URL Data Parameter Without Size Guard

**What goes wrong:** A URL with a multi-megabyte `?data=` parameter will crash the browser tab due to URL length limits and memory pressure. Per the PITFALLS security section, this is a denial-of-service vector even in a single-user app.

**How to avoid:** In `App.tsx`, check `data.length > 50 * 1024` before attempting to parse. Show a specific error message: "URL data parameter too large — use file upload for datasets over 50KB."

### Pitfall 7: Prettier and ESLint Conflict Without `eslint-config-prettier`

**What goes wrong:** ESLint rules (especially typescript-eslint) include style rules that conflict with Prettier's formatting. Running both produces contradictory fixes — Prettier formats one way, ESLint auto-fixes back the other way.

**How to avoid:** Always include `eslint-config-prettier` as the LAST entry in `eslint.config.mjs`. It disables all ESLint rules that conflict with Prettier. Never use `eslint --fix` on formatting — let Prettier own all formatting decisions.

---

## Code Examples

### Validated Drop Zone (LOAD-01)

```typescript
// src/components/input/DropZone.tsx
import { useState, useCallback, DragEvent } from 'react';
import clsx from 'clsx';
import { Upload } from 'lucide-react';
import { FilePickerButton } from './FilePickerButton';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div
      role="region"
      aria-label="File drop zone"
      tabIndex={0}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { /* open file picker */ } }}
      className={clsx(
        'min-h-[200px] rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center gap-4 transition-all duration-150',
        isDragOver
          ? 'border-[var(--color-accent)] bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <Upload className="text-[var(--color-text-secondary)]" size={32} />
      <p className="text-xl font-semibold text-[var(--color-text-primary)]">
        {isDragOver ? 'Drop to load' : 'Drop JSON file or choose from disk'}
      </p>
      <FilePickerButton onFile={onFile} />
      <p className="text-sm text-[var(--color-text-secondary)]">
        Accepts .json files from the slouch tracker
      </p>
    </div>
  );
}
```

### Validated Data Schema Check

```typescript
// src/data/validator.ts
import type { RawEntry, ParseError } from './types';

function isRect(val: unknown): val is { x: number; y: number; w: number; h: number } {
  return (
    typeof val === 'object' &&
    val !== null &&
    typeof (val as Record<string, unknown>).x === 'number' &&
    typeof (val as Record<string, unknown>).y === 'number' &&
    typeof (val as Record<string, unknown>).w === 'number' &&
    typeof (val as Record<string, unknown>).h === 'number'
  );
}

export function validateEntry(entry: unknown, index: number): entry is RawEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  if (e.timestamp === undefined || e.timestamp === null) return false;
  if (!isRect(e.referenceRect)) return false;
  if (e.currentRect !== null && !isRect(e.currentRect)) return false;
  return true;
}

export function validateEntries(raw: unknown): { entries: RawEntry[]; error?: ParseError } {
  if (!Array.isArray(raw)) {
    return { entries: [], error: { code: 'MALFORMED_JSON', message: 'Expected a JSON array at the top level' } };
  }
  if (raw.length === 0) {
    return { entries: [], error: { code: 'EMPTY_FILE', message: 'Empty file — the JSON file contains no tracking entries' } };
  }
  for (let i = 0; i < raw.length; i++) {
    if (!validateEntry(raw[i], i)) {
      return {
        entries: [],
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields — expected currentRect and timestamp in each entry',
          entryIndex: i,
        },
      };
    }
  }
  return { entries: raw as RawEntry[] };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript 5.x (ecosystem default) | TypeScript 6.0.2 released 2026-03-23 | 2026-03-23 | TS 6 is 13 days old as of 2026-04-05. CLAUDE.md mandates 5.8.x. Wait for visx/recharts ecosystem to confirm TS 6 support before upgrading. |
| ESLint 8 + `.eslintrc.*` | ESLint 10 + flat config (`eslint.config.mjs`) | ESLint 9 (2024); ESLint 10 (2025-2026) | `.eslintrc.*` format removed in ESLint 10. Must use flat config. `typescript-eslint` v8+ supports flat config natively. |
| ESLint 8/9 (required Node 18+) | ESLint 10 (requires Node >=24 or 20.19+/22.13+) | ESLint 10 | Node v24.13.0 on this machine satisfies the requirement. |
| Vite 5/6 + esbuild+Rollup | Vite 8 + Rolldown (Rust bundler) | Vite 8 (2026) | `npm create vite@latest` installs Vite 8. Faster builds. Same config API. |
| Tailwind v3 config file (`tailwind.config.js`) | Tailwind v4 CSS-first config (`@import "tailwindcss"`) | Tailwind v4 (2025) | No `tailwind.config.js` needed. `@tailwindcss/vite` plugin handles PostCSS automatically. |

**TypeScript 6 note:** TS 6.0.2 became latest on npm 2026-03-23. CLAUDE.md was written when TS 6 was "days old" and explicitly says to use 5.8.x. As of 2026-04-05, it is still only 13 days old. The constraint remains valid — explicitly pin `typescript@~5.8.3`.

---

## Open Questions

1. **`downsample` package TypeScript types**
   - What we know: `downsample@1.4.0` is the latest and has TS support per its description.
   - What's unclear: Whether `downsampleLTTB` accepts a custom data shape (objects with `x`/`y`) or requires specific array format. The index-mapping pattern in the code example above may need adjustment.
   - Recommendation: During implementation, run `npm install downsample` and check the exported types in `node_modules/downsample/index.d.ts` before finalizing the normalization code.

2. **visx peer dependency on `react@'^16.8.0 || ^17.0.0 || ^18.0.0'`**
   - What we know: visx 3.12.0 peer deps don't list React 19. This is a Phase 2/4 concern, not Phase 1.
   - What's unclear: Whether visx will work with React 19 despite not declaring it (likely yes — hooks API is unchanged).
   - Recommendation: Flag for Phase 2 planning. Phase 1 doesn't install visx.

3. **Session gap threshold multiplier (4x median interval)**
   - What we know: 4x is the recommended default from PITFALLS.md.
   - What's unclear: Without sample data from the actual slouch tracker, the right multiplier is unknown.
   - Recommendation: Hardcode 4x in Phase 1, expose as a named constant `SCREEN_OFF_GAP_MULTIPLIER = 4` so Phase 3 can make it configurable without changing the algorithm.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8, ESLint 10 | Yes | 24.13.0 | — |
| npm | All package installs | Yes | 11.9.0 | — |
| npx / create-vite | Scaffold | Yes | 11.9.0 | Manual file creation |
| Write permissions in /home/alpine/sviewer | Scaffold and file creation | Yes | — | — |
| Git | Commits | Yes (git repo exists) | — | — |

**Node.js 24.13.0 satisfies:**
- Vite 8 engine requirement: `^20.19.0 || >=22.12.0` — SATISFIED
- ESLint 10 engine requirement: `^20.19.0 || ^22.13.0 || >=24` — SATISFIED

**Missing dependencies with no fallback:** None. All required tools are available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` — Wave 0 must create |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOAD-04 | normalizeTimestamp() with Unix seconds, Unix ms, ISO string | unit | `npx vitest run src/data/normalizer.test.ts -t "timestamp"` | Wave 0 |
| LOAD-04 | normalizeTimestamp() throws on out-of-range timestamp | unit | `npx vitest run src/data/normalizer.test.ts -t "out-of-range"` | Wave 0 |
| LOAD-05 | validateEntries() returns EMPTY_FILE error for [] input | unit | `npx vitest run src/data/validator.test.ts -t "empty"` | Wave 0 |
| LOAD-05 | validateEntries() returns MISSING_REQUIRED_FIELDS for bad entry | unit | `npx vitest run src/data/validator.test.ts -t "missing fields"` | Wave 0 |
| PROC-01 | midpoint Y computation: currentMidY - refMidY | unit | `npx vitest run src/data/normalizer.test.ts -t "midpoint"` | Wave 0 |
| PROC-02 | null currentRect -> isScreenOff = true | unit | `npx vitest run src/data/normalizer.test.ts -t "screen-off null"` | Wave 0 |
| PROC-03 | timestamp gap > 4x median interval -> isScreenOff = true | unit | `npx vitest run src/data/normalizer.test.ts -t "screen-off gap"` | Wave 0 |
| PROC-04 | session segmentation: contiguous non-absent records | unit | `npx vitest run src/data/normalizer.test.ts -t "sessions"` | Wave 0 |
| PROC-06 | downsampleForChart reduces >1500 records to <=1500 | unit | `npx vitest run src/data/normalizer.test.ts -t "downsample"` | Wave 0 |
| LOAD-06 | ProcessingIndicator renders on loadFile() dispatch | component | `npx vitest run src/components/input/DropZone.test.tsx` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/data/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** `npx vitest run && npx prettier --check . && npx eslint .`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration with jsdom environment
- [ ] `src/test/setup.ts` — jest-dom matchers import
- [ ] `src/data/normalizer.test.ts` — covers LOAD-04, PROC-01, PROC-02, PROC-03, PROC-04, PROC-06
- [ ] `src/data/validator.test.ts` — covers LOAD-05
- [ ] `src/components/input/DropZone.test.tsx` — covers LOAD-06 loading state
- [ ] `.prettierrc.json` — Prettier config
- [ ] `eslint.config.mjs` — ESLint flat config

---

## Sources

### Primary (HIGH confidence)

- npm registry (live query 2026-04-05) — all package versions verified
- CLAUDE.md (this repo) — technology stack, quality gate requirements, TypeScript version constraint
- `.planning/research/STACK.md` (this repo, 2026-04-05) — full stack rationale
- `.planning/research/ARCHITECTURE.md` (this repo, 2026-04-05) — layered architecture patterns, data types
- `.planning/research/PITFALLS.md` (this repo, 2026-04-05) — all pitfall mitigations
- `.planning/phases/01-data-pipeline/01-UI-SPEC.md` (this repo, 2026-04-05) — component inventory, CSS tokens, copy

### Secondary (MEDIUM confidence)

- Vite Workers documentation pattern (`?worker` suffix) — from Vite 8 docs via prior research
- ESLint 10 flat config syntax — from typescript-eslint v8 migration guides referenced in STACK.md

### Tertiary (LOW confidence)

- `downsample` package internal API details (index mapping pattern) — inferred from package description; must verify against installed types during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry on 2026-04-05
- Architecture: HIGH — sourced from detailed prior project research (ARCHITECTURE.md, PITFALLS.md)
- Pitfalls: HIGH — sourced from documented GitHub issues and prior research
- Validation architecture: HIGH — Vitest config pattern is standard for Vite projects

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable ecosystem; Tailwind/Vitest/ESLint release new minors frequently but no breaking changes expected within 30 days)
