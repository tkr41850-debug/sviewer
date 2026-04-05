---
phase: "05"
phase_name: "Export & Polish"
status: draft
created: "2026-04-05"
revised: "2026-04-05"
design_system: manual (Tailwind v4 + CSS custom properties)
---

# UI Design Contract: Phase 05 — Export & Polish

## 1. Design System State

**Tool:** None (no shadcn). Project uses Tailwind CSS v4 with CSS-first config and oklch custom properties in `src/index.css`.

**Icon library:** lucide-react (already installed). Icons used this phase: `Download`, `Copy`, `Check`, `X`, `Keyboard`, `ChevronDown`.

**PNG library:** html-to-image (`^1.11.x`). Modern fork of dom-to-image with TypeScript support, multiple output formats, better font/SVG handling. Lighter and faster than html2canvas. Use `toPng()` to capture dashboard DOM node.

**Established patterns carried forward from Phase 01/02:**
- Inline `style={{ color: 'var(--color-*)' }}` for theme-aware colors
- Tailwind utility classes for layout, spacing, border-radius
- `clsx` for conditional class composition
- `aria-live`, `role`, `sr-only` for accessibility
- CSS custom properties resolved via `useCSSVar()` hook (Phase 2) for chart colors
- React Context + useReducer for state management (DataProvider)

---

## 2. Spacing

**Scale:** 8-point grid (unchanged from Phase 01/02). All spacing multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon-to-label gap inside dropdown items, toast icon gap |
| `sm` | 8px | Dropdown item vertical padding, toast internal padding, modal close button inset |
| `md` | 16px | Dropdown padding, modal section gaps, export button padding |
| `lg` | 24px | Modal internal padding, help grid row spacing |
| `xl` | 32px | Modal max-width inset from viewport edge |

**Touch targets:** 44px minimum height for all interactive elements (export button, dropdown items, copy link button, modal close button).

**Export button dimensions:** 44px height, horizontal padding 16px left + 8px right (icon + label + chevron).

**Dropdown menu:** 8px vertical padding inside the menu container. Each item 44px height with 16px horizontal padding.

**Help modal:** Max-width 560px, centered horizontally and vertically. Internal padding 24px. On screens below 640px, modal fills width minus 32px (16px each side).

**Key toast:** 8px padding all sides, positioned 16px from bottom-right corner.

---

## 3. Typography

**Font family:** System font stack via Tailwind default (`font-sans`). No custom fonts.

**Weights used this phase:** 2 weights only -- 400 (regular) and 600 (semibold).

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body / labels | 14px | 400 (regular) | 1.5 | Dropdown item labels, modal body text, toast message text |
| Heading | 16px | 600 (semibold) | 1.3 | Modal title ("Keyboard Shortcuts"), shortcut group headings |
| Key badge | 13px | 600 (semibold) | 1.0 | Keyboard key badges inside help modal and key toast |
| Description | 13px | 400 (regular) | 1.4 | Shortcut action descriptions in help modal, toast action label |

**Key badge styling:** Inline `<kbd>` element. 13px semibold, monospace font stack (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`). Background `--color-surface`, border `--color-border`, border-radius 4px, padding 2px 6px. Minimum width 24px, centered text.

---

## 4. Color

### Existing Tokens (from `src/index.css`, established Phase 01)

All existing color tokens remain unchanged. No new CSS custom properties needed for Phase 5.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-bg` | `oklch(98% 0 0)` | `oklch(12% 0 0)` | Page background (60% dominant) |
| `--color-surface` | `oklch(94% 0 0)` | `oklch(18% 0 0)` | Dropdown bg, modal bg, toast bg, key badges (30% secondary) |
| `--color-accent` | `oklch(55% 0.2 250)` | `oklch(65% 0.18 250)` | Export button bg, "Copy link" button bg, focus rings |
| `--color-destructive` | `oklch(55% 0.22 25)` | `oklch(65% 0.2 25)` | Not used this phase (no destructive actions) |
| `--color-border` | `oklch(85% 0 0)` | `oklch(28% 0 0)` | Dropdown border, modal border, key badge border, dividers |
| `--color-text-primary` | `oklch(15% 0 0)` | `oklch(92% 0 0)` | Dropdown item text, modal title, shortcut descriptions |
| `--color-text-secondary` | `oklch(45% 0 0)` | `oklch(60% 0 0)` | Shortcut group headings, toast text, "Copied!" feedback |

### Color Application (60/30/10 Split)

- **60% dominant:** `--color-bg` -- page background, modal backdrop dim layer
- **30% secondary:** `--color-surface` -- dropdown panel, modal panel, toast background, key badges
- **10% accent:** `--color-accent` reserved for: Export button fill, Copy Link button fill, focus rings on all interactive elements, "Copied!" check icon

### Modal Backdrop

- Backdrop color: `oklch(0% 0 0 / 0.5)` (50% black overlay) in both light and dark modes
- Backdrop click dismisses the modal

### Toast Styling

- Key toast background: `--color-surface` with `--color-border` border, 1px solid
- Drop shadow: `0 2px 8px oklch(0% 0 0 / 0.12)` (light), `0 2px 8px oklch(0% 0 0 / 0.4)` (dark)
- Border-radius: 8px

---

## 5. Layout

### Export Controls Placement

Export button and Copy Link button render in a toolbar row positioned **above the hero graph**, right-aligned. This toolbar is only visible when `status === 'loaded'`.

```
+---------------------------------------------------------------+
|                                         [Copy Link] [Export v] |  <- toolbar row
|  +---------------------------------------------------+        |
|  |              Hero Graph (Phase 2)                  |        |
|  +---------------------------------------------------+        |
|  |              Minimap (Phase 2)                     |        |
|  +---------------------------------------------------+        |
|  |              Dashboard (Phase 3)                   |        |
|  +---------------------------------------------------+        |
+---------------------------------------------------------------+
```

**Toolbar row:**
- Height: 48px (44px button + 2px vertical centering buffer)
- Horizontal padding: matches graph horizontal padding (24px, 16px below 640px)
- Buttons right-aligned via `justify-end` flexbox
- Gap between buttons: 8px
- Margin-bottom to graph: 8px

### Export Dropdown (opened)

```
+-------------------+
| [Export v]        |  <- trigger button
+-------------------+
| Records CSV       |  44px item
| Metrics CSV       |  44px item
|-------------------|  1px divider
| Dashboard PNG     |  44px item
+-------------------+
```

**Dropdown panel:**
- Width: 200px minimum, auto-expands to content
- Position: anchored below trigger button, right-aligned to button's right edge
- Background: `--color-surface`
- Border: 1px solid `--color-border`
- Border-radius: 8px
- Box shadow: `0 4px 16px oklch(0% 0 0 / 0.12)` (light), `0 4px 16px oklch(0% 0 0 / 0.4)` (dark)
- Vertical padding: 8px top and bottom
- Z-index: 50 (above chart, below modal)

### Help Modal (? shortcut)

```
+---------------------------------------------------------------+
|  [dim backdrop, 50% black]                                    |
|                                                               |
|   +-------------------------------------------+               |
|   |  Keyboard Shortcuts              [X]      |  heading row  |
|   |-------------------------------------------|               |
|   |  Navigation                               |  group heading|
|   |  [<-] [->]     Pan chart left/right       |               |
|   |  [+]  [-]      Zoom in/out                |               |
|   |  [r]           Reset zoom                 |               |
|   |-------------------------------------------|               |
|   |  App                                      |  group heading|
|   |  [t]           Toggle theme               |               |
|   |  [?]           Toggle this help           |               |
|   |  [Esc]         Close modal                |               |
|   +-------------------------------------------+               |
|                                                               |
+---------------------------------------------------------------+
```

**Modal panel:**
- Max-width: 560px
- Centered horizontally and vertically (flexbox on backdrop)
- Background: `--color-surface`
- Border: 1px solid `--color-border`
- Border-radius: 12px
- Box shadow: `0 8px 32px oklch(0% 0 0 / 0.2)` (light), `0 8px 32px oklch(0% 0 0 / 0.5)` (dark)
- Close button: 32x32px, top-right corner, 12px inset from edge

**Shortcut grid:**
- Two columns: key badge(s) on left (120px fixed width), description on right (flex-1)
- Row height: 36px (compact, since these are read-only display rows)
- Group heading divider: 1px solid `--color-border` with 16px vertical margin

### Key Toast (bottom-right corner)

```
+--------------------+
| [r] Reset zoom     |
+--------------------+
```

- Position: fixed, bottom 16px, right 16px
- Z-index: 40 (above chart, below dropdown and modal)
- Max-width: 240px
- Padding: 8px 12px
- Border-radius: 8px

### Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| >= 640px | Toolbar row above graph, dropdown opens below-right, modal at 560px max-width |
| < 640px | Toolbar row stacks or shrinks to icon-only buttons (tooltip on hover for labels), dropdown opens below-right at full-width minus 32px, modal fills width minus 32px |

---

## 6. Component Inventory

### New Components (Phase 5)

| Component | Path | Purpose |
|-----------|------|---------|
| `ExportDropdown` | `src/components/export/ExportDropdown.tsx` | Trigger button + dropdown menu with CSV/PNG export options |
| `CopyLinkButton` | `src/components/export/CopyLinkButton.tsx` | Button that copies current URL (with hash state) to clipboard, shows "Copied!" feedback |
| `useExportCSV` | `src/hooks/useExportCSV.ts` | Hook that generates and triggers download of records CSV or metrics CSV |
| `useExportPNG` | `src/hooks/useExportPNG.ts` | Hook that captures dashboard DOM node via html-to-image `toPng()` and triggers download |
| `useURLState` | `src/hooks/useURLState.ts` | Hook that syncs view state (range, threshold, engine) to/from URL hash fragment with 500ms debounce |
| `useKeyboardShortcuts` | `src/hooks/useKeyboardShortcuts.ts` | Global keydown listener with input guard; dispatches actions for pan, zoom, reset, theme toggle, help |
| `HelpModal` | `src/components/help/HelpModal.tsx` | Centered modal overlay showing keyboard shortcuts in a two-column grid |
| `KeyToast` | `src/components/feedback/KeyToast.tsx` | Brief bottom-right toast showing key + action name, auto-dismisses after 1 second |
| `Toolbar` | `src/components/layout/Toolbar.tsx` | Right-aligned button row above the graph, contains ExportDropdown and CopyLinkButton |

### Modified Components

| Component | Change |
|-----------|--------|
| `App.tsx` | Wrap loaded view with `Toolbar` above graph. Add `useKeyboardShortcuts` hook. Add `useURLState` hook. |
| `src/index.css` | Add `.theme-override-dark` and `.theme-override-light` classes for manual theme toggle (overrides system preference) |
| `DataProvider` (dataStore.tsx) | Add view state fields: `themeOverride: 'system' \| 'light' \| 'dark'`, `helpModalOpen: boolean`, `keyToast: { key: string, action: string } \| null` |

### Component Hierarchy

```
App
  DataProvider
    ThemeProvider (Phase 2, modified for manual override)
      status === 'idle'|'loading'|'error' -> UploadPage (existing)
      status === 'loaded' ->
        Toolbar (right-aligned)
          CopyLinkButton
          ExportDropdown
        GraphView (Phase 2)
        Dashboard (Phase 3)
        HelpModal (conditional on helpModalOpen)
        KeyToast (conditional on keyToast !== null)
    useKeyboardShortcuts (attached at App level)
    useURLState (attached at App level)
```

---

## 7. Interaction Contracts

### 7.1 Export Dropdown

| Interaction | Behavior |
|-------------|----------|
| Click Export button | Toggle dropdown open/closed |
| Click outside dropdown | Close dropdown |
| Press Escape while dropdown open | Close dropdown, return focus to trigger button |
| Click "Records CSV" | Generate CSV from `ChartData.fullRecords`, trigger browser download, close dropdown |
| Click "Metrics CSV" | Generate CSV from computed metrics object, trigger browser download, close dropdown |
| Click "Dashboard PNG" | Capture dashboard DOM node via `toPng()`, trigger browser download as PNG, close dropdown |
| Keyboard navigation in dropdown | Arrow keys move focus between items, Enter activates focused item, Tab closes dropdown |
| Export in progress (PNG) | Item shows a small spinner replacing the icon for the duration of the capture (~1-3s). Other items remain clickable. |

### 7.2 Copy Link Button

| Interaction | Behavior |
|-------------|----------|
| Click "Copy link" | Copy `window.location.href` (includes hash state) to clipboard via `navigator.clipboard.writeText()` |
| Success feedback | Button label changes from "Copy link" to "Copied!" with a check icon for 2 seconds, then reverts |
| Clipboard API unavailable | Fall back to creating a hidden textarea, select, `document.execCommand('copy')`. If that also fails, show "Copy failed" for 2 seconds. |

### 7.3 URL State Sync

| Interaction | Behavior |
|-------------|----------|
| User changes view state (zoom, threshold, engine) | After 500ms debounce, update `window.location.hash` with encoded state. Uses `replaceState` (not `pushState`) to avoid polluting browser history. |
| Page load with hash fragment | Parse hash params and apply as initial view state after data loads. Hash params: `range` (start-end timestamps), `threshold` (value + unit), `engine` (recharts/visx) |
| No hash on URL | Use default view state (full range, 15% threshold, recharts engine) |
| Hash conflicts with data param | No conflict possible -- `?data=` in query string, view state in `#hash` fragment (D-08) |

### 7.4 Keyboard Shortcuts

| Key | Action | Feedback Toast |
|-----|--------|----------------|
| `ArrowLeft` | Pan chart left by 10% of visible range | `<- Pan left` |
| `ArrowRight` | Pan chart right by 10% of visible range | `-> Pan right` |
| `+` or `=` | Zoom in by 20% (shrink visible range around center) | `+ Zoom in` |
| `-` | Zoom out by 20% (expand visible range around center) | `- Zoom out` |
| `r` | Reset zoom to full data range | `r Reset zoom` |
| `t` | Cycle theme: system -> light -> dark -> system | `t Toggle theme` |
| `?` | Toggle help modal open/closed | No toast (modal is the feedback) |
| `Escape` | Close help modal (if open), close dropdown (if open) | No toast |

**Input guard:** All shortcuts are suppressed when the active element is an `<input>`, `<textarea>`, or `<select>`, or any element with `contenteditable="true"`.

### 7.5 Help Modal

| Interaction | Behavior |
|-------------|----------|
| Press `?` | Open modal if closed, close if open |
| Press `Escape` | Close modal |
| Click backdrop | Close modal |
| Click X button | Close modal |
| Focus trap | Tab cycles through focusable elements within modal (close button only). Focus moves to close button on open; returns to previously focused element on close. |

### 7.6 Key Toast

| Interaction | Behavior |
|-------------|----------|
| Shortcut triggered | Toast appears at bottom-right with key badge + action text |
| Auto-dismiss | Toast fades out after 1000ms |
| Rapid successive shortcuts | New toast replaces current toast immediately (reset timer) |
| No interaction needed | Toast is informational only, not interactive |

---

## 8. States

### Export Dropdown States

| State | Condition | Visual |
|-------|-----------|--------|
| **Closed** | Default | Button shows "Export" label + chevron-down icon. Background `--color-accent`, text white. |
| **Open** | Dropdown visible | Chevron rotates 180 degrees. Dropdown panel visible below button. |
| **Item hover** | Mouse over dropdown item | Item background lightens/darkens subtly (8% opacity accent overlay) |
| **Item active** | Mousedown on item | Item background shows 15% opacity accent overlay |
| **PNG exporting** | html-to-image capture in progress | "Dashboard PNG" item shows spinner icon, other items still interactive |

### Copy Link Button States

| State | Condition | Visual |
|-------|-----------|--------|
| **Default** | Idle | Button shows Copy icon + "Copy link" label. Outlined style: transparent bg, `--color-border` border, `--color-text-primary` text. |
| **Hover** | Mouse over | Background `--color-surface` |
| **Copied** | After successful copy | Button shows Check icon + "Copied!" label in `--color-accent` text. Reverts after 2 seconds. |
| **Failed** | Clipboard API failed | Button shows "Copy failed" in `--color-text-secondary`. Reverts after 2 seconds. |

### Help Modal States

| State | Condition | Visual |
|-------|-----------|--------|
| **Closed** | Default | Not rendered (or `display: none`) |
| **Open** | `?` pressed or helpModalOpen is true | Backdrop fades in, modal scales up from 95% to 100% |
| **Closing** | Dismiss triggered | Backdrop fades out, modal scales down to 95%. Remove from DOM after animation. |

### Theme Override States

| State | Condition | Visual |
|-------|-----------|--------|
| **System** | Default (no override) | Follows `prefers-color-scheme` media query |
| **Light forced** | User pressed `t` once | `<html>` gets class `theme-override-light`. All CSS custom properties resolve to light values regardless of system preference. |
| **Dark forced** | User pressed `t` twice | `<html>` gets class `theme-override-dark`. All CSS custom properties resolve to dark values regardless of system preference. |
| **System (cycled back)** | User pressed `t` three times | Override classes removed, back to system preference. |

---

## 9. Copywriting

### Toolbar Labels

| Element | Copy | Notes |
|---------|------|-------|
| Export button label | `Export` | Paired with ChevronDown icon on right |
| Copy link button label | `Copy link` | Paired with Copy icon on left |
| Copied feedback | `Copied!` | Replaces "Copy link" for 2 seconds |
| Copy failed feedback | `Copy failed` | Replaces "Copy link" for 2 seconds |

### Dropdown Items

| Item | Copy | Icon |
|------|------|------|
| Records CSV | `Records CSV` | Download icon |
| Metrics CSV | `Metrics CSV` | Download icon |
| Dashboard PNG | `Dashboard PNG` | Download icon |
| PNG exporting | `Exporting...` | Spinner (replaces Download icon) |

### Help Modal

| Element | Copy |
|---------|------|
| Modal title | `Keyboard Shortcuts` |
| Navigation group heading | `Navigation` |
| App group heading | `App` |
| ArrowLeft description | `Pan chart left` |
| ArrowRight description | `Pan chart right` |
| Plus description | `Zoom in` |
| Minus description | `Zoom out` |
| R description | `Reset zoom` |
| T description | `Toggle theme` |
| Question mark description | `Toggle this help` |
| Escape description | `Close modal` |

### Key Toast

| Trigger | Toast Copy |
|---------|-----------|
| ArrowLeft | `[<-] Pan left` |
| ArrowRight | `[->] Pan right` |
| Plus | `[+] Zoom in` |
| Minus | `[-] Zoom out` |
| R | `[r] Reset zoom` |
| T | `[t] Toggle theme` |

### CSV File Headers

**Records CSV columns (in order):**
`timestamp,referenceY,currentY,deltaY,isSlouching,isScreenOff,sessionIndex`

- `timestamp` column uses ISO 8601 format (D-03)

**Metrics CSV columns:**
`metric,value,unit`

- One row per metric, e.g. `"Posture Score",78,"/100"`

### Filenames

| Export | Filename Pattern | Example |
|--------|-----------------|---------|
| Records CSV | `slouch-records-{YYYY-MM-DD}.csv` | `slouch-records-2026-04-05.csv` |
| Metrics CSV | `slouch-metrics-{YYYY-MM-DD}.csv` | `slouch-metrics-2026-04-05.csv` |
| Dashboard PNG | `slouch-dashboard-{YYYY-MM-DD}.png` | `slouch-dashboard-2026-04-05.png` |

Date in filename is derived from the data's start date (D-04).

### Empty/Edge States

| State | Copy |
|-------|------|
| No data loaded (export button not shown) | N/A -- toolbar only renders when `status === 'loaded'` |
| Metrics not computed yet | "Metrics CSV" item disabled, tooltip: `Metrics are still computing` |
| PNG capture fails | Toast: `Screenshot failed -- try again` |

### Error States

| Scenario | Copy |
|----------|------|
| CSV generation fails | Toast: `Export failed -- could not generate CSV` |
| PNG capture fails | Toast: `Screenshot failed -- try again` |
| Clipboard write fails | Button text: `Copy failed` (in-place, 2 seconds) |

Error copy pattern (consistent with Phase 01): **[What went wrong] -- [What to try next]**.

---

## 10. Accessibility

### Export Dropdown
- Trigger button: `aria-haspopup="true"`, `aria-expanded="false|true"`
- Dropdown menu: `role="menu"`
- Dropdown items: `role="menuitem"`, each with descriptive text as accessible name
- Arrow key navigation within menu (Up/Down to move, Enter to activate, Escape to close)
- Focus moves into menu on open, returns to trigger button on close

### Copy Link Button
- Standard `<button>` with visible label text
- `aria-live="polite"` region wrapping the button label so screen readers announce "Copied!" state change
- Focus ring: 2px solid `--color-accent`, 2px offset

### Help Modal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title element
- Focus trap: Tab cycles within modal. On open, focus moves to close button. On close, focus returns to previously focused element.
- `<kbd>` elements for key badges provide semantic keyboard key indication
- Escape key closes modal

### Key Toast
- `role="status"`, `aria-live="polite"` -- screen readers announce the shortcut feedback
- Not focusable (informational only)
- Auto-dismiss is acceptable for `aria-live="polite"` (content is supplementary)

### Keyboard Shortcuts
- Input guard: shortcuts suppressed in `<input>`, `<textarea>`, `<select>`, `[contenteditable]`
- All shortcuts use single, unmodified keys (no Ctrl/Alt/Meta required) for ease of use
- Theme toggle cycles through all three states, each announced via key toast

### Color Contrast
- All text on surface backgrounds meets WCAG AA (4.5:1 minimum for body text, 3:1 for UI components)
- Key badge text (semibold 13px) on surface background meets 3:1 minimum
- Accent-colored button text (white on accent) verified at 4.5:1 in both light and dark modes
- Copy/error state colors never rely on color alone -- text labels always present

### Reduced Motion
- `prefers-reduced-motion: reduce`: modal appears/disappears instantly (no scale/fade animation), toast appears/disappears instantly (no fade), dropdown appears instantly (no chevron rotation animation)

---

## 11. Theme Contract

### Theme Toggle Implementation (THME-04)

Phase 1/2 used `@media (prefers-color-scheme: dark)` only. Phase 5 adds manual override via the `t` keyboard shortcut.

**CSS strategy:**

```css
/* System preference (default, Phase 1 -- unchanged) */
@media (prefers-color-scheme: dark) {
  :root { /* dark values */ }
}

/* Manual override classes (Phase 5 addition) */
.theme-override-light {
  --color-bg: oklch(98% 0 0);
  --color-surface: oklch(94% 0 0);
  /* ... all light values ... */
}

.theme-override-dark {
  --color-bg: oklch(12% 0 0);
  --color-surface: oklch(18% 0 0);
  /* ... all dark values ... */
}
```

- Override classes applied to `<html>` element
- Override classes use higher specificity than `@media` (class on `:root` beats media query on `:root`)
- ThemeProvider (Phase 2) updated to read override state and expose `{ theme: 'light'|'dark', source: 'system'|'manual' }`
- Chart `useCSSVar()` hook continues to work unchanged -- it reads computed values, which update regardless of source

### Theme Cycle Order

`system` -> `light` -> `dark` -> `system` (repeat)

State stored in DataProvider (or ThemeProvider) as `themeOverride: 'system' | 'light' | 'dark'`.

---

## 12. Responsive Contract

| Breakpoint | Layout Change |
|------------|---------------|
| >= 640px | Toolbar shows full labels ("Export", "Copy link"). Dropdown 200px width. Help modal 560px max-width. |
| < 640px | Toolbar shows icon-only buttons (Download icon for Export, Copy icon for Copy link) with `title` attribute for label. Dropdown expands to `calc(100vw - 32px)`. Help modal fills `calc(100vw - 32px)`. Key toast unchanged (always compact). |

**Minimum dimensions:**
- Export button minimum: 44px x 44px (icon-only on mobile)
- Dropdown minimum width: 200px
- Help modal minimum width: 280px
- Key toast minimum width: 120px

---

## 13. Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Dropdown open | Opacity 0->1 + translateY(-4px -> 0) | 150ms | ease-out |
| Dropdown close | Opacity 1->0 + translateY(0 -> -4px) | 100ms | ease-in |
| Chevron rotation (open/close) | rotate(0 -> 180deg) | 150ms | ease-out |
| Modal open | Backdrop opacity 0->0.5 + panel scale(0.95 -> 1) + opacity 0->1 | 200ms | ease-out |
| Modal close | Backdrop opacity 0.5->0 + panel scale(1 -> 0.95) + opacity 1->0 | 150ms | ease-in |
| Key toast appear | Opacity 0->1 + translateY(8px -> 0) | 150ms | ease-out |
| Key toast disappear | Opacity 1->0 | 200ms | ease-in (starts at 800ms, completes at 1000ms) |
| "Copied!" feedback | Instant swap (no animation on text change) | 0ms | N/A |
| Export spinner | CSS rotate animation (continuous) | 700ms per rotation | linear |

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, all animations above become instant (0ms duration). Dropdown, modal, and toast appear/disappear without transition. Spinner is exempt (functional indicator, not decorative).

---

## 14. Registry

**shadcn:** Not applicable -- project does not use shadcn.

**Third-party registries:** None.

**Third-party UI component libraries:** None -- all components hand-rolled with Tailwind CSS v4.

---

## 15. Dependencies to Install

| Package | Version | Purpose |
|---------|---------|---------|
| `html-to-image` | `^1.11.11` | DOM-to-PNG capture for dashboard screenshot export. TypeScript-native, ~8KB gzipped. Uses `toPng(node)` API. |

No other new dependencies required. Existing dependencies cover all other needs:
- `date-fns` (installed) -- ISO 8601 timestamp formatting for CSV export
- `lucide-react` (installed) -- icons for export button, copy button, help modal
- `clsx` (installed) -- conditional class composition

---

## 16. URL Hash Encoding Scheme

### Parameter Format

Hash fragment uses `key=value` pairs separated by `&`:

```
#range=1712345678000-1712349278000&threshold=15p&engine=recharts
```

| Parameter | Format | Example | Default (if absent) |
|-----------|--------|---------|---------------------|
| `range` | `{startMs}-{endMs}` (Unix ms, hyphen separated) | `1712345678000-1712349278000` | Full data range |
| `threshold` | `{value}{unit}` where unit is `p` (percent) or `x` (pixels) | `15p` or `24x` | `15p` |
| `engine` | `recharts` or `visx` | `recharts` | `recharts` |

### Encoding Rules

- Values are NOT URL-encoded (all characters used are URL-safe within hash fragments)
- Unknown parameters are ignored (forward compatibility)
- Malformed parameters fall back to defaults (no error shown)
- Hash updates use `history.replaceState()` to avoid back-button pollution (D-09)
- Debounce: 500ms after last state change before writing hash (D-09)

---

_Contract created: 2026-04-05_
_Status: draft -- awaiting checker validation_
