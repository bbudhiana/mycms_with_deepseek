# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Super Admin** — pemilik sistem; akses penuh ke user, role, konten, media, taxonomy, workflow, audit. Menjaga keamanan dan konfigurasi awal.
- **Admin** — pengelola operasional CMS; mengatur user, kategori, tag, media, konten, publikasi harian. Tidak boleh mengambil alih kontrol Super Admin.
- **Editor** — penanggung jawab kualitas editorial; membuat/mengedit konten, meninjau submission, menyetujui/menolak/meminta revisi, menjadwalkan, mempublikasikan.
- **Author** — penulis konten; membuat draft, mengedit konten miliknya saat status editable, mengunggah media, memberi tag, submit ke review.
- **Viewer** — akun read-only minimal; login dan melihat area yang diizinkan tanpa kemampuan mengubah data.

Situasi kerja: tim editorial berita online, operasional harian via browser desktop/tablet (mobile tetap usable untuk review dan cek status cepat).

## Product Purpose

CMS internal berbasis Laravel + Inertia React untuk mengelola artikel, media, kategori, tag, user, role, dan proses persetujuan konten secara aman, dengan workflow editorial yang jelas: tidak ada konten terbit tanpa review, hak akses terkontrol, dan jadwal publikasi terpantau. Produk menjadi baseline untuk proyek CMS editorial sejenis.

## Positioning

Workflow editorial end-to-end yang ketat (draft → review → approved → published/archived) dengan quality gate wajib: 100% konten published melewati status `approved`; authorization berlapis (Spatie permission + Laravel policies) sebagai sumber kebenaran server-side, bukan sekadar gating UI; seluruh aksi bisnis terekam di activity log dan approval history.

## Operating Context

- Bahasa antarmuka: **Bahasa Indonesia** (seluruh copy UI, label, pesan, dokumentasi).
- Tools: login via Fortify (email verification wajib untuk akses internal), 2FA, passkey/WebAuthn, password reset.
- Alur kerja harian: author buat draft → submit → editor review (approve/reject/request changes) → publish sekarang atau terjadwal (`publish:scheduled` tiap menit).
- Upload media hingga 10MB (JPG/JPEG/PNG/WEBP/GIF/SVG/PDF), disimpan di `storage/app/public/media/YYYY/MM`, throttle 20 request/menit.
- Konten non-published tidak boleh diedit langsung saat status `review`, `approved`, `published`.
- HTML body disanitasi server-side (HTMLPurifier profile `cms_content`); rendering aman di frontend.

## Capabilities and Constraints

- Modul: auth & keamanan akun, editorial dashboard role-aware, content management (CRUD, search/filter/saved view/bulk selection UI, rich text editor, SEO preview, tag picker, media picker), editorial workflow, publishing (immediate/schedule/cancel/unpublish/archive), media library, category tree hierarkis, tag, user & role management, API terproteksi Sanctum, activity log, API docs.
- Roles: `super_admin`, `admin`, `editor`, `author`, `viewer`.
- Status konten: `draft`, `review`, `approved`, `published`, `archived`; transisi diperbolehkan sesuai matriks PRD.
- Per-page pagination: konten 15, user 20, media 24, tag 20.
- API protected `auth:sanctum` + `verified`; resource: users, addresses, categories, tags, media, contents + endpoint workflow/publish/approval-history.
- Non-goals MVP: public website rendering artikel, multi-tenant, visual page builder, analytics penuh, invite user backend, real-time collaborative editing, versioning, CDN/image transformation, monetization, AI content generation produksi (tab `AI Assist` ada di UI, belum fungsional).
- Invite user UI belum punya backend; tidak boleh tampil sebagai fitur berfungsi (sembunyikan atau label coming soon).

## Brand Commitments

- Nama produk: **MyNews** (editorial news CMS; dipakai di judul browser, layout, auth, welcome).
- Font: Newsreader (display/headline) + Inter (UI/body).
- Palet editorial: news red `#b01e23` (primary), link blue `#1e40af` (accent), background cream `#f6f4ef`, status colors per state (draft/review/approved/published/archived).
- Referensi desain terkunci: `design-system/mynews-editorial-cms/` (MASTER.md + page overrides) dan `resources/css/app.css` sebagai source of truth token.

## Evidence on Hand

- PRD lengkap: `PRD.md` (requirements, data model, workflow rules, permission matrix, security, performance, testing, roadmap).
- Catatan pengembangan: `docs/Perbaikan_01.txt` (action plan fase 1–4), `docs/Perbaikan_02.txt` (evaluasi UI/UX per modul + fitur last login yang sudah diimplementasikan).
- Design system: `design-system/mynews-editorial-cms/MASTER.md` + `pages/{dashboard,review,contents-index,content-editor}.md`.
- Implementasi nyata di `resources/js/pages/**`, `resources/css/app.css`, `app/Http/Controllers/**`, `routes/web.php`.
- Fitur "Terakhir Login" sudah ada: migration `last_login_at`, listener `app/Listeners/UpdateLastLoginAt.php` (terdaftar di `AppServiceProvider`), tampil di daftar user & settings profile.
- Tidak ada testimonial, pelanggan nyata, benchmark eksternal, atau press — jangan fabrikasi.

## Product Principles

1. **Quality gate dulu, kecepatan kedua** — tidak ada konten yang terbit tanpa status `approved`; reviewer tidak boleh approve karya sendiri.
2. **Server-side adalah sumber kebenaran** — authorization via policy/permission, bukan sekadar menyembunyikan tombol di UI; web dan API menerapkan aturan yang sama.
3. **Kerja editorial yang aman dan tervalidasi** — sanitasi HTML, validasi upload ketat, rate limit, audit trail untuk setiap aksi bisnis.
4. **Informatif, bukan sekadar tampil** — dashboard dan daftar menampilkan signal yang bisa ditindak (shortcut, delta/trend, label status + count, bukan warna saja).
5. **Satu bahasa, satu identitas** — seluruh antarmuka Bahasa Indonesia dengan identitas editorial MyNews yang konsisten.

## Accessibility & Inclusion

- Support desktop dan tablet editorial; mobile usable untuk review dan cek status.
- Focus states terlihat pada tombol dan form field.
- Aksi destruktif wajib konfirmasi dialog.
- Media butuh dukungan alt text.
- Status tidak boleh mengandalkan warna saja; label wajib.
- Motion hormati `prefers-reduced-motion`; transisi 150–300ms.
