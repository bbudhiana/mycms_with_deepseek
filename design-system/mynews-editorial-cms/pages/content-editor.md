# Content Editor Page Override — MyNews Editorial CMS

> Overrides MASTER.md for the **Content Editor** (ruang tulis artikel). Uses project tokens (`resources/css/app.css`). Purpose: **tulis, organize dengan jelas, dan kirim ke alur editorial tanpa kehilangan konteks.**

## Page Purpose
Writing room for a single article: focused authoring + live SEO feedback + editorial workflow visibility.

## Layout
- **PageHeader** + **Breadcrumbs** (Konten → Konten Baru/Edit Konten)
- **2-column grid (`lg:grid-cols-3`)**
  - Main (2/3): Tabs "Tulis" → Judul, Sub Judul, Slug, Isi (RichTextEditor), Ringkasan, Embed Video
  - Sidebar (1/3): **Status Simpan**, **Pratinjau Hasil Pencarian**, **Alur Editorial**, Riwayat Persetujuan

## Signature Element
**Pratinjau Hasil Pencarian (live SEO card)** — mock Google result (title / url / description) that updates as user types title, slug, excerpt. Threshold hints: "Judul SEO baik / ideal 10–60", "Deskripsi baik / ideal 70–160".

## Key Components
- **Status Simpan** card: dirty-state badge `Belum disimpan` (warning) ↔ `Tersimpan` (muted) + "Terakhir disimpan HH:MM".
- **Slug** field: auto-generates from title (debounced 600ms); toggle button `Otomatis`/`Manual` (Link2 / Link2Off icons, `aria-pressed`); helper text when auto.
- **RichTextEditor**: read-only when not editable; autosave (2s debounce) with success/error status + word count + read time; updates body snapshot on success.
- **Alur Editorial**: light card (bg-card, not dark — fixed contrast bug), StatusBadge + WorkflowStepper + contextual action buttons.

## Workflow Actions (grouped by permission)
- Reviewer: Setujui (default) / Tolak (secondary)
- Publisher: Terbit + Jadwalkan (2-col) / Tarik Publikasi / Arsipkan
- Author (draft, own): Simpan + Kirim ke Review

## Accessibility
- All inputs paired with `<Label htmlFor>`.
- SEO preview wrapped in `aria-label="Pratinjau hasil pencarian Google"`.
- Tag chips ≥44px touch target, `aria-pressed`-style selected state via styling.
- RichTextEditor toolbar buttons have `aria-label`; status indicator `aria-live`.
- `<img>` in MediaField uses its name as alt (or empty alt for non-content thumbnails with adjacent text).

## Motion
- 200ms transitions; autosave indicator subtle; respect `prefers-reduced-motion`.

## Anti-Patterns
- ❌ Dead/non-functional UI (AI Assist placeholder removed — not a V1 feature).
- ❌ Slug left empty or causing surprises (auto-filled + manual lock).
- ❌ Saving without feedback (dirty + last-saved visible).