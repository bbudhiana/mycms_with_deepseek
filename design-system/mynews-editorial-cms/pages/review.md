# Review Page Override — MyNews Editorial CMS

> Overrides MASTER.md for the **Review** page (antrean editorial). Uses project tokens (`resources/css/app.css`). Purpose: **triage cepat — memahami isi artikel dan mengambil keputusan (setujui / minta revisi / tolak) tanpa keluar halaman.**

## Page Purpose
Editorial review board. Editor memindai backlog, melihat konteks (excerpt, thumbnail, lama menunggu), dan memutuskan per artikel secara aman.

## Layout
- **PageHeader** + **Breadcrumbs** (Review)
- **Summary strip**: jumlah menunggu + "tertua menunggu N jam/hari" + peringatan overdue (≥48 jam, disruptive-red, dengan teks bukan warna saja).
- **Antrean**:
  - `< md`: kartu (grid) — thumbnail 64px, judul Newsreader, meta, excerpt 2 baris, WaitBadge, aksi.
  - `≥ md`: tabel — Judul(+thumb 44px+excerpt), Kategori, Penulis, Menunggu, Aksi.
- **Signature**: **Inline Preview Dialog** — tampilkan `SafeHtml(body)` untuk menilai konten tanpa pergi ke `/contents/{id}`.
- **Riwayat keputusan** (10 terbaru): status, reviewer, aksi label, waktu relatif.

## Aksi (3 keputusan berbeda)
| Aksi | Variant | Perilaku |
|------|---------|----------|
| Setujui | `default` (primary) | Dialog afirmasi (check + info) → `POST /contents/{id}/approve`; langsung terapplied |
| Minta Revisi | outline success | Dialog **wajib catatan** → `POST .../request-changes`; kembali ke draft |
| Tolak | ghost destructive | Dialog **opsional** catatan + peringatan "kembali ke draft" |

Semua aksi memakai dialog konfirmasi (mencegah salah-klik); label dense & action verb cohesive ("Setujui"→toast "Konten disetujui").

## Visual Language
- Thumbnail: rounded, `object-cover`, placeholder `FileText`/`Image`.
- Judul: Newsreader semibold (list), truncate; body preview via SafeHtml.
- WaitBadge: `<48h` muted; `≥48h` destructive + teks "(terlambat)"; gunakan `relativeTime` utk <24h.
- Excerpt: `line-clamp-2`.

## Accessibility
- `role="grid"` + `scope="col"` tabel (dipasti di Fase sebelumnya).
- Dialog: label + `FieldError` untuk catatan; `aria-label` tombol ikon; focus-visible.
- StatusBadge selalu label teks + warna (bukan warna saja).
- `prefers-reduced-motion` (global); transisi 150–250ms.

## Anti-Patterns
- ❌ Setujui satu-klik tanpa konfirmasi & tanpa feedback loading (sudah diperbaiki via dialog).
- ❌ Catatan revisi opsional untuk "Minta Revisi" (harus wajib).
- ❌ Tampilkan queue tanpa konteks (thumbnail/excerpt/umur) — sudah diperbaiki.
- ❌ Tabel overflow di mobile (card `< md`).