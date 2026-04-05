---
phase: 1
slug: data-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` — Wave 0 must create |
| **Quick run command** | `npx vitest run src/data/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/data/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green: `npx vitest run && npx prettier --check . && npx eslint .`
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | TOOL-01 | config | `npx vitest run` | Wave 0 | ⬜ pending |
| 1-01-02 | 01 | 0 | TOOL-02 | config | `npx prettier --check .` | Wave 0 | ⬜ pending |
| 1-01-03 | 01 | 0 | TOOL-03 | config | `npx eslint .` | Wave 0 | ⬜ pending |
| 1-02-01 | 02 | 1 | LOAD-04 | unit | `npx vitest run src/data/normalizer.test.ts -t "timestamp"` | Wave 0 | ⬜ pending |
| 1-02-02 | 02 | 1 | PROC-01 | unit | `npx vitest run src/data/normalizer.test.ts -t "midpoint"` | Wave 0 | ⬜ pending |
| 1-02-03 | 02 | 1 | PROC-02 | unit | `npx vitest run src/data/normalizer.test.ts -t "screen-off null"` | Wave 0 | ⬜ pending |
| 1-02-04 | 02 | 1 | PROC-03 | unit | `npx vitest run src/data/normalizer.test.ts -t "screen-off gap"` | Wave 0 | ⬜ pending |
| 1-02-05 | 02 | 1 | PROC-04 | unit | `npx vitest run src/data/normalizer.test.ts -t "sessions"` | Wave 0 | ⬜ pending |
| 1-02-06 | 02 | 1 | PROC-06 | unit | `npx vitest run src/data/normalizer.test.ts -t "downsample"` | Wave 0 | ⬜ pending |
| 1-03-01 | 03 | 1 | LOAD-05 | unit | `npx vitest run src/data/validator.test.ts -t "empty"` | Wave 0 | ⬜ pending |
| 1-03-02 | 03 | 1 | LOAD-05 | unit | `npx vitest run src/data/validator.test.ts -t "missing fields"` | Wave 0 | ⬜ pending |
| 1-04-01 | 04 | 2 | LOAD-01 | manual | drag-and-drop visual test | N/A | ⬜ pending |
| 1-04-02 | 04 | 2 | LOAD-02 | manual | URL parameter load test | N/A | ⬜ pending |
| 1-04-03 | 04 | 2 | LOAD-06 | component | `npx vitest run src/components/input/DropZone.test.tsx` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with jsdom environment
- [ ] `src/test/setup.ts` — jest-dom matchers import
- [ ] `src/data/normalizer.test.ts` — covers LOAD-04, PROC-01, PROC-02, PROC-03, PROC-04, PROC-06
- [ ] `src/data/validator.test.ts` — covers LOAD-05
- [ ] `src/components/input/DropZone.test.tsx` — covers LOAD-06 loading state
- [ ] `.prettierrc.json` — Prettier config
- [ ] `eslint.config.mjs` — ESLint flat config

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop file onto page shows success | LOAD-01 | Browser API requires real interaction | Open dev server, drag a .json file, verify success message appears |
| URL param ?data=[...] loads without interaction | LOAD-02 | Requires browser URL bar | Open with ?data= param, verify data loads automatically |
| 20MB file loads without UI freeze | LOAD-06 | Performance must be observed | Load a 20MB JSON fixture, verify spinner appears and UI stays responsive |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
