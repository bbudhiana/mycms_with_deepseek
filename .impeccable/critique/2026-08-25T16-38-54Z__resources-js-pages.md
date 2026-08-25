---
target: MyNews Editorial CMS seluruh surface (resources/js/pages)
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 3
timestamp: 2026-08-25T16-38-54Z
slug: resources-js-pages
---
# Critique — MyNews Editorial CMS (resources/js/pages) — RE-RUN

Method: dual-agent (A: design review subagent · B: detector CLI + browser overlay)

## Design Health Score: 32/40 (+4)

| # | Heuristic | Prev | New | Notes |
|---|-----------|------|-----|-------|
| 1 | Visibility of System Status | 4 | 4 | unchanged |
| 2 | Match System / Real World | 3 | **4** | Stepper + dialog copy one Indonesian editorial vocab |
| 3 | User Control & Freedom | 3 | 3 | Undo paths exist; Arsipkan one-click residual |
| 4 | Consistency & Standards | 2 | **3** | ConfirmDialog default primary + CircleCheck; 10 callers explicit |
| 5 | Error Prevention | 3 | **4** | Publish gated, autosave retry sticky, dialogs carry counts |
| 6 | Recognition Rather Than Recall | 4 | 4 | unchanged |
| 7 | Flexibility & Efficiency | 2 | 2 | still no keyboard shortcuts |
| 8 | Aesthetic & Minimalist | 3 | 3 | type scale fixed (12/14px min) |
| 9 | Error Recovery | 2 | **3** | autosave sticky retry; RTE window.prompt remaining |
| 10 | Help & Documentation | 2 | 2 | Passkey dead-end + empty states residual |

Delta: +1 each on 2, 4, 5, 9. Real, not superficial — verified in code and browser.

## Design Specificity: AUTHENTICATED 70/30 (was 60/40)

Editorial risk language (publish/unpublish), Indonesian stepper, dark palette re-authored editorial, media library a11y-aware. Still generic: 4-up MetricCard template, single-tab Tabs, Welcome demo-roles leak.

## Strengths (post-fix)

1. Publish gate + undo framing (PublishDialog/UnpublishDialog)
2. ConfirmDialog semantics fixed globally
3. Autosave failure recovery (sticky + retry)
4. Dark mode done properly (initTheme, full token override)
5. Funnel math fixed (archived no drop-off)

## Priority Issues (forward)

[P1] window.prompt for link insertion (rich-text-editor.tsx:113-117) — native prompt breaks polished editor.
[P1] No dirty-discard guard in editor (Editor.tsx) — back/nav/publish dialog silently loses unsaved body.
[P2] Arsipkan one-click no confirm (Editor.tsx:562, 762-764).
[P2] WorkflowActions ordering by permission not decision.
[P2] Zero keyboard efficiency.
[P3] Passkey card documented dead-end (Security.tsx).
[P3] Editor single-tab Tabs.

## Detector CLI: 0 findings (unchanged)

## Browser overlay (3 views, vs previous)

| Finding | Dash prev→new | Review prev→new | Contents prev→new |
|---|---|---|---|
| tiny body text | 6→0 | 7→2 | 2→0 |
| undersized functional text | 8→8 | 0→0 | 16→18* |
| nested cards | 4→3 | 0→0 | 0→0 |
| line length too long | 1→1 | 0→0 | 0→0 |
| cramped padding | 0→0 | 0→0 | 1→1 |
| low contrast text | 0→1** | 0→2 | 0→0 |
| overused font | 93%→93% | 92%→91% | 92%→92% |
| kicker eyebrow | 1→1 | 2→2 | 1→1 |
| cream palette | 1→0 | 1→0 | 0→0 |
| layout animation | 1→1 | 1→1 | 0→0 |

* detector threshold stricter than 12px (interactive controls still flagged)
** Tolak ghost destructive bare text — known minor from review
