# Phase 6: GitHub Pages Export + CI Workflow - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the built SViewer app to GitHub Pages via GitHub Actions, with a CI workflow that runs all quality gates (tests, formatting, linting) on every push and PR. Deploy to production only from main.

</domain>

<decisions>
## Implementation Decisions

### Workflow Design
- **D-01:** Single workflow file `.github/workflows/ci-pages.yml` with 4 jobs: `lint`, `test`, `format`, `build` + conditional `deploy`
- **D-02:** CI jobs (lint, test, format) run on all pushes and pull requests. Deploy job runs only on push to main or workflow_dispatch
- **D-03:** Build job depends on lint, test, and format passing. Deploy job depends on all three checks + build
- **D-04:** Add a `format` job running `npx prettier --check .` — SViewer enforces formatting as a quality gate (tka reference repo did not have this)

### Deployment Method
- **D-05:** Use official GitHub Actions for Pages deployment: `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`
- **D-06:** Deploy job requires permissions: `contents: read`, `pages: write`, `id-token: write`
- **D-07:** Deploy environment named `github-pages` with URL output from deployment step
- **D-08:** Concurrency group `pages` with `cancel-in-progress: true` on the deploy job
- **D-09:** Top-level workflow concurrency: `group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`

### Vite Base Path
- **D-10:** Dynamic `base` path in `vite.config.ts` using `resolvePagesBase()` function that reads `GITHUB_REPOSITORY` env var to extract repo slug — returns `/{repo-name}/` in CI, `/` locally
- **D-11:** Handle `.github.io` repos (return `/` instead of `/{slug}/`)

### Build Configuration
- **D-12:** No build env vars (VITE_GIT_COMMIT_SHA, VITE_GITHUB_RUN_NUMBER) — keep workflow simple, no version display needed
- **D-13:** Node.js 22, npm cache enabled via `actions/setup-node@v6`
- **D-14:** Use `npm ci` for deterministic installs in CI

### Claude's Discretion
- Exact job ordering optimizations (parallel vs sequential for lint/test/format)
- Whether to add a deployment summary step
- Any minor workflow YAML formatting preferences

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference implementation
- `https://github.com/tkr41850-debug/tka` — Reference repo whose Phase 8 CI/Pages pattern we are adapting
- `.github/workflows/ci-pages.yml` from tka repo — Single-workflow pattern with lint/test/build/deploy jobs
- `vite.config.ts` from tka repo — Dynamic `resolvePagesBase()` function for GitHub Pages base path

### Existing project files
- `package.json` — Current scripts: `lint` (eslint), `test` (vitest run), `build` (tsc -b && vite build); no format script yet
- `vite.config.ts` — Current config without `base` setting; needs `resolvePagesBase()` addition
- `eslint.config.js` — Existing ESLint config (flat config format)

### Quality gates (established Phase 1)
- `vitest run` — test runner
- `prettier --check .` — format check
- `eslint .` — linting

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` scripts already define `lint`, `test`, and `build` commands — CI jobs can call these directly
- Vite config exists at `vite.config.ts` with React + Tailwind plugins — needs `base` addition and `resolvePagesBase()` function

### Established Patterns
- Quality gates: `vitest run`, `prettier --check .`, `eslint .` — enforced since Phase 1
- Build output: `dist/` directory from `vite build`
- Node.js: project uses Vite 8 which requires Node.js 20.19+ or 22.12+

### Integration Points
- No `.github/` directory exists — starting from scratch
- `package.json` needs a `format:check` script added (or CI runs `npx prettier --check .` directly)
- `vite.config.ts` needs `base: resolvePagesBase()` and the `resolvePagesBase` function

</code_context>

<specifics>
## Specific Ideas

- Adapt the exact pattern from `tkr41850-debug/tka` repo's `ci-pages.yml` workflow
- Same `resolvePagesBase()` dynamic base path approach from tka's `vite.config.ts`
- Add format check job that tka didn't have (SViewer enforces prettier)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-github-io-pages-export-with-workflow-to-run-ci-tests-format-*
*Context gathered: 2026-04-05*
