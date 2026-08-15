# Contents Index Page Override — MyNews Editorial CMS

> Overrides MASTER.md for the **Contents Index** (daftar/inventori artikel). Uses the project's established editorial tokens (`resources/css/app.css`). Purpose: **pindai cepat — apa yang ada, apa yang macet, apa yang perlu dikerjakan.**

## Page Purpose
Editorial board inventory: recognize articles visually, see status + urgency at a glance, act per row.

## Layout
- **PageHeader** (eyebrow + title + one primary CTA "Konten Baru")
- **Breadcrumbs** (Konten)
- **Toolbar**: search (debounced 300ms, live, clear button) + status select + category select
- **Responsive inventory**:
  - `< md`: card grid (`ContentRowCard` — thumbnail 64px, Newsreader title, badges, relative time, per-row actions)
  - `≥ md`: table with thumbnail, sortable columns (Judul/Status/Diperbarui), per-row actions (Buka/Hapus)

## Visual Language
- Thumbnail: 40px/64px rounded, `object-cover`, placeholder = `FileText` icon on `bg-muted`.
- Title: `font-display` (Newsreader) semibold, truncate.
- Status: reuse `StatusBadge` tokens (draft/review/approved/published/archived).
- Urgency badges (text + color, never color alone):
  - `Breaking` → `bg-primary/10 text-primary`
  - `Pilihan Editor` → `bg-accent/10 text-accent`
  - `Terbit hari ini` → `bg-success/10 text-success`
  - `Terjadwal` → `bg-warning/10 text-warning`
- Relative time (`relativeTime` helper): menit/jam/hari lalu; date absolut via `title` tooltip.
- Numbers: plain `tabular-nums`, small "No" column `text-muted-foreground`.

## Interactions
- Sortable headers: buttons with `aria-sort` (ascending/descending/none) + ArrowUp/Down/ArrowUpDown icons.
- Delete: `ConfirmDialog` (destructive), hidden if `can.delete = false`.
- Empty state: CTA "Konten Baru" if permitted.

## Accessibility
- `role="grid"` + `scope="col"` on desktop table.
- Every icon button has `aria-label` (Buka/Edit/Hapus) + file name.
- Thumbnail `alt=""` decorative (redundant with title text link).
- Search input `aria-label="Cari judul konten"`, clear button `aria-label`.
- Focus-visible ring on clickable cells.

## Motion
- Row hover `bg-muted/30` 200ms; card hover shadow 200ms; no layout shift on flag insertion.

## Anti-Patterns
- ❌ Hidden breaking/editor-pick as tiny inline text lost in truncated title (WAS: fixed → badges).
- ❌ Color-only status (use label + color).
- ❌ Search that requires Enter (debounce applied).
- ❌ Wide table on mobile (cards below md).