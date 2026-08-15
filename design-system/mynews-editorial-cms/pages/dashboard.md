# Dashboard Page Override — MyNews Editorial CMS

> Overrides MASTER.md for the **Dashboard** page. Uses the project's established editorial tokens (`resources/css/app.css`), which the Master file's generic generator palette does not reflect. These are the project's source of truth.

---

## Page Purpose
At-a-glance editorial operations: **signal what needs the newsroom's attention now, and what's about to publish.**

## Page-Specific Tokens

| Role | Value | CSS Variable (project) |
|------|-------|------------------------|
| Primary (news red) | `#b01e23` | `--color-primary` |
| Accent (link blue) | `#1e40af` | `--color-accent` |
| Background (cream) | `#f6f4ef` | `--color-background` |
| Card | `#ffffff` | `--color-card` |
| Muted | `#ece9e1` | `--color-muted` |
| Muted Foreground | `#565e6b` | `--color-muted-foreground` |
| Border | `#e0dbd0` | `--color-border` |
| Status: Draft | `#64748b` | `--color-draft` |
| Status: Review | `#b45309` | `--color-review` |
| Status: Approved | `#1e40af` | `--color-approved` |
| Status: Published | `#15803d` | `--color-published` |
| Status: Archived | `#64748b` | `--color-archived` |

## Typography
- Display/headline: **Newsreader** (`--font-display`) for the "Terbit Hari Ini" hero number & section titles.
- UI/body: **Inter** (`--font-sans`).
- Metric values: `font-display text-4xl tabular-nums`.

## Layout (12-col grid on xl)
```
PageHeader (eyebrow + title + primary CTA)
Breadcrumbs
[BIG metric row: Terbit Hari Ini hero + 3 supporting metrics with deltas]   (1-2 cols each → 4-up)
[ Editorial Funnel (draft→…→published/archived, biggest dropoff flagged) ] [ Upcoming publications ✓  ]
[ Konten terbaru / role-aware queue (2/3)                                 ] [ Activity timeline  (1/3) ]
```

## Signature Element
**Editorial Funnel** — compact horizontal segmented bar with per-stage counts and conversion % between stages. Biggest stage-to-stage drop-off highlighted (ring + "Perlu perhatian" affordance linking to `/review` or `/contents`). Encodes the editorial pipeline truthfully; keeps labels + counts visible (not color alone).

## Chart Accessibility (required)
- Stages labeled with name + count always visible.
- Drop-off shown as text (e.g., `−40% di sini`), not color alone.
- Alternative representation = the counts themselves are the table (no hidden canvas-only chart).

## Motion
- 200–250ms subtle transitions only. No scale-translate on cards. Respect `prefers-reduced-motion`.

## Anti-Patterns
- ❌ Not making "Menunggu Review" actionable (no link to `/review`).
- ❌ Showing counts without trend/delta (vs yesterday / last week).
- ❌ Color-only funnel segments — always pair with count text + descriptive label.