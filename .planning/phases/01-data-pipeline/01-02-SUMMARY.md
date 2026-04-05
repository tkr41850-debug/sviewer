---
phase: 01-data-pipeline
plan: 02
subsystem: data
tags: [typescript, vitest, types, tdd, red-state, normalizer, validator, dropzone]

# Dependency graph
requires:
  - phase: 01-data-pipeline plan 01
    provides: Vite 8 + React 19 + TypeScript 5.8.3 scaffold with Vitest, Prettier, ESLint configured
provides:
  - src/data/types.ts — canonical PostureRecord, RawEntry, ParseResult, ParseError, ChartData, Rect interfaces
  - src/data/normalizer.test.ts — RED tests for timestamp normalization, midpoint, screen-off, sessions, LTTB
  - src/data/validator.test.ts — RED tests for schema validation (empty file, missing fields)
  - src/components/input/DropZone.test.tsx — RED tests for accessibility role/label, copy text, disabled state
  - .prettierignore — excludes .planning/ and .claude/ from Prettier check
affects: [01-03, 01-04, all subsequent phases that use PostureRecord or ChartData]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED state — tests written before implementations, intentionally failing with module-not-found
    - Types-first contract — types.ts defines the stable interface before any implementation
    - .prettierignore excludes planning artifacts from source code quality gates

key-files:
  created:
    - src/data/types.ts
    - src/data/normalizer.test.ts
    - src/data/validator.test.ts
    - src/components/input/DropZone.test.tsx
    - .prettierignore
  modified: []

key-decisions:
  - "Types-first contract: types.ts written before any test or implementation — downstream phases must not change this interface without a dedicated types change commit"
  - ".prettierignore added to exclude .planning/ and .claude/ directories — planning markdown files not subject to Prettier prose-wrap formatting"

patterns-established:
  - "Pattern: All test files use vitest describe/it/expect — no Jest globals"
  - "Pattern: Test files import from sibling modules that don't exist yet (RED state) — implementations in Plan 03"
  - "Pattern: PostureRecord is the canonical normalized type — never use RawEntry downstream"

requirements-completed: [LOAD-04, LOAD-05, PROC-01, PROC-02, PROC-03, PROC-04, PROC-05, PROC-06, LOAD-01, LOAD-06]

# Metrics
duration: 12min
completed: 2026-04-05
---

# Phase 01 Plan 02: Types Contract and RED Test Scaffolds Summary

**6-interface TypeScript data contract (PostureRecord, ChartData, etc.) and 3 RED test files covering timestamp normalization, schema validation, and DropZone accessibility — foundations for Plan 03 implementation.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-05T04:55:03Z
- **Completed:** 2026-04-05T05:06:56Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- Wrote `src/data/types.ts` with 6 exported interfaces forming the stable phase contract all downstream phases depend on
- Wrote 3 RED test files covering 11 describe blocks (6 normalizer, 2 validator, 3 DropZone) — all failing with module-not-found as expected
- Added `.prettierignore` to restore `prettier --check .` quality gate (planning docs excluded)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write canonical data types (the phase contract)** - `d055dea` (feat)
2. **Task 2: Write RED test scaffolds for data pipeline and upload UI** - `25b7688` (test)
3. **Deviation fix: add .prettierignore** - `8a1ff05` (fix)

**Plan metadata:** (to be added after state updates)

## Files Created/Modified

- `src/data/types.ts` — 6 exported interfaces: Rect, RawEntry, PostureRecord, ParseError, ParseResult, ChartData
- `src/data/normalizer.test.ts` — 6 describe blocks covering timestamp, midpoint, screen-off (null), screen-off (gap), sessions, LTTB downsampling
- `src/data/validator.test.ts` — 2 describe blocks covering empty file and missing required fields validation
- `src/components/input/DropZone.test.tsx` — 3 tests covering accessibility role/label, heading copy, and disabled state
- `.prettierignore` — excludes .planning/ and .claude/ directories from Prettier formatting check

## Decisions Made

- **Types-first contract:** `types.ts` written and committed before any test or implementation file. All downstream phases (charting, metrics, export) must build against these interfaces without modification.
- **`.prettierignore` added:** `prettier --check .` was failing on `.planning/` markdown files (not formatted to Prettier's prose-wrap rules). Adding `.prettierignore` restores the quality gate for source code without formatting planning artifacts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added .prettierignore to restore prettier quality gate**
- **Found during:** Post-Task-2 verification (`prettier --check .`)
- **Issue:** `prettier --check .` failed on 22 `.planning/` and `.claude/` markdown files — planning docs were never formatted to Prettier's prose-wrap standard. Quality gate was broken from Plan 01 but only surfaced now with more files checked.
- **Fix:** Created `.prettierignore` excluding `.planning/`, `.claude/`, `node_modules/`, and `dist/` directories
- **Files modified:** `.prettierignore` (created)
- **Verification:** `npx prettier --check .` now exits 0
- **Committed in:** `8a1ff05`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Quality gate fix necessary for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/data/types.ts` is the stable contract — Plan 03 implements `normalizer.ts` and `validator.ts` against it
- All 3 test files are in RED state — Plan 03 turns them GREEN by writing implementations
- `src/components/input/DropZone.test.tsx` is ready for Plan 04 DropZone component implementation
- Quality gates all passing: `vitest run` (3 files failing expected RED), `prettier --check .` (0 violations), `eslint .` (0 errors)

## Known Stubs

None — this plan produces only type definitions and test files. No implementation stubs exist.

---
*Phase: 01-data-pipeline*
*Completed: 2026-04-05*
