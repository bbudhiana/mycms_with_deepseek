# PRD — MyNews Editorial CMS (Online News Content Management System)

> **Version:** 1.0
> **Date:** 2026-08-16
> **Status:** Baseline for reproduction by an AI agent
> **Purpose:** This document is a complete, sentence-level specification of the **MyNews Editorial CMS** — an internal online-news content management system. An AI agent using only this document (plus the stack versions referenced) must be able to reproduce the exact same product, feature-for-feature and pixel-for-pixel.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Personas](#3-user-personas)
4. [Access Control: Roles & Permissions](#4-access-control-roles--permissions)
5. [Functional Requirements](#5-functional-requirements)
6. [UI/UX & Design System](#6-uiux--design-system)
7. [Data Model](#7-data-model)
8. [Technical Architecture](#8-technical-architecture)
9. [API Specification](#9-api-specification)
10. [Security & Compliance](#10-security--compliance)
11. [Testing Requirements](#11-testing-requirements)
12. [Performance Requirements](#12-performance-requirements)
13. [Accessibility & Responsive Requirements](#13-accessibility--responsive-requirements)
14. [Non-Goals & Out of Scope](#14-non-goals--out-of-scope)
15. [Risks & Roadmap](#15-risks--roadmap)
16. [Reproduction Checklist for AI Agent](#16-reproduction-checklist-for-ai-agent)

---

## 1. Executive Summary

### 1.1 Problem Statement

News editorial teams need an **internal CMS** to manage articles, media, categories, tags, users, roles, and an **editorial approval workflow** in a secure way. Without a clear workflow, the newsroom risks: content published without review, excessive access rights, duplicated assets, broken scheduling, and no audit trail.

### 1.2 Proposed Solution

A Laravel 13 + Inertia.js v3 + React 19 (TypeScript) CMS called **"MyNews Editorial CMS"** with strong authentication, role-based access control, a rich-text article editor, a centralized media library, taxonomy management (hierarchical categories + tags), a 5-state editorial workflow (draft → review → approved → published → archived), scheduled publishing, audit activity logging, role/permission management, and a protected REST API with interactive API documentation.

### 1.3 Success Criteria (KPIs)

- 100% of internal pages are protected by `auth` + `verified` middleware.
- 100% of sensitive write actions are authorized server-side via Policies/Permissions (UI gating is never the only gate).
- 100% of published content passes through the `approved` status before manual or scheduled publication.
- Scheduled publishing processes due items every minute with failure rate < 1% on valid content.
- 100% pass rate of the feature test suite (`php artisan test --compact`) plus static quality gates listed in §11.

### 1.4 Product Name & Branding

| Item | Value |
|---|---|
| Product name | **MyNews** |
| Subtitle | Editorial CMS |
| Tagline | "Ruang redaksi yang tenang untuk cerita yang besar." |
| UI language | **Indonesian (Bahasa Indonesia)** — ALL UI strings, labels, toasts, errors, titles are Indonesian. |
| Route names / identifiers | English slug / names (e.g. `/contents`, `status`, `slug`). |

---

## 2. Product Overview

### 2.1 Modules

| Module | Route prefix | Purpose |
|---|---|---|
| Authentication & Security | `/login`, `/forgot-password`, `/register`, 2FA, passkeys | Fortify-based auth, email verification, password reset, 2FA, passkeys |
| Editorial Dashboard | `/dashboard` | Role-aware at-a-glance metrics, editorial funnel, upcoming publications, recent content, activity stream |
| Content Management | `/contents` | Article CRUD, rich text editor, SEO preview, workflow actions, approval history |
| Review Queue | `/review` | Triage submitted content: approve / request changes / reject with inline preview |
| Media Library | `/media` | Upload, browse grid/list, filter, edit alt text, copy URL/Markdown, delete, thumbnails |
| Category Management | `/categories` | Hierarchical (parent/child) taxonomy tree, inline create/edit |
| Tag Management | `/tags` | Flat taxonomy, usage analytics, comma-separated bulk create |
| User Management | `/users` | CRUD users, activate/deactivate, roles assignment, last login + last contribution |
| Roles & Permissions | `/roles` | Role CRUD, full permission matrix with column highlight, protected-role locking |
| User Addresses | `/users/{user}/addresses` | Admin-managed user mailing addresses |
| Settings | `/settings/profile`, `/settings/security`, `/settings/appearance` | Profile, security (2FA/passkeys), appearance |
| API & API Docs | `/api/*`, `/api-docs` | Sanctum-protected REST API + interactive docs |

### 2.2 Product Naming Conventions (must be reproduced exactly)

- **Status labels (UI):** `Draft`, `Menunggu Review`, `Disetujui`, `Terbit`, `Diarsip`.
- **Status keys (enum):** `draft`, `review`, `approved`, `published`, `archived`.
- **Workflow actions:** `Setujui`, `Tolak`, `Minta Revisi`, `Kirim ke Review`, `Terbit`, `Jadwalkan`, `Tarik Publikasi`, `Arsipkan`, `Batal Jadwal`.
- **Navigation groups:** "Editorial" (Dashboard, Konten, Review), "Perpustakaan" (Media, Kategori, Tag), "Administrasi" (Users, Roles & Izin, API Docs).
- **Breadcrumb labels:** Konten, Review, Dashboard, Kategori, Tag, Media, Pengguna, Peran & Izin, API Docs, Profil, Keamanan, Tampilan.

---

## 3. User Personas

| Persona | Role key | Responsibilities |
|---|---|---|
| Super Admin | `super_admin` | Full access to everything including users, roles, permissions, content, media, taxonomy, workflow, audit. Unrestricted via `Gate::before`. |
| Admin | `admin` | Operational CMS manager: manages users, categories, tags, media, content, publication. Cannot approve content and cannot change roles. |
| Editor | `editor` | Editorial quality owner: creates/edits content, reviews author submissions, approves/rejects/requests changes, schedules and publishes. |
| Author | `author` | Writes content: creates drafts, edits own content while editable, uploads media, organizes tags, submits to review. |
| Viewer | `viewer` | Read-only account: can log in and view permitted areas, can do nothing else. |

---

## 4. Access Control: Roles & Permissions

### 4.1 Permissions (15, version-controlled source of truth in seeder `RolePermissionSeeder`)

`login`, `manage_user`, `change_role`, `create_content`, `edit_any_content`, `edit_own_content`, `delete_content`, `approve_content`, `publish_content`, `manage_category`, `manage_tag`, `manage_media`, `upload_media`, `view_analytics`, `view_audit_log`.

### 4.2 Role × Permission matrix (exact)

| Permission | super_admin | admin | editor | author | viewer |
|---|---|---|---|---|---|
| login | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_content | ✅ | ✅ | ✅ | ✅ | — |
| edit_own_content | ✅ | ✅ | ✅ | ✅ | — |
| edit_any_content | ✅ | ✅ | ✅ | — | — |
| delete_content | ✅ | ✅ | — | — | — |
| approve_content | ✅ | — | ✅ | — | — |
| publish_content | ✅ | ✅ | ✅ | — | — |
| manage_category | ✅ | ✅ | ✅ | — | — |
| manage_tag | ✅ | ✅ | ✅ | — | — |
| manage_media | ✅ | ✅ | ✅ | — | — |
| upload_media | ✅ | ✅ | ✅ | ✅ | — |
| manage_user | ✅ | ✅ | — | — | — |
| change_role | ✅ | — | — | — | — |
| view_analytics | ✅ | ✅ | ✅ | — | — |
| view_audit_log | ✅ | ✅ | ✅ | — | — |

### 4.3 Gate supers

- `Gate::before` short-circuit: any user with role `super_admin` is granted **every** ability.
- `RolePolicy::update` requires the actor to have the `super_admin` role to edit the `super_admin` role; **nobody** can edit the `super_admin` role (hard `abort(403)` in `RoleManagementController`).
- `RolePolicy::delete` never allows deleting `super_admin` or any role that has ≥ 1 assigned user.

### 4.4 UI permission gates (`can` prop object per page)

Each page receives a `can` object from the controller. Buttons are omitted (styled not) when the permission is missing.

| Key | Permission |
|---|---|
| `can.create` / `can.createContent` | `create_content` |
| `can.delete` | `delete_content` |
| `can.approveContent` | `approve_content` |
| `can.publishContent` | `publish_content` |
| `can.manage` | `manage_category`/`manage_tag`/`manage_media`/`manage_user` (per module) |
| `can.manageUser` | `manage_user` |
| `can.changeRole` | `change_role` |
| `can.canUpload` | `upload_media` |

---

## 5. Functional Requirements

### 5.1 Authentication & Account Security

Backed by Laravel Fortify. All features enabled: `registration()`, `resetPasswords()`, `emailVerification()`, `updateProfileInformation()`, `updatePasswords()`, `twoFactorAuthentication(confirm: true, confirmPassword: true)`, `passkeys(confirmPassword: true)`. `username = email`, `lowercase_usernames = true`, home route `/dashboard`.

**Rate limiters (Fast RateLimits):**
- Login: 5/min keyed by `(transliterate(lower(email)) | ip)`.
- Two-factor: 5/min keyed by `session('login.id')`.
- Passkeys: 10/min keyed by `credential.id` (or session id) + `|` + ip.

**Functional requirements:**
- Guest can only see `welcome` (public landing) and auth screens (login, register, forgot/reset password, verify email, confirm password, 2FA challenge).
- All internal routes reject unauthenticated and unverified users.
- Email change in profile → sets `email_verified_at = null` and re-sends verification email.
- User profile photo is handled **custom** (NOT Fortify): routes `POST/DELETE /settings/profile-photo` store to `profile-photos/` on the public disk and persist `profile_photo_path`. Upload rule: `image|max:1024 KB`. UI hint: "JPG, PNG, atau WebP. Maksimal 1MB."
- **Last login tracking:** on Laravel `Login` event, `UpdateLastLoginAt` listener sets `users->last_login_at = now()` (dedupe — no-op if already equal to now). Displayed on user list ("Terakhir login") and Settings Profile ("Terakhir login" relative). User list keeps separate "Terakhir berkontribusi". Sortable by both.
- **Inactive users** (`is_active = false`) are blocked from accessing sensitive actions by policy checks (no global middleware).

**AC ✓, all:**
- Login with correct credentials succeeds → redirect `/dashboard`.
- Invalid login → error, throttled at 5/min.
- Email verification required before internal access.
- Password reset flow works via email link.
- 2FA QR code + recovery codes + challenge flow works.
- Passkey registration/login works when available.
- Last login timestamp updates on login and is shown in user list + profile.

---

### 5.2 Editorial Dashboard

**URL:** `GET /dashboard`

**Data (role-aware):**
- Non-editors (no role in `[super_admin, admin, editor]`) see ONLY their own data (`author_id = me`) for all metric/funnel/recent queries.
- Metrics: `published_today`, `published_yesterday`, `pending_review`, `scheduled_next_24h`, `drafts_updated_week`, `drafts_updated_prior_week`.
- Funnel counts by status: draft, review, approved, published, archived.
- Upcoming: pending `ScheduledPublish` with `scheduled_at > now`, limit 5.
- Recent contents: latest 10 by `updated_at`.
- Recent activity: `ActivityLogService::recent(10)`; non-editors scoped to their own user.

**UI structure (12-col grid):**
1. `PageHeader` — title: editor → "Ringkasan Ruang Redaksi"; else → "Selamat datang di Ruang Redaksi". Primary CTA: `can.createContent` → "Konten Baru"; else outline "Lihat Antrean Review".
2. Breadcrumbs `["Dashboard"]`.
3. Metric grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`):
   - **Terbit Hari Ini** (success tone, delta vs yesterday).
   - **Menunggu Review** (warning; clickable → `/review` only if `can.approveContent`).
   - **Terjadwal 24 Jam** (accent).
   - **Draft Pekan Ini** (primary, delta vs last week).
4. Row 2 (`lg:grid-cols-3`): **Alur Editorial** (EditorialFunnel, `col-span-2`) + **Publikasi Mendatang** (UpcomingPublications).
5. Row 3: **Konten Terbaru** (2/3) + **Aktivitas Terbaru** (1/3, width 320px).

**Signature component — EditorialFunnel:**
- Proportional segmented stacked bar (`role="img"`, `aria-label="Distribusi status konten"`) + per stage card showing label, count, and conversion % (stage/previous). Automatically highlights the **biggest drop-off** between adjacent stages with `border-warning/40 bg-warning/5` + lab "Perlu perhatian". Counts always visible as text (never color-only).

**Signature component — UpcomingPublications:**
- Rows of up to 5 upcoming scheduled publishes; title (fallback `Konten #{id}`), localized `id-ID` date (day + short month + HH:mm), relative pill ("dalam {m} mnt/{n} jam/{n} hari" / "sudah lewat" / "—"). Urgency: < 3h (180 min) → primary-tinted pill.

**Signature component — ActivityTimeline:**
- `<ol>` with left border and dot nodes; localized `actionLabel` dictionary (~25 actions); "user — label — description — relative time"; "Sistem" = user null; read-only.

Fresh page accepts `empty states: "Belum ada aktivitas."` and recent contents empty: "Belum ada konten" + "Tulis Konten".

---

### 5.3 Content Management

**`GET /contents`** (ContentController@index):
- Non-editors scoped to own content.
- Sortable columns whitelist `[updated_at (default desc), title, status, published_at]`.
- Filters: `search` (title LIKE), `status`, `category` (category_id), `tag` (whereHas).
- Pagination: 15 per page, `withQueryString`.
- Each row annotated with `pending_schedule_exists`.
- Props: `contents` (paginator), `filters`, `statuses`, `categories`, `tags`, `can {create, delete}`.

**Index page UI/UX:**
- Header: eyebrow "Editorial", title "Konten", description "Kelola artikel Anda melalui alur editorial dari draft hingga publikasi.", CTA **"Konten Baru"** (ez `can.create`).
- Breadcrumbs `["Konten"]`.
- Toolbar: search input (debounced 300ms, clear button), status select, category select, tag select (all "all" defaults).
- Responsive inventory: cards `< md` (via `ContentRowCard`), table ≥ md with `role="grid"`, sortable headers (`aria-sort`) with ArrowUp/Down icons, thumbnails 40px, urgency/flags badges, per-row actions "Buka" / "Hapus" (delete = ConfirmDialog destructive, gated `can.delete`).
- `ContentRowCard`: 64px thumbnail, Newsreader title button, flag chips — **Breaking** (`bg-primary/10 text-primary`), **Pilihan Editor** (`bg-accent/10 text-accent`), **Terbit hari ini** (`bg-success/10`), **Terjadwal** (`bg-warning/10 text-warning`, from `has_pending_schedule`), meta line category · author · `relativeTime`.
- Delete: `ConfirmDialog` "Hapus konten" → `router.delete('/contents/{id}')`.
- Empty states: "Tidak ada konten" (+ CTA if `can.create`); search no-match.

**Create / Edit article** (`GET /contents/create`, `POST /contents`, `GET /contents/{content}`, `PATCH /contents/{content}`), `DELETE /contents/{content}`):

**Fields (exact):**
- `title` (required), `sub_title`, `slug` (auto), `excerpt`, `body` (rich text, required, must contain text after stripping HTML), `featured_video` (sanitized embed HTML), `breaking_news_flag` (bool), `editor_pick_flag` (bool), `featured_image_id`, `image_caption`, `image_credit`, `thumbnail_id`, `category_id`, `tags[]`.

**Rules (@ContentRequest):**
- `title` required|string|max:255; `slug` nullable|string|max:255|unique (ignore self); `excerpt` max 65535; `body` required|string; `featured_video` max 65535; flags boolean; media/category ids `exists`; `tags.*` numeric exists in `tags→id`.
- `validatedSanitized()`: `body` and `featured_video` pass through HTMLPurifier profile `cms_content`; `slug` `Str::slug()`.
- After-validation guard: body with only HTML (empty stripped text) → error "Isi artikel tidak boleh hanya berisi kode HTML tanpa teks.".
- Indonesian error messages: `title.required` → "Judul wajib diisi.", `body.required` → "Isi artikel wajib diisi.".

**Create flow:** forces `status = draft` and `author_id = current user`; saves tags via `sync`; logs `content.created`; redirects to `contents.edit` with flash `success|"Draft berhasil dibuat."`.

**Editor UI:** the article editor page composition, rich-text toolbar, SEO live preview, and workflow sidebar are specified in detail in §6.4 and §6.5.

**Policy rules (ContentPolicy):**
- `view`: owner OR any of `edit_any_content`, `approve_content`, `publish_content`, `view_audit_log`.
- `create`: `create_content`.
- `edit`: **only when status === Draft**; then `edit_any_content` OR (author + `edit_own_content`).
- `delete`: blocked when Published or Approved; requires `delete_content`.
- `submit`: Draft + is author + `edit_own_content`.
- `approve`: status Review AND not author (separation of duties) + `approve_content`.
- `publish`: status Approved + `publish_content`.
- `unpublish`/`archive`: status (list) Published + `publish_content`.

**ContentObserver (saving):** unique slug from title (append `-2`, `-3`...) whenever title changes or slug blank. **TagObserver (saving):** slug from name if empty.

---

### 5.4 Editorial Workflow

**Statuses:** `draft` → `review` → `approved` → `published` (→ `archived`). `ContentStatus::allowedTransitions`:

```
draft      → review, (edit anytime in draft)
review     → approved | draft
approved   → published | draft
published  → archived, (unpublished → draft)
archived   → draft
```

**Workflow action rules (all execute inside `DB::transaction`, errors throw `RuntimeException`):**

| Action | Precondition | Effect | Approval entry | Activity log |
|---|---|---|---|---|
| `submit` | Draft + owner | → Review | `submitted` | `content.submitted` |
| `approve` | Review + NOT owner + `approve_content` | → Approved, set `reviewer_id`, `reviewed_at=now` | `approved` (+"Disetujui untuk publikasi.") | `content.approved` |
| `reject` | Review + NOT owner | → Draft, clear reviewer/reviewed_at | `rejected` (notes optional) | `content.rejected` |
| `requestChanges` | Review + NOT owner | → Draft, notes **required** | `request_changes` | `content.request_changes` |
| `publish` | Approved | → Published, set `published_at=now` | `published` | `content.published` |
| `unpublish` | Published | → Draft, clear `published_at` | `unpublished` | `content.unpublished` |
| `archive` | Published | → Archived | `archived` | `content.archived` |
| `schedule` | Approved, no pending | Creates `ScheduledPublish` (pending) | — | `content.scheduled` |
| `cancel-schedule` | has future pending | marks all future pending as `cancelled` | — | `content.schedule_cancelled` |

All failures throw `RuntimeException` → controllers catch and redirect back with `error` flash.

**Review Queue page** (`GET /review`):
- Header "Antrean Review" + Breadcrumbs `["Review"]`, description about reviewing.
- **Summary strip**: `{n} artikel menunggu` + "Tertua menunggu {X}" with `WaitBadge`; if oldest `>= 48h`, a destructive-tone pill "Ada artikel sudah lama menunggu — prioritaskan".
- Mobile cards / desktop table (`role="grid"`): Judul (+44px thumbnail + 2-line excerpt), Kategori, Penulis, Menunggu, Aksi.
- `WaitBadge`: < 1h → "baru masuk"; hours → "{n} jam"; >= 48h → "menunggu {d} hari (terlambat)" destructive.
- Actions: **Pratinjau** (ghost Eye) → Inline Preview Dialog `max-w-2xl` rendering `SafeHtml(body)`. **Minta Revisi** (outline success, **notes required**, submit disabled when empty) → `POST /request-changes`. **Setujui** (default, confirm dialog) → `POST /approve`. **Tolak** (ghost destructive, notes optional) → `POST /reject`.
- Recently decided list (10 latest): timeline dots, `actionLabel` map, StatusBadge, relative time.
- Empty state: "Tidak ada antrean" / "Tidak ada konten yang menunggu review saat ini."

---

### 5.5 Publishing & Scheduling

| Action | Route | Conditions |
|---|---|---|
| Publish now | `POST /contents/{content}/publish` | Approved |
| Schedule | `POST /contents/{content}/schedule` | Approved + `scheduled_at` required date **after:now**; blocks if pending schedule exists |
| Cancel schedule | `POST /contents/{content}/cancel-schedule` | Future pending exists |
| Unpublish | `POST /contents/{content}/unpublish` | Published |
| Archive | `POST /contents/{content}/archive` | Published |

**Scheduler:**
- Artisan command `publish:scheduled` (attribute class `#[Signature('publish:scheduled')]`), registered every minute in `routes/console.php` via `Schedule::command('publish:scheduled')->everyMinute();`.
- Processes pending schedules with `scheduled_at <= now()`; per content:
  - Content missing → mark schedule `failed` with reason.
  - Status not `approved` → `failed` with reason.
  - Else → status `published`, `published_at` (kept if already set), schedule → `processed`/`processed_at=now`. Logs `content.scheduled_published`.

---

### 5.6 Media Library

**Routes (web):** `GET /media`, `POST /media` (throttle `20,1`), `PATCH /media/{media}/alt-text`, `DELETE /media/{media}`.
**API:** `GET /api/media`, `POST /api/media` (throttle `20,1`), `GET /api/media/{media}`, `PATCH /api/media/{media}`, `DELETE /api/media/{media}`.

**Upload rules (@MediaRequest):**
- `file` required|file|max:10240 KB (10MB)|mimes `jpg, jpeg, png, webp, gif, svg, pdf`.
- `alt_text` nullable|string|max:255.
- Indonesian messages.

**Storage:**
- disk `public`, path `media/{Y/m}/{uuid}.{ext}`; randomized filename.
- `storage:link` required.

**Media model behaviors:**
- Appends: `url` (`asset('storage/'.$path)`), `thumbnail_url` (only for raster `image/*`; generated file at `media/thumbs/{...}` mirroring original path).
- `fillDimensions()` (idempotent): reads width/height via `getimagesize` (SVG via regex width/height/viewBox). Persists for legacy rows.
- `ensureThumbnail()` (idempotent): raster images only; skip SVG; generates thumbnail with max edge **640px**, JPEG/WebP quality 82, preserved alpha.
- `deleteFromDisk()` deletes original + thumbnail; used by delete.

**Artisan command:** `media:regenerate-thumbnails` (idempotent backfill; reports already / generated / skipped counts).

**Media index page (filter/logic):**
- Filters: `search` (original_name LIKE), `type` (image|doc|svg), `mine` (ownership — only exposed to those with `manage_media`; non-managers always scoped to own uploads), `alt=missing` (alt_text NULL), `used` (bool: featured_image_id / thumbnail_id usage), `sort` (recent | largest | name).
- Pagination: 24.
- Stats: total, storage sum(size), missing_alt + % hint, unused.
- Each page item gets `fillDimensions()` + `ensureThumbnail()` backfilling.

**UI:**
- KPI strip with **clickable filter cards**: Total Aset, Penyimpanan, Tanpa Alt Text (warning, toggles `alt=missing`), Aset Tak Terpakai (accent, toggles `used=false`).
- Toolbar search (Enter submits), Type & Sort selects, Reset button.
- Grid/List view toggle (segmented control): Grid = tiles with lazy thumbnails + "Tanpa Alt" badge + usage pill; List = `role="grid"` table with Media, Tipe, Ukuran, Dimensi, Dipakai di, Diunggah, Waktu.
- **Upload dialog**: full-page drop target (drop anywhere), dashed dropzone, client-side filter (images + PDF only), per-file alt input, sequential upload with progress bar (`role="progressbar"` + "Mengunggah {i+1} dari {n} — {p}%"), per-file success/failure toasts.
- **Detail dialog**: type/size/dimensions metadata, 16:9 preview, lightbox (`max-w-5xl`), copy URL + Copy **Markdown** buttons (flash "Tersalin" with live region), usage box ("Dipakai di {n} artikel" + linked titles), AltText form (`PATCH /media/{media}/alt-text`, only `can.manage`), destructive delete with usage-aware description.
- Accessibility: icon-only buttons have `aria-label`, chips `aria-pressed`, `role="grid"`, live regions.
- Empty states for each filter.

### 5.7 Category Management

**Routes:** GET (index), POST (store), PATCH (update), DELETE (destroy) at `/categories`.

**Data:**
- The category tree query returns a nested structure with `depth`, `path` (breadcrumb), `slug_path`, `contents_count`, `published_count`, `children_count`.
- Search mode → flat matching list with parent breadcrumb.
- Stats: Total, Category Utama (roots), Sub-kategori, Tanpa Konten (warning "Kandidat untuk dirapikan").
- `parentOptions` = indented tree excluding self + descendants.

**Validation (@CategoryRequest):**
- `name` required|string|max:255; `slug` nullable|unique (ignore self); `description` max 65535; `parent_id` nullable|exists.
- Guards (withValidator): no self-parenting; no descendant-parenting (recursive walk of `selfAndDescendantIds`).

**Delete guard:** if category has children or is used by any content → hard block `redirect()->back()` with error flash. Otherwise delete.

**UI:**
- KPI strip, search (debounced 300ms), **expandable tree** (default all-expanded) with depth indentation (16px per level, max 6), chevron toggles `aria-expanded`, breadcrumb path tooltips.
- Desktop table columns: Nama, Slug, Deskripsi (hidden lg), Sub-kategori, Konten, Aksi.
- Konten cell = interactive button → `/contents?category={id}` with "N terbit / M" smart badge.
- Inline create/edit forms embedded in-row (`bg-muted/20` highlight); parent Select with tree-indent.
- Delete gating: disabled + tooltip when has children/content; `ConfirmDialog` with child/content counts.
- Empty states preserved.

### 5.8 Tag Management

**Routes:** `/tags` collection.

**Data:** sort whitelist `[name, count, created]`; used filter `[all|used|unused]`; `withCount('contents')` + published_count + withMax published_at. Pagination 20. Stats: total, used, unused, hot (published in last 30 days, "Topik Terpanas").

**Store behavior:** comma-separated bulk create (split on `,`), unique slug per tag with `-2`, `-3` suffix; logs first created.

**Validation:** name required|string|max:255; slug optional|unique.

**UI:**
- Clickable KPI: **Total Tag**, **Tag Terpakai** (success), **Tanpa Konten** (warning), **Topik Terpanas**.
- Usage filter pills (Semua / Dipakai / Tanpa konten) with live counts.
- **Signature — Usage bars**: clickable 64px success progress bar (published % of total) + "N / M"; click → `/contents?tag={id}`.
- Table: Nama (Hash icon), Slug, Terakhir dipakai (`relativeTime` / "Belum terbit"), Konten, Aksi.
- Delete always allowed (no guard), confirm description "Tag ini digunakan oleh {n} konten."

---

### 5.9 User Management

**Routes:** `/users` CRUD + `/users/{user}/toggle-active`.

**Index filters:** search (name/email LIKE), role, status (active/inactive), verified=no, sort whitelist `[name, created, contributions (contents_count desc), login (last_login_at desc)]`. Pagination 20. Stats: total/active/inactive/unverified. Loads roles, counts contents, published, reviewed; withMax contents updated_at.

**UI:**
- Clickable KPI cards: Total Pengguna / Aktif / Nonaktif / Belum Verifikasi.
- Toolbar: search, sort select, role select, Reset.
- Mobile cards / desktop table: Nama (+avatar or initials), Email, Peran, Kontribusi ("{n} terbit · {m} draft" (+ "· r review")), Terakhir berkontribusi, Terakhir login, Status.
- **(Anda)** suffix for current user; self-protection (can't deactivate/delete self).
- Power toggle: activate immediate; deactivate → ConfirmDialog ("Pengguna tidak dapat login sampai diaktifkan kembali").
- Delete: content-aware confirm ("penulis {n} konten — konten akan tetap ada tanpa byline").

**Create/Edit (User Form):**
- Fields: name, email, job_title, bio, active switch, roles (checkbox multi-select with badges preview), password + password_confirmation (required min:8 on create; empty on edit retains).
- Empty password on create → auto-generate `Str::random(16)`.
- Role change guard: if `roles` changed and actor lacks `change_role` → `abort_unless` (403).
- Never delete self.

**User Addresses** (`/users/{user}/addresses`): card grid with "Utama" badge, dialog CRUD, only `can.manage`.

---

### 5.10 Roles & Permissions

**Routes:** `/roles` GET/POST/PATCH/DELETE.

**Data:** roles + `users_count` + permissions; enriched with PermissionCatalog (label/group/critical). Stats: totalRoles, totalPermissions, busiestRole, rarestPermission. protected = `super_admin`.

**Validation (RoleRequest):** `name` required|unique; `permissions` required|array with values `exists:permissions,name`. Authorization: `change_role`.

**UI:**
- Role card grid: role icon, protected lock, user-count badge → `/users?role={name}`, permission badges (critical → warning), "Dapat diubah / Tidak dapat diubah" footer.
- **Permission Matrix**: sticky-left "Izin" column; one column per role (`min-w-[130px]`); **click role header to highlight that column** (`bg-primary/10`, aria-pressed); group separator rows; granted cells show check (success, warning for critical); denied = minus. Hint "Klik nama peran untuk menyorot kolomnya."
- Create/edit dialog: name + permissions grouped by group with **tri-state group checkbox** (all/partial); new roles default `['login']`.
- Delete: disabled with tooltip "Peran yang masih dipakai tidak bisa dihapus" when users_count > 0; hidden entirely when `!can.changeRole` or protected.

---

### 5.11 Settings

- **Profile (`/settings/profile`)**:
  - Sections: **Informasi Profil** (name, email, job_title, bio with char counter), dirty indicator badge "Belum tersimpan"; email change warning (re-verify).
  - **Foto Profil**: 80px avatar; "Pilih Foto" (`accept="image/*"`), object-URL preview → "Simpan Foto"/"Batal"; Delete with confirm (removes to initials). POST uses `forceFormData`.
  - **Pratinjau Byline** (right aside): mocked article byline card live-updating from form (name, jobTitle, bio, photo).
  - **Konteks Akun**: verified badge, joined date, **terakhir login (relative)**, roles badges; unverified warning callout.
  - Submits PATCH `/settings/profile` `preserveScroll`; logs `profile.updated`.
- **Security** (`/settings/security`): two-factor enable + confirm with QR/recovery codes, shared confirmation password, passkeys management (register/list/confirm/delete).
- **Appearance** (`/settings/appearance`): appearance/locale preference page.

**SettingsNav** (shared tab bar): Profil / Keamanan / Tampilan (icons CircleUserRound / ShieldCheck / Monitor), active `bg-primary text-primary-foreground`, `aria-current="page"`.

---

### 5.12 API Documentation

**Route:** `GET /api-docs` → `ApiDocsController`.

- Auto-extracts real `api/*` routes from the router; canonicalizes method order (GET < POST < PATCH < PUT < DELETE); merges metadata from `ApiEndpointCatalog` (groups, descriptions, params, bodies, response examples, permission required, notes).
- Groups in fixed order: Authentication & Users, Taxonomy, Media, Content & Workflow, Publishing.
- **Flow stepper** (5 steps: submit → approve/reject → publish → schedule → archive); each stage clickable → expands the matching endpoint row and smooth-scrolls center.
- **Filter bar**: debounced search (300ms), method pills (All/GET/POST/PATCH/DELETE), result counter.
- Layout: sticky TOC left (`lg:grid-cols-[220px_1fr]`), grouped sections with `scroll-mt-24`; each endpoint row expands to detail: permission badge (Lock), HTTP status-code badges, query params table, request body table (types + required badges), and an example JSON response with inline syntax coloring.
- **Code blocks**: base URL (`CopyButton`), `php artisan tinker` token demo, `curl` example built live. Copy uses `navigator.clipboard` with `document.execCommand` fallback; "Tersalin" flash.
- Empty state: "Tidak ada endpoint" + "Reset filter".

**API Docs scope note:** Authentication is Sanctum session-based cookies for the browser (stateful via `EnsureFrontendRequestsAreStateful`) plus `Authorization: Bearer <token>` for API clients. All `/api/*` requests require a verified user.

### 5.13 Welcome page (public)

- Nav: logo + "MyNews".
- Hero: eyebrow rule, display headline "Ruang redaksi untuk cerita besar.", red accent span, description, primary CTA "Masuk ke CMS" → `/login`.
- Footer: "MyNews Editorial CMS". Demo roles hints.

**AuthLayout** (shared auth screens): split-screen — dark left panel (`#171a1f` background, brand + tagline), white right panel with centered `max-w-sm` card.

---

## 6. UI/UX & Design System

### 6.1 Design Tokens (CSS variables — `resources/css/app.css`, **source of truth**)

Fonts (via Google Fonts `@import`):
- Headings/display: **Newsreader** (`--font-display`).
- Body/UI: **Inter** (`--font-sans`).

```css
@theme {
    --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-display: 'Newsreader', ui-serif, Georgia, serif;

    --color-background: #f6f4ef;      /* cream */
    --color-foreground: #14171c;     /* near-black */
    --color-card: #ffffff;
    --color-card-foreground: #14171c;
    --color-muted: #ece9e1;
    --color-muted-foreground: #565e6b;
    --color-border: #e0dbd0;
    --color-input: #d4cfc3;

    --color-primary: #b01e23;        /* news red */
    --color-primary-foreground: #ffffff;
    --color-accent: #1e40af;         /* link blue */
    --color-accent-foreground: #ffffff;

    --color-destructive: #b00020;
    --color-destructive-foreground: #ffffff;
    --color-ring: #b01e23;

    --color-success: #15803d;
    --color-success-foreground: #ffffff;
    --color-warning: #b45309;
    --color-warning-foreground: #ffffff;

    --color-draft: #64748b;
    --color-review: #b45309;
    --color-approved: #1e40af;
    --color-published: #15803d;
    --color-archived: #64748b;

    --text-xs: 0.6875rem;   /* 11px */
    --text-sm: 0.8125rem;   /* 13px */
    --text-base: 0.9375rem; /* 15px */
    --text-lg: 1.0625rem;   /* 17px */
    --text-xl: 1.25rem;     /* 20px */
    --text-2xl: 1.5rem;     /* 24px */
    --text-3xl: 1.875rem;   /* 30px */
    --text-4xl: 2.25rem;    /* 36px */

    --leading-tight: 1.2;
    --leading-normal: 1.6;
    --leading-relaxed: 1.75;
}
```

**Utility classes** (defined + used across pages): `.font-display`, `.hairline`, `.text-display-4xl/3xl/2xl/xl`, `.text-body-lg/body/body-sm`, `.text-caption` (11px uppercase tracking .02em), `.text-label`, `.page-transition` (page fade + 20px slide, respect reduced motion), `.text-[10px] uppercase tracking-widest` patterns.

**Global base:**
- `html` font-size 16px; body bg `--color-background`, text `--color-foreground`, font `--font-sans`; antialiased.
- `:focus-visible` → `outline: 2px solid var(--color-ring); offset: 2px;`.
- `prefers-reduced-motion: reduce` → transitions/animations ≈ 0.01ms.

### 6.2 Layout & Shell

- **AppLayout** (authenticated shell):
  - **Sidebar (desktop)** `w-64`, dark background `bg-[#171a1f]` text-white; `fixed inset-y-0 left-0` on mobile (slide-over) and `lg:static` on desktop. Header block with red primary icon chip + "MyNews / Editorial CMS"; a **primary 4px top rule**; nav separated into 3 groups with uppercase 11px section labels; items = Lucide icon (strokeWidth 1.75) + label; active state `bg-white/10 text-white` + a `bg-primary` 4px left indicator (`before:` element), hover on inactive items. Scrollable.
  - **Keyboard navigation**: ArrowUp/Down/Home/End/Enter/Escape when open; focus follows index.
  - **User card** bottom: avatar/initials, name, role; dropdown with "Profil & Keamanan" + "Keluar" (destructive). Logout = `router.post('/logout')`.
  - **Mobile**: overlay `lg:hidden`, slide-in translateX; **MobileHeader** sticky top with hamburger + logo + avatar.
  - **User card** bottom: avatar/initials, name, role; dropdown with "Profil & Keamanan" + "Keluar" (destructive). Logout = `router.post('/logout')`.
  - **Mobile**: overlay `lg:hidden`, slide-in translateX; **MobileHeader** sticky top with hamburger + logo + avatar.
  - "Lompat ke konten utama" skip link (`#main-content`).
  - Content area max-w-7xl inside `main#main-content`.
  - Flash messages → **sonner toasts** (success/error/info), `<Toaster position="top-right" richColors closeButton>`.

- **PageHeader**: eyebrow (11px primary uppercase), display serif title, `max-w-2xl` description, optional action buttons; bottom `border-b pb-5`; responsive flex.
- **SectionCard**: `rounded-xl border bg-card p-5 shadow-sm`, optional header (title/description/action).
- **Breadcrumbs**: reusable component; items with last = current.
- **MetricCard**: uppercase label, illustration chip, `text-4xl font-display tabular-nums` value, delta (▲/▼/—) + deltaLabel, hint, optional `onClick` (renders `<button>` with `cursor-pointer hover:border-primary/40`; `active` adds `border-primary/50 ring-2 ring-primary/20`).
- **StatusBadge**: `statusConfig` map (above labels). `announce` prop → `role="status" aria-atomic aria-live`.

### 6.3 Component Inventory (reuse these in any new page)

| Component | File | Notes |
|---|---|---|
| Button | `components/ui/button.tsx` | variants: default, secondary, outline, ghost, destructive; sizes: sm, icon, iconSm. |
| Input / Textarea / Label / FieldError | `components/ui/input.tsx`, `components/ui/field.tsx` | htmlFor + id pairing, inline errors. |
| Select | `components/ui/select.tsx` | Radix-based. |
| Dialog | `components/ui/dialog.tsx` | Radix Dialog, overlay `bg-black/50`, footer mobile stack. |
| ConfirmDialog + `useConfirmDialog` | `components/confirm-dialog.tsx` | destructive default, AlertTriangle icon chip, closes before calling onConfirm. |
| EmptyState | `components/ui/feedback.tsx` | dashed border + icon + title + desc + optional CTA. |
| Badge | `components/ui/badge.tsx` | CSS-var driven (no hardcoded hex). |
| RichTextEditor | `components/ui/rich-text-editor.tsx` | contentEditable; see below. |
| MediaPicker | `components/media-picker.tsx` | content-editor modal; API via `/api/media` + XSRF. |
| SafeHtml | `components/safe-html.tsx` | renders trusted sanitized HTML with prose. |
| WorkflowStepper | `components/workflow-stepper.tsx` | 5-step, done=check, current=spinner, pending=circle. |
| ContentRowCard | `components/content-row-card.tsx` | list card + `relativeTime` helper. |
| EditorialFunnel / UpcomingPublications / ActivityTimeline / MetricCard / StatusBadge | components set | see §5.2. |

### 6.4 Rich Text Editor

- `contentEditable` div capturing `execCommand` toolbar;
- Toolbar (icon buttons with aria-label/title): Heading 2 ↔ `formatBlock h3`, Bullet list, Ordered list, Blockquote, **Link** (`window.prompt` → createLink), **Insert image** (Optional, wired to MediaPicker → inserts `<img src alt style="max-width:100%">`), Divider, Bold, Italic, Underline. Buttons 8×8.
- **Sticky header** toolbar: scroll-based sticky-on, `shadow-sm bg-card/95 backdrop-blur-sm`.
- Footer status bar: read-time (200 wpm, "< 1 menit"/"{n} menit"), word count (tags stripped), autosave status `aria-live`: idle "Siap simpan", spinner "Menyimpan…", success "Tersimpan", error "Gagal menyimpan".
- Autosave: `onAutosave` + `autosaveDelay` default 2000ms debounce. On the content editor the autosave PATCHes only `body` (`preserveState, preserveScroll`).
- `readOnly` = static muted box. minHeight 320, placeholder. Sync props → innerHTML only when not focused.

### 6.5 Content Editor page composition (per design-system/pages/content-editor.md)

- 2-column grid (2/3 main + 1/3 sidebar) page:
  - **Main tabs** "Tulis": Judul (+ SEO bar), Sub Judul, Slug with **auto/manual toggle** (debounced 600ms, `aria-pressed`), Isi (RichTextEditor), Ringkasan (with SEO bar), Embed Video.
  - **Organisasi & Media** card: Kategori Select, Tag chips (≥44px touch target, `aria-pressed`-style selected), Featured Image + Thumbnail MediaFields, image caption + credit, Breaking News / Pilihan Editor Switches.
  - **Sidebar**: Status Simpan card (dirty badge "Belum disimpan" warning / "Tersimpan" muted + "Terakhir disimpan {HH:MM}"), **Pratinjau Hasil Pencarian** (mock Google result: title/url/description; hints "Judul ideal 10–60" / "Deskripsi ideal 70–160"), **Alur Editorial** (StatusBadge + WorkflowStepper + Workflow Actions), **Riwayat Persetujuan** (timeline at approvals).
  - Actions: Save ("Buat Draft"/"Simpan Perubahan"), conditional "Kirim ke Review", "Setujui", "Tolak/Minta Revisi", "Terbit"+"Jadwalkan" (2-col), "Tarik Publikasi", "Arsipkan".
- SEO thresholds: title valid when `>10 && <=60`; description valid when `>=70 && <=160`.

### 6.6 Workflow Notes / anti-patterns (from design-system)

- Always show status as text + color, never color-only.
- All destructive/approve actions use confirm dialogs; buttons disabled while processing.
- Icon buttons always have `aria-label`; tables `role="grid"` + `scope="col"`.
- All clickable elements `cursor:pointer`; hovers 150–300ms; `prefers-reduced-motion` respected.
- No emojis as icons (Lucide only).
- **Dead/AI Assist placeholder removed — not a V1 feature.**

---

## 7. Data Model

### 7.1 users (+ columns from Fortify migrations)

`id, name, email (unique), email_verified_at, password, remember_token, profile_photo_path, job_title, bio, two_factor_secret, two_factor_recovery_codes, two_factor_confirmed_at, is_active (default true), last_login_at (nullable datetime), timestamps`. Plus Sanctum/Spatie/permission tables.

### 7.2 roles / permissions (Spatie)

Standard Spatie tables: `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`. `Role` model `protected` flag computed on name.

### 7.3 categories

`id, name, slug (unique), description nullable, parent_id (self FK, nullOnDelete), timestamps.` Index on `parent_id`.

### 7.4 tags

`id, name, slug (unique), timestamps.`

### 7.5 media

`id, filename (unique), original_name, path, mime_type nullable, size (default 0), width nullable, height nullable, alt_text nullable, uploaded_by nullable FK users nullOnDelete, timestamps.` Index (`mime_type`).

### 7.6 contents

`id, title, sub_title, slug (unique), excerpt, body (longText), featured_video (text), breaking_news_flag bool, editor_pick_flag bool, featured_image_id FK media nullOnDelete, image_caption, image_credit, thumbnail_id FK media nullOnDelete, category_id FK categories nullOnDelete, status (string, default draft, index), author_id FK users nullOnDelete, reviewer_id FK users nullOnDelete, reviewed_at, published_at, timestamps.` Indexes: (`status`,`author_id`), (`category_id`).

### 7.7 content_tags

Pivot `(content_id FK cascade, tag_id FK cascade)`, PK (`content_id`,`tag_id`).

### 7.8 content_approvals

`id, content_id FK cascade, reviewer_id FK users nullOnDelete, action (string), notes nullable text, timestamps, index (content_id, action).`

### 7.9 scheduled_publishes

`id, content_id FK cascade, scheduled_at timestamp, status (string default 'pending'), processed_at nullable, error_message nullable text, timestamps, index (status, scheduled_at).` Statuses: pending/processed/failed/cancelled.

### 7.10 activity_logs

`id, user_id FK users nullOnDelete, action, entity_type nullable, entity_id nullable, description nullable, ip_address 45, user_agent text, created_at (only), indexes (user_id, created_at), (entity_type, entity_id).`

### 7.11 addresses

`id, user_id FK users cascade, label nullable, address_line1, address_line2 nullable, city, state, postal_code (max:20), country, is_primary bool default false, latitude decimal(10,7) nullable between -90..90, longitude decimal(10,7) nullable between -180..180, notes text, timestamps.`

---

## 8. Technical Architecture

### 8.1 Stack (pin to these versions)

| Layer | Technology |
|---|---|
| Language | PHP 8.3+ (8.5 in dev), TypeScript |
| Backend | Laravel 13.x |
| Frontend | Inertia.js v3, React 19 |
| Build | Vite 8, `@vitejs/plugin-react`, `@tailwindcss/vite`, `laravel-vite-plugin`, `@laravel/vite-plugin-wayfinder` |
| Styling | Tailwind CSS v4 (`@import 'tailwindcss'` + `@theme`) |
| Components | Radix UI primitives (dialog, select, tabs, switch, checkbox, label, dropmenu, avatar, separator, popover, progress, tooltip, toast) |
| Icons | lucide-react (`^0.469.0`) |
| Toasts | sonner (`^2.0.0`) |
| Auth | Laravel Fortify v1, Sanctum v4, Passkeys |
| RBAC | spatie/laravel-permission v8 |
| HTML Sanitization | mews/purifier v3 (profile `cms_content`) |
| Typed routes | Laravel Wayfinder |
| Testing | Pest 4, PHPUnit 12 |
| Static analysis/lint | Larastan/PHPStan, Pint, ESLint 9, Prettier 3, tsc |
| DB | SQLite/MariaDB/MySQL (SQLite in tests) |

### 8.2 Project structure (paths must match)

```
app/
  Actions/Fortify/{CreateNewUser, PasswordValidationRules, ResetUserPassword, UpdateUserPassword, UpdateUserProfileInformation}
  Console/Commands/{PublishScheduled, RegenerateMediaThumbnails}
  Enums/{ContentStatus, ContentApprovalAction, ScheduledPublishStatus}
  Http/
    Controllers/
      Api/ (UserApi, CategoryApi, TagApi, MediaApi, ContentApi, ContentWorkflowApi, ContentPublishApi)
      {ApiDocs, Dashboard (invokable), CategoryManagement, Content, RoleManagement, TagManagement, UserManagement, UserAddress,
      MediaLibrary, Settings, ContentPublish, ContentReview, ContentWorkflow}
    Requests/{Content, Media, Category, Tag, Role, User, Address}
    Resources/{User, Media, Content, Category, Tag, ContentApproval, Address}
  Listeners/UpdateLastLoginAt
  Models/{User, Content, Category, Tag, Media, ContentApproval, ScheduledPublish, Address, ActivityLog, Role}
  Observers/{ContentObserver, TagObserver}
  Policies/{Content, User, Media, Category, Tag, Role}Policy
  Providers/{App, Fortify}ServiceProvider
  Services/{ContentWorkflow, ContentPublish, ActivityLog, CmsData}Service
  Support/{ApiEndpointCatalog, PermissionCatalog}
  /Http/Middleware/HandleInertiaRequests.php
resources/js/
  pages/{Auth/*, Dashboard, Contents/{Index,Editor}, Review/Index, Media/Index, Categories/Index, Tags/Index, Users/{Index,Form,Addresses}, Roles/Index, Settings/{Profile,Security,Appearance}, ApiDocs/Index, Welcome}
  components/{...} and components/ui/{...}
  layouts/{AppLayout.tsx}
  lib/{sidebar-context, utils}
  actions/ (Wayfinder-generated) — importable types
tests/
  Feature/... | Unit/...
```

### 8.3 High-Level Method Flow

1. Browser → Laravel web route → Inertia renders React page.
2. Auth via Fortify; `auth`,`verified` middleware.
3. Controllers `authorize` via policies; Form Requests validate + sanitize.
4. Services run workflow logic in `DB::transaction`.
5. Eloquent persists; Inertia returns props; React submits via Inertia `router`/Wayfinder.
6. Sonner toasts render on `flash` success/error/info.

### 8.4 Global Middleware & boot

- `bootstrap/app.php`:
  - **Critical:** Sanctum's `EnsureFrontendRequestsAreStateful` is prepended to the `api` group so session-authenticated `fetch()` calls to `/api/*` work. Do NOT remove it. All state-changing `fetch` calls to `/api/*` must also send the `X-XSRF-TOKEN` header (decoded from the `XSRF-TOKEN` cookie, e.g. `getXsrfToken()` helper in `media-picker.tsx`) plus `Accept: application/json`.
- `HandleInertiaRequests`: shares `auth.user` (including `permissions` array and `roles`), `flash` (`success`/`error`), etc.
- Blade root view: `resources/views/app.blade.php`.

### 8.5 Route typing

Wayfinder generates TS functions under `resources/js/actions` and `resources/js/routes`. All frontend navigation SHOULD use these; some string URLs still exist (see §15.1).

---

## 9. Data Specification

### 9.1 Web routes (all `auth` + `verified`)

```
GET  /dashboard
GET  /contents                    /contents/create            POST  /contents
GET  /contents/{content}          PATCH /contents/{content}   DELETE /contents/{content}
POST /contents/{content}/submit|approve|reject|request-changes
POST /contents/{content}/publish|schedule|cancel-schedule|unpublish|archive
GET  /review
GET  /media   POST  /media (throttle:20,1)  PATCH /media/{media}/alt-text  DELETE /media/{media}
GET  /categories  POST /categories  PATCH /categories/{category}  DELETE /categories/{category}
GET  /tags    POST /tags    PATCH /tags/{tag}    DELETE /tags/{tag}
GET  /users   ...CRUD...    POST /users/{user}/toggle-active
GET  /users/{user}/addresses   (POST/PATCH/DELETE)
GET  /roles   POST /roles   PATCH /roles/{role}   DELETE /roles/{role}
GET  /settings/profile|security|appearance
POST/DELETE /settings/profile-photo
GET  /api-docs
```

### 9.2 API routes (all `auth:sanctum` + `verified`)

```
apiResource users (index/store/show/update/destroy)
POST users/{user}/role | users/{user}/activate | users/{user}/deactivate
GET/POST users/{user}/addresses
GET categories/tree ; apiResource categories
GET tags/search (requires q); apiResource tags
GET/POST /media ; GET/PATCH/DELETE /media/{media}   (POST throttled 20,1)
GET contents/pending-review | contents/scheduled ; GET contents/{content}/approval-history
POST contents/{content}/submit|approve|reject|request-changes
POST contents/{content}/publish|schedule|unpublish|archive
apiResource contents
```

Defaults: users paginate 20, categories 20, tags 20, media 24, contents 15; `per_page` query override accepted.

### 9.3 API catalog metadata (`ApiEndpointCatalog`)

Each endpoint: group, description (Indonesian), method, path, auth requirement, permission code (nullable), notes (e.g., "Perlu verified user"), HTTP status codes possible, query/body params with types + required, example response. Group order fixed.

### 9.4 Eloquent Resources

- `UserResource`: do NOT expose `password`, `two_factor_secret`, `recovery_codes`, `remember_token`. Include roles/permissions sanitized.
- `MediaResource`: `url`, `thumbnail_url`, dimensions.
- `ContentResource`: include author/category/tags/featuredImage/thumbnail loaded relations; `status` cast to string.
- Category/Tag/Address/ContentApproval: straightforward.

---

## 10. Security & Compliance

- **Auth**: All CMS web + API requires auth + verified. Fortify handles login/reset/verify/2FA/passkeys. Passwords hashed via Laravel.
- **Hidden sensitive fields**: password, 2FA secret, recovery codes, remember token — never in API/Inertia props.
- **Authorization double-gating**: Spatie roles + Laravel policies; server-side enforcement for web AND API; separation of duty (author can't approve own).
- **XSS**: HTMLPurifier `cms_content` profile (XHTML 1.0 Strict, tag whitelist h1-h6,p,br;strong/em etc, links, lists, blockquote, pre/code, span/div class, img src/alt/title/w/h, figure/caption, tables, hr; AutoFormat features; Safe-iframe YouTube/Vimeo/Google-Maps embeds). Rendered with `SafeHtml`.
- **Rate limiting**: media upload 20/min web+API; Fortify login 5/min, 2FA 5/min, passkeys 10/min.
- **Input validation**: Form Requests server-side everywhere.
- **File uploads**: MIME/extension whitelist → 10MB max, extensions whitelist.
- **Auditability**: approval logs + activity logs (IP, UA).
- **Privacy**: IPs/UA/bio/profile photo/addresses = personal data; never expose keys above; role changes and deactivations are audit-logged via activity stream.

---

## 11. Testing Requirements

### 11.1 Test files (must exist, match scenarios)

On reproduce, the following test suites must exist and pass; scenarios derived from `tests/Feature/*`:

| File | Covers |
|---|---|
| `AuthAccessTest` | guest redirected; verified+active access; unverified/inactive blocked |
| `LastLoginTest` | last_login_at set on login; shown in list; sort by login; keeps last contribution |
| `ContentWorkflowTest` | create draft, html sanitize, empty-body-after-strip rejected, viewer create denied, own-scope list, no edit non-draft, activity log |
| `ContentWorkflowActionsTest` | submit own/not-own, approve, separation-of-duty (editor cannot approve own), reject→draft, request-changes notes required, /review access |
| `ContentPublishTest` | publish approved, reject non-approved, schedule, cancel pending, unpublish clears published_at, archive, author publish blocked |
| `ScheduledPublishTest` | command publishes due, fails when no longer approved, skips non-due |
| `TaxonomyTest` | category tree, self-parent blocked, child delete-block, used delete-block, unique slug, tag delete, viewer blocked, published counts, search breadcrumb, indented parent options, tag stats/usage bars |
| `ApiTest` | sanctum+verified required, categories tree, author submit own via API, author API publish blocked, editor approves; sensitive fields not leaked |
| `MediaTest` | url prop, alt store, empty alt, dims persist, thumbnail generated, regenerate idempotent, usage reports, alt=missing filter, used filter, sort by size, stats |
| `UserManagementTest` | create user, unique email, password ≥8 + confirm, cannot delete self, super admin role change, admin no role change, viewer blocked, stats, sort contributions, unverified/inactive filters |
| `RoleManagementTest` | stats, protected super_admin, author denied, create role, unique name, unknown permission rejected, non-super cannot edit, super cannot edit a super_admin role, delete guards |
| `ApiDocsTest` | grouping, metadata, catalog route drift, guests blocked |
| `SettingsProfileTest` | profile update, unique email, email change invalidates + resets verified, profile.updated log, renders |
| `SettingsProfilePhotoTest` | photo upload/store, wrong file rejected, remove + disk delete |
| Plus `unit` tests: ContentStatus transitions, ScheduledPublish due/fail, policy per-role matrices.

### 11.2 Quality gates

```
vendor/bin/pint                      # PHP style
composer run types:check             # PHPStan/Larastan
npm run lint:check                   # ESLint
npm run format:check                 # Prettier
npm run types:check                  # tsc --noEmit
php artisan test --compact           # Pest/PHPUnit suite
```

---

## 12. Performance Requirements

- Dashboard eagerly loads relations (avoid N+1).
- Content index: paginated 15; user list: 20; media: 24; tags: 20.
- Search (LIKE on title/original_name/name/email) responds < 500ms on 10k rows with indexes.
- `publish:scheduled` processes due batch within 60s at normal volume.
- Media thumbnails generated server-side (640px) and reused; legacy backfill via `media:regenerate-thumbnails`.

---

## 13. Multi-Client & Responsive Requirements

- Desktop + tablet editorial workflows first-class; mobile usable for review/status checking.
- Cards (`< md`) + tables (`≥ md`) pattern everywhere.
- Visible focus states; `aria-label` on all icon-only controls; tables use `role="grid"` + `role="row"` + `scope="col"`.
- `prefers-reduced-motion` respected globally.
- Status = text + color; destructive actions confirm; alt text supported.
- Responsive breakpoints: 375px, 768px, 1024px, 1440px. No horizontal scroll on mobile; content not hidden behind fixed navbars.

---

## 14. Non-Goals (Out of Scope)

- Public-facing website rendering articles for end readers.
- Multi-tenant CMS.
- Visual drag-and-drop page builder.
- Analytics beyond editorial basics.
- Invitation user flow (UI only).
- Real-time collaborative editing.
- Versioning/revisions/diff of content.
- CDN/image transformation service.
- Monetization/paywall/subscription.
- Production-grade AI content generation (the AI-assist card is removed from v1).

---

## 15. Risks & Roadmap

### 15.1 Committed implementation details / known divergences to preserve

- Invite-User and AI-UI buttons must NOT be present in the final UI (removed as non-V1 features).
- Some front-end routes use string URLs (e.g., `router.post('/logout')`, `/contents/{id}`). Replacing them all with Wayfinder route imports is a backlog item, not a v1 blocker.

### 15.2 Technical risks

| Risk | Mitigation |
|---|---|
| Workflow state drift (UI vs policy) | Policy source of truth; status-transition tests; Wayfinder route helpers |
| Scheduler not running | Scheduler `schedule:run` cron every minute; failure tracking in scheduled_publishes |
| XSS through rich text | Server-side HTMLPurifier profile + SafeHtml; test unsafe tags |
| Permission misconfiguration | Seeder matrix version-controlled; role/permission tests; UI read-only permission matrix |
| Media storage growth | `media:regenerate-thumbnails`, unused-media stats; future S3/CDN |
| Role changes & deactivations not fully audited | Logged via activity; enhance later |
| Hardcoded frontend URLs | Convert to Wayfinder (backlog) |

### 15.3 Rollout phases

- **MVP (done in this build):** Auth+verified, roles/permissions seed, dashboard metrics, content CRUD + rich-text, media library + thumbnails, categories (tree) + tags, workflow submit/review/approve/reject, publish + schedule, user management + last-login, role/permission management, Sanctum API, activity logs, API docs, design-system UI.
- **v1.1:** invitation flow; scheduler monitor/settings; failed-schedule retry UI; audit log full UI; bulk content actions; media usage tracking; convert remaining string-route usages; full API tokens instructions.
- **v1.2:** public content API, preview URL, expanded SEO metadata/OG/Twitter, focal-point metadata, indexed advanced search, notifications.
- **v2.0:** multi-content types, custom fields, multi-site, CDN/object storage, AI assist module (production evaluation + human approval), collaborative comments, content analytics.

### 15.4 Product risks

- Editorial adoption (bypassing workflow) → prominent primary actions + status guidance + dashboard shortcuts.
- Role ambiguity across orgs → baseline roles + configurable roles later.
- Content model variance → article-focused MVP + content-type abstraction later.

---

## 16. Reproduction Checklist for AI Agent

To reproduce the exact product:

1. **Scaffold** Laravel 13 with Inertia (React, TypeScript), React 19, Tailwind v4, Vite, Wayfinder.
2. **Install**: Fortify, Sanctum, Passkeys (laravel/passkeys), spatie/laravel-permission, mews/purifier.
3. **Copy** the entire `database/schema` from this doc. Run migrations. Seed: RolePermissionSeeder → UserSeeder (`*.mynews.test` / `password` / all verified) → CmsSeeder (demo categories/tags/contents, one in each state).
4. **Implement Fortify** with ALL listed features + rate limiters + custom profile-photo routes + last-login listener + active-blocking via policies.
5. **Implement** all policies (Content/User/Media/Category/Tag/Role) exactly as §5 rules; the wiring in AppServiceProvider (`Gate::before` super_admin).
6. **Services**: ActivityLogService, CmsDataService, ContentPublishService, ContentWorkflowService (all DB-transactional, assert rules).
7. **Commands**: `publish:scheduled` scheduled every minute; `media:regenerate-thumbnails`.
8. **Models/Observers**: unique slugs (title-computed); Media thumbnail + dimensions.
9. **Frontend**: AppLayout + design tokens (§6) + all pages (§5), all flows, empty states, dialogs, toasts, valid behavior per section.
10. **API + docs + ApiEndpointCatalog.** Sanctum + verified; XSRF cookie handling.
11. **Write** the exact test suite; all pass + all CI gates.
12. `php artisan storage:link`, `npm run build`, `php artisan schedule:work`/cron.

Sign-off: the product is "MyNews Editorial CMS".

---

*End of PRD.*