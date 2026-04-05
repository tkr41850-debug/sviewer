# Phase 6: GitHub Pages Export + CI Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 06-github-io-pages-export-with-workflow-to-run-ci-tests-format-
**Areas discussed:** Deployment method, CI workflow design, Vite base path, Build info

---

## Reference Implementation

User directed to use the methods from `https://github.com/tkr41850-debug/tka` (Phase 8 pattern).

Reference repo pattern:
- Single `ci-pages.yml` with 4 jobs: lint, test, build, deploy
- Dynamic `resolvePagesBase()` in vite.config.ts
- Official GitHub Actions for Pages (configure-pages, upload-pages-artifact, deploy-pages)
- Deploy only from main (push or workflow_dispatch)
- CI on all pushes and PRs

---

## Workflow Adaptation

| Option | Description | Selected |
|--------|-------------|----------|
| Adapt directly | Copy tka pattern as-is: ci-pages.yml with lint/test/build/deploy | |
| Add format check | Same as above but add `prettier --check .` job since SViewer enforces formatting | ✓ |
| Minimal CI only | Just CI jobs without Pages deployment | |

**User's choice:** Add format check
**Notes:** SViewer has prettier as a quality gate (established Phase 1). tka repo didn't have a format check job.

---

## Build Info Variables

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include build info | Pass VITE_GIT_COMMIT_SHA and VITE_GITHUB_RUN_NUMBER for version display | |
| Skip build info | Keep workflow simpler, no version display needed | ✓ |
| You decide | Claude picks | |

**User's choice:** Skip build info
**Notes:** SViewer is a data viewer — version display in the app is unnecessary.

---

## Claude's Discretion

- Job parallelism strategy (lint/test/format can run in parallel)
- Deployment summary step inclusion
- Workflow YAML formatting

## Deferred Ideas

None — discussion stayed within phase scope.
