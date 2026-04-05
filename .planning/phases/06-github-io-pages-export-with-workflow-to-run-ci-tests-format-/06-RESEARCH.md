# Phase 6: GitHub Pages Export + CI Workflow - Research

**Researched:** 2026-04-05
**Domain:** GitHub Actions CI/CD, GitHub Pages deployment, Vite static site configuration
**Confidence:** HIGH

## Summary

This phase creates a single GitHub Actions workflow that runs CI quality gates (lint, test, format check) on every push and PR, and conditionally deploys the Vite-built SPA to GitHub Pages on push to main. The technical domain is well-understood: GitHub's official Pages Actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) provide a turnkey deployment pipeline, and Vite's `base` config option handles the subdirectory path that GitHub Pages requires for project repos.

The reference implementation from `tkr41850-debug/tka` has been fetched and analyzed. SViewer's workflow will adapt this pattern with one addition: a `format` job running `prettier --check .` (the tka repo did not have this). The `resolvePagesBase()` function from tka's `vite.config.ts` is a clean pattern for dynamic base path resolution that works both locally and in CI.

**Primary recommendation:** Create `.github/workflows/ci-pages.yml` with parallel lint/test/format jobs, a build job gated on all three, and a deploy job gated on build + main branch. Add `resolvePagesBase()` to `vite.config.ts`. Use `actions/checkout@v6` (current per official Vite docs) rather than the tka repo's `@v5`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single workflow file `.github/workflows/ci-pages.yml` with 4 jobs: `lint`, `test`, `format`, `build` + conditional `deploy`
- **D-02:** CI jobs (lint, test, format) run on all pushes and pull requests. Deploy job runs only on push to main or workflow_dispatch
- **D-03:** Build job depends on lint, test, and format passing. Deploy job depends on all three checks + build
- **D-04:** Add a `format` job running `npx prettier --check .` -- SViewer enforces formatting as a quality gate (tka reference repo did not have this)
- **D-05:** Use official GitHub Actions for Pages deployment: `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`
- **D-06:** Deploy job requires permissions: `contents: read`, `pages: write`, `id-token: write`
- **D-07:** Deploy environment named `github-pages` with URL output from deployment step
- **D-08:** Concurrency group `pages` with `cancel-in-progress: true` on the deploy job
- **D-09:** Top-level workflow concurrency: `group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`
- **D-10:** Dynamic `base` path in `vite.config.ts` using `resolvePagesBase()` function that reads `GITHUB_REPOSITORY` env var to extract repo slug -- returns `/{repo-name}/` in CI, `/` locally
- **D-11:** Handle `.github.io` repos (return `/` instead of `/{slug}/`)
- **D-12:** No build env vars (VITE_GIT_COMMIT_SHA, VITE_GITHUB_RUN_NUMBER) -- keep workflow simple, no version display needed
- **D-13:** Node.js 22, npm cache enabled via `actions/setup-node@v6`
- **D-14:** Use `npm ci` for deterministic installs in CI

### Claude's Discretion
- Exact job ordering optimizations (parallel vs sequential for lint/test/format)
- Whether to add a deployment summary step
- Any minor workflow YAML formatting preferences

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **Stack:** React + TypeScript + Vite (client-side only)
- **Quality gates:** `vitest run`, `prettier --check .`, `eslint .` must all pass before committing
- **Conventional commits:** `feat:`, `fix:`, `chore:`, etc.
- **Git:** Small, focused commits preferred

## Standard Stack

### GitHub Actions (Workflow Infrastructure)
| Action | Version | Purpose | Why Standard | Confidence |
|--------|---------|---------|--------------|------------|
| actions/checkout | @v6 | Clone repo | Official, current per Vite docs. v6 released Nov 2024 with Node 24 support. [VERIFIED: github.com/actions/checkout/releases] | HIGH |
| actions/setup-node | @v6 | Install Node.js + npm cache | Official, current. v6 uses Node 24 runner. [VERIFIED: github.com/actions/setup-node] | HIGH |
| actions/configure-pages | @v5 | Configure Pages deployment | Official, current stable per Vite docs and ecosystem. v6 exists (Node 24 upgrade only) but not widely adopted. [VERIFIED: github.com/actions/configure-pages/releases] | HIGH |
| actions/upload-pages-artifact | @v4 | Upload dist/ to Pages artifact | Official, latest. v4 excludes dotfiles by default. [VERIFIED: github.com/actions/upload-pages-artifact/releases] | HIGH |
| actions/deploy-pages | @v4 | Deploy artifact to GitHub Pages | Official, current stable per Vite docs and ecosystem. v5 exists (Node 24 upgrade only) but not widely adopted. [VERIFIED: github.com/actions/deploy-pages/releases] | HIGH |

### Version Notes

The CONTEXT.md specifies `actions/checkout@v5` (matching the tka reference repo). However, the official Vite static deploy guide (fetched 2026-04-05) now uses `actions/checkout@v6`. **Recommendation: use @v6** since:
1. Official Vite docs recommend it [VERIFIED: vite.dev/guide/static-deploy]
2. v6 has been stable since Nov 2024 (5 months)
3. No breaking API changes -- only runtime upgrade to Node 24

For `configure-pages` and `deploy-pages`, v6/v5 exist respectively but are just Node 24 runtime bumps with no API changes. The Vite docs and ecosystem still use `@v5`/`@v4`. Stick with decided versions. [VERIFIED: vite.dev/guide/static-deploy, github.com releases]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Official Pages Actions | gh-pages npm package + custom deploy | More moving parts, requires PAT, not integrated with GitHub environments |
| `actions/checkout@v6` | `actions/checkout@v5` (as in tka ref) | v5 still works but is one major behind; Vite docs already moved to v6 |
| `configure-pages@v5` | `configure-pages@v6` | v6 is Node 24 runner only; no API change; too new for recommendation |

## Architecture Patterns

### Workflow File Structure
```
.github/
  workflows/
    ci-pages.yml          # Single workflow: CI + deploy
```

### Vite Config Modification
```
vite.config.ts            # Add resolvePagesBase() function + base: resolvePagesBase()
```

### Pattern 1: resolvePagesBase() Dynamic Base Path
**What:** A function in `vite.config.ts` that reads `GITHUB_REPOSITORY` env var at build time and returns the correct base path for GitHub Pages.
**When to use:** Always -- runs during `vite build` both locally and in CI.
**Example:**
```typescript
// Source: https://github.com/tkr41850-debug/tka/blob/main/vite.config.ts (adapted)
function resolvePagesBase(): string {
  const repositorySlug = process.env.GITHUB_REPOSITORY?.split('/')[1];

  // Local development or non-GitHub CI: use root
  if (!repositorySlug || process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }

  // User/org .github.io repos deploy to root
  if (repositorySlug.endsWith('.github.io')) {
    return '/';
  }

  // Project repos deploy to /<repo-name>/
  return `/${repositorySlug}/`;
}
```

### Pattern 2: Parallel CI Jobs with Gated Build
**What:** lint, test, and format jobs run in parallel. Build job uses `needs: [lint, test, format]` to gate on all three passing. Deploy uses `needs: [build]` (which transitively depends on all checks).
**When to use:** Standard CI pattern -- maximizes parallelism while ensuring quality gates pass before deployment.
**Example (job dependency graph):**
```
  lint ----\
  test -----+---> build ---> deploy (main only)
  format ---/
```

### Pattern 3: Conditional Deployment via GitHub Expression
**What:** Deploy job and Pages-specific build steps use `if:` conditions to only run on main branch pushes or workflow_dispatch.
**When to use:** Every GitHub Pages workflow that also runs CI on PRs/branches.
**Example:**
```yaml
deploy:
  if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
```

### Pattern 4: Top-Level Concurrency for Branch Dedup
**What:** `concurrency.group` keyed on `workflow + ref` cancels in-progress runs when new commits push to the same branch, preventing wasted CI minutes.
**When to use:** Always.
**Example:**
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Anti-Patterns to Avoid
- **Hardcoding base path:** Never use `base: '/sviewer/'` as a string literal. If the repo is forked or renamed, the deployment breaks silently. Use `resolvePagesBase()`.
- **Running deploy on PR branches:** GitHub Pages only has one deployment target. Deploying from a PR branch overwrites production. Always gate deploy to main.
- **Using `npm install` in CI:** Always use `npm ci` for deterministic, lockfile-only installs. `npm install` can update the lockfile.
- **Single monolithic job:** Putting lint+test+format+build in one job means a lint failure wastes time on the test/format steps. Parallel jobs fail fast.
- **Missing concurrency groups:** Without concurrency limits, multiple pushes to main can trigger overlapping deployments, potentially deploying an older commit after a newer one.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pages deployment | Custom rsync/scp/gh-pages push | actions/configure-pages + upload-pages-artifact + deploy-pages | Official pipeline handles OIDC auth, artifact management, environment URLs |
| Base path resolution | Hardcoded string or manual env var | `resolvePagesBase()` reading `GITHUB_REPOSITORY` | Handles root repos, project repos, local dev, and forks automatically |
| CI caching | Manual cache/restore steps | `actions/setup-node` with `cache: npm` | Built-in npm cache support is simpler and maintained by GitHub |
| Format checking | Custom script parsing prettier output | `npx prettier --check .` | Prettier's `--check` flag returns non-zero exit code on violations, perfect for CI |

## Common Pitfalls

### Pitfall 1: Missing base Path Causes Blank Page
**What goes wrong:** App deploys to `https://user.github.io/sviewer/` but all asset paths reference `/assets/...` instead of `/sviewer/assets/...`, resulting in 404s and a blank page.
**Why it happens:** Vite defaults `base` to `'/'`. GitHub Pages project repos serve from a subdirectory.
**How to avoid:** Use `resolvePagesBase()` which reads `GITHUB_REPOSITORY` and returns `/{repo-name}/`.
**Warning signs:** Blank page after deploy, 404 errors in browser devtools for JS/CSS assets.

### Pitfall 2: Forgotten GitHub Pages Settings
**What goes wrong:** Workflow runs but deploy step fails with permission error or "Pages not enabled" error.
**Why it happens:** GitHub Pages must be manually enabled in repo Settings > Pages > Source: GitHub Actions. This is a one-time manual step.
**How to avoid:** Document this as a prerequisite. The workflow alone does not enable Pages.
**Warning signs:** Deploy job fails with `Error: Ensure GitHub Pages has been enabled`.

### Pitfall 3: npm ci Fails Due to Missing package-lock.json
**What goes wrong:** `npm ci` requires `package-lock.json` to exist and be in sync with `package.json`. If the lockfile is missing or gitignored, CI fails.
**Why it happens:** Some developers gitignore lockfiles (bad practice for apps).
**How to avoid:** Ensure `package-lock.json` is committed. Check that it is NOT in `.gitignore`.
**Warning signs:** `npm ci` error: "npm ci can only install packages when your package-lock.json... is in sync".

### Pitfall 4: Prettier Check Fails on Generated/Planning Files
**What goes wrong:** `prettier --check .` scans ALL files including `.planning/` markdown or other non-source files, and fails.
**Why it happens:** Prettier defaults to checking every file it can parse.
**How to avoid:** Use `prettier --check .` which respects `.prettierignore`. The project already has `.prettierignore` excluding `.planning/`, `.claude/`, `node_modules/`, and `dist/`. [VERIFIED: .prettierignore in repo]
**Warning signs:** CI format job fails on files that aren't source code.

### Pitfall 5: Test Command Runs in Watch Mode
**What goes wrong:** CI hangs forever on the test step.
**Why it happens:** `vitest` without `run` flag starts in watch mode.
**How to avoid:** The project's `test` script is already `vitest run` which exits after one pass. [VERIFIED: package.json] The tka reference adds `-- --run` redundantly; for SViewer this is not needed since the npm script already includes `run`.
**Warning signs:** Test job never completes, hits GitHub Actions timeout (6 hours).

### Pitfall 6: Checkout v5 vs v6 Mismatch with Setup-Node v6
**What goes wrong:** Using older `checkout@v4` or `@v3` can cause subtle issues with newer action versions due to Node.js runtime differences.
**Why it happens:** Actions run on the runner's Node.js version, and newer actions may depend on features not available in older runtimes.
**How to avoid:** Use `checkout@v6` + `setup-node@v6` as the official Vite docs recommend. [VERIFIED: vite.dev/guide/static-deploy]
**Warning signs:** Cryptic errors in checkout or setup-node steps.

## Code Examples

### Complete resolvePagesBase() Function
```typescript
// Source: https://github.com/tkr41850-debug/tka/blob/main/vite.config.ts (adapted)
// Reads GITHUB_REPOSITORY env var (e.g., "user/sviewer") at build time
function resolvePagesBase(): string {
  const repositorySlug = process.env.GITHUB_REPOSITORY?.split('/')[1];

  if (!repositorySlug || process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }

  if (repositorySlug.endsWith('.github.io')) {
    return '/';
  }

  return `/${repositorySlug}/`;
}
```

### Updated vite.config.ts Structure
```typescript
// Source: existing project vite.config.ts + resolvePagesBase() from tka reference
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function resolvePagesBase(): string {
  const repositorySlug = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (!repositorySlug || process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }
  if (repositorySlug.endsWith('.github.io')) {
    return '/';
  }
  return `/${repositorySlug}/`;
}

export default defineConfig({
  base: resolvePagesBase(),
  plugins: [react(), tailwindcss()],
});
```

### CI Workflow Skeleton (Key Decisions Applied)
```yaml
# Source: adapted from https://github.com/tkr41850-debug/tka/.github/workflows/ci-pages.yml
# with additions per CONTEXT.md decisions D-01 through D-14
name: CI and Pages

on:
  pull_request:
  push:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run test

  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prettier --check .

  build:
    needs: [lint, test, format]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: actions/configure-pages@v5
        if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
      - run: npm run build
      - uses: actions/upload-pages-artifact@v4
        if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
        with:
          path: ./dist

  deploy:
    if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    concurrency:
      group: pages
      cancel-in-progress: true
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Format Job: Using npx vs npm Script
Two valid approaches for the format check:

**Option A: npx directly (simpler, matches tka pattern)**
```yaml
- run: npx prettier --check .
```

**Option B: Add npm script, call that (consistent with lint/test pattern)**
```json
// In package.json:
"format:check": "prettier --check ."
```
```yaml
- run: npm run format:check
```

**Recommendation:** Option B is cleaner -- it keeps CI commands consistent (`npm run lint`, `npm run test`, `npm run format:check`) and makes the quality gate discoverable in package.json for local use.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gh-pages` npm package + PAT token | Official `deploy-pages` Action + OIDC | 2022-2023 | No secrets needed, environment URLs, deployment history |
| `actions/checkout@v4` | `actions/checkout@v6` | Nov 2024 | Node 24 runner, minor perf improvements |
| Hardcoded `base: '/repo/'` in Vite | Dynamic `resolvePagesBase()` | Pattern from tka ref | Works across forks, renames, and `.github.io` repos |
| Sequential CI jobs | Parallel jobs + `needs` gates | Always available | 3x faster feedback (lint, test, format run simultaneously) |

**Deprecated/outdated:**
- `peaceiris/actions-gh-pages`: Community action. Still works but unnecessary when GitHub's official Actions are available and have better integration (environments, OIDC, deployment status).
- `actions/upload-artifact` + manual deploy: Replaced by the dedicated `upload-pages-artifact` action which handles Pages-specific packaging.
- `actions/checkout@v3`/`@v4`: Functional but behind; v6 is recommended by official Vite docs since early 2025.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `configure-pages@v5` is the correct stable version (not v6) | Standard Stack | Low -- v6 is only a Node runtime bump, not an API change. If v5 stops working, upgrading to v6 is trivial |
| A2 | `build` job should always run `npm run build` even on non-main branches (to verify the build succeeds) | Architecture Patterns | Low -- D-03 says build depends on checks; the `if:` conditions are only on configure-pages/upload steps, not the build itself. Matches tka reference. [ASSUMED] |
| A3 | Adding `format:check` script to package.json is preferred over bare `npx prettier --check .` in CI | Code Examples | No risk -- either approach works; this is a style preference [ASSUMED] |

## Open Questions

1. **Should `actions/checkout@v6` override the tka reference's `@v5`?**
   - What we know: Official Vite docs use `@v6`. The tka reference uses `@v5`. Both work. v6 has been stable for 5 months.
   - What's unclear: Whether the CONTEXT.md intent was to pin to v5 specifically, or just to match the tka reference at time of discussion.
   - Recommendation: Use `@v6`. The CONTEXT.md does not explicitly lock checkout version -- it only locks `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`. The reference to `actions/setup-node@v6` in D-13 already uses v6, so v6 for checkout is consistent.

2. **Should a `format:check` npm script be added to package.json?**
   - What we know: D-04 says `npx prettier --check .`. No existing `format:check` script in package.json.
   - What's unclear: Whether to add a script for consistency.
   - Recommendation: Add `"format:check": "prettier --check ."` to package.json. This makes all CI jobs call `npm run <script>`, makes the gate discoverable locally, and doesn't conflict with the decision.

3. **Manual prerequisite: GitHub Pages must be enabled in repo settings**
   - What we know: The workflow requires Pages to be enabled with "GitHub Actions" as the source.
   - What's unclear: Whether this is already configured for the sviewer repo.
   - Recommendation: Document this as a one-time setup step. Cannot be automated via the workflow.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test locally | Yes | 22.22.2 | -- |
| npm | Package install | Yes | 10.9.7 | -- |
| package-lock.json | npm ci in CI | Needs verification | -- | Run `npm install` locally to generate if missing |
| GitHub Actions | CI workflow | Yes (cloud service) | ubuntu-latest | -- |
| GitHub Pages | Deployment target | Yes (cloud service, needs repo setting) | -- | -- |

**Missing dependencies with no fallback:**
- None. All tools are available locally for testing. Cloud services (Actions, Pages) are GitHub-hosted.

**Missing dependencies with fallback:**
- `package-lock.json`: Must exist and be committed for `npm ci` to work. If missing, `npm install` will generate it.

## Sources

### Primary (HIGH confidence)
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy) -- Official workflow YAML, action versions, base path docs
- [tka reference ci-pages.yml](https://github.com/tkr41850-debug/tka) -- Fetched via raw.githubusercontent.com, full workflow verified
- [tka reference vite.config.ts](https://github.com/tkr41850-debug/tka) -- Fetched, resolvePagesBase() function verified
- [actions/checkout releases](https://github.com/actions/checkout/releases) -- v6.0.2 confirmed (Jan 2025)
- [actions/setup-node](https://github.com/actions/setup-node) -- v6 confirmed current
- [actions/configure-pages releases](https://github.com/actions/configure-pages/releases) -- v5.0.0 (Mar 2024), v6.0.0 (Mar 2025, Node 24 only)
- [actions/upload-pages-artifact releases](https://github.com/actions/upload-pages-artifact/releases) -- v4.0.0 confirmed (Aug 2024)
- [actions/deploy-pages releases](https://github.com/actions/deploy-pages/releases) -- v4.0.5 confirmed, v5.0.0 (Mar 2025, Node 24 only)
- [Existing project files] -- package.json, vite.config.ts, eslint.config.mjs, .prettierrc.json, .prettierignore verified via Read tool

### Secondary (MEDIUM confidence)
- [GitHub Pages deprecation notice](https://github.blog/changelog/2024-12-05-deprecation-notice-github-pages-actions-to-require-artifacts-actions-v4-on-github-com/) -- Confirms v4 is minimum required for Pages artifact actions

### Tertiary (LOW confidence)
- None. All claims verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Official GitHub Actions with verified versions, official Vite docs cross-referenced
- Architecture: HIGH -- Pattern directly adapted from working reference implementation (tka repo)
- Pitfalls: HIGH -- Well-documented failure modes from official docs and community discussions
- Vite base path: HIGH -- Verified against both tka reference and official Vite deploy guide

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days -- GitHub Actions and Vite are stable, versions unlikely to break)
