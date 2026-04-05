---
status: partial
phase: 02-time-series-graph-theme
source: [02-VERIFICATION.md]
started: 2026-04-05T10:15:00Z
updated: 2026-04-05T10:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Visual Graph Rendering
expected: Full-viewport graph with time on X-axis, deltaY on Y-axis, dashed threshold line at 15%, green/red area fills, gray screen-off bands, and tooltip on hover
result: [pending]

### 2. Threshold Control Interaction
expected: Threshold line moves on the chart when value changed, values convert correctly between % and px units
result: [pending]

### 3. Minimap Brush-to-Zoom
expected: Main chart zooms to selected range; clicking outside brush resets to full range
result: [pending]

### 4. Load New File Navigation
expected: Returns to upload page (idle state)
result: [pending]

### 5. Responsive Layout Below 640px
expected: ThresholdControl moves above chart, minimap collapses to range slider
result: [pending]

### 6. Dark Mode Theme Toggle
expected: All chart colors update when system dark/light mode changes
result: [pending]

### 7. Tooltip Hover Details
expected: Tooltip shows timestamp (HH:MM:SS), signed deltaY value, and posture state badge
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
