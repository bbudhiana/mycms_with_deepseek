# PRD — MyCMS Basic

## 1. Executive Summary

### Problem Statement

Tim editorial membutuhkan CMS internal yang mampu mengelola artikel, media, kategori, tag, user, role, dan proses persetujuan konten secara aman. Tanpa workflow editorial yang jelas, risiko konten terbit tanpa review, hak akses berlebihan, duplikasi aset, dan kesalahan jadwal publikasi meningkat.

### Proposed Solution

Bangun CMS berbasis Laravel + Inertia React dengan autentikasi kuat, role-based access control, editor artikel rich text, media library, taxonomy management, approval workflow, scheduled publishing, audit activity, dan API terproteksi. Produk menjadi baseline untuk proyek CMS editorial sejenis yang butuh kontrol akses, quality gate, dan pengelolaan konten end-to-end.

### Success Criteria

- 100% halaman internal terlindungi autentikasi dan email verification.
- 100% aksi sensitif memakai policy/permission server-side, bukan hanya UI gating.
- Waktu pembuatan draft artikel lengkap maksimal 5 menit untuk user terlatih.
- 100% konten published melewati status `approved` sebelum publikasi manual atau terjadwal.
- Scheduled publishing diproses tiap menit dengan tingkat kegagalan < 1% pada konten valid.

## 2. User Experience & Functionality

### User Personas

#### Super Admin

Pemilik sistem dengan akses penuh ke user, role, konten, media, taxonomy, workflow, dan audit. Bertanggung jawab menjaga keamanan dan konfigurasi awal sistem.

#### Admin

Pengelola operasional CMS. Mengatur user, kategori, tag, media, konten, dan publikasi harian dengan batasan tidak boleh mengambil alih kontrol Super Admin.

#### Editor

Penanggung jawab kualitas editorial. Membuat/mengedit konten, meninjau submission author, menyetujui, menolak, meminta revisi, menjadwalkan, dan mempublikasikan konten.

#### Author

Penulis konten. Membuat draft, mengedit konten miliknya saat status masih editable, mengunggah media, memberi tag, lalu submit ke review.

#### Viewer

Akun read-only minimal. Dapat login dan melihat area yang diizinkan tanpa kemampuan mengubah data.

### Core Product Modules

#### Authentication & Account Security

- Login berbasis Laravel Fortify.
- Email verification untuk akses halaman internal.
- Password reset dan password confirmation.
- Two-factor authentication.
- Passkey/WebAuthn support.
- Profile, security, appearance, dan address settings.

#### Editorial Dashboard

- Ringkasan published today, pending review, scheduled next 24h, drafts updated this week.
- Recent activity timeline.
- Recent content list.
- Pending review shortcut.
- Scheduled content shortcut.
- Tampilan disesuaikan role: author melihat data miliknya, editor/admin melihat data editorial lebih luas.

#### Content Management

- CRUD artikel dengan field:
    - title
    - sub_title
    - slug
    - excerpt
    - rich text body
    - featured video
    - breaking news flag
    - editor pick flag
    - thumbnail
    - featured image
    - image caption
    - image credit
    - category
    - tags
- List konten dengan search, filter status, filter category, saved view, pagination, dan bulk selection UI.
- Editor artikel dengan SEO preview/checks, tag picker, media picker, read-only state, dan workflow actions.
- HTML body disanitasi server-side memakai HTMLPurifier profile `cms_content`.

#### Editorial Workflow

Status konten:

1. `draft`
2. `review`
3. `approved`
4. `published`
5. `archived`

Allowed transitions:

- `draft` ke `review`
- `review` ke `approved` atau `draft`
- `approved` ke `published` atau `draft`
- `published` ke `archived`
- `archived` ke `draft`

Workflow rules:

- Author hanya boleh submit konten miliknya dari `draft`.
- Reviewer tidak boleh approve konten miliknya sendiri.
- Konten `review`, `approved`, dan `published` tidak boleh diedit langsung.
- Reject dan request changes mengembalikan konten ke `draft` dengan reviewer notes.
- Setiap submit/approve/reject/request changes dicatat ke approval history dan activity log.

#### Publishing

- Publish immediate hanya untuk konten `approved`.
- Schedule publish hanya untuk konten `approved`.
- Cancel schedule tersedia jika konten memiliki scheduled publish pending.
- Unpublish mengembalikan published content ke `draft`.
- Archive hanya untuk published content.
- Scheduled publishing diproses command `publish:scheduled` dan scheduler.
- Scheduled job gagal jika konten hilang atau status konten bukan `approved` saat jadwal tiba.

#### Media Library

- Upload file hingga 10MB.
- Format: JPG, JPEG, PNG, WEBP, GIF, SVG, PDF.
- Upload throttling: 20 request per menit.
- Penyimpanan di disk `public` path `media/YYYY/MM`.
- Randomized filename untuk menghindari collision dan exposure nama file internal.
- Search, filter tipe, pagination grid/list.
- Preview asset.
- Copy URL.
- Edit alt text.
- Delete media dan file fisik.
- Media picker khusus image untuk editor konten.

#### Category Management

- CRUD kategori.
- Hierarchical category tree via `parent_id`.
- Search kategori.
- Count children dan contents.
- Validasi mencegah self-parent pada edit.
- Delete guard:
    - kategori dengan sub-kategori tidak boleh dihapus.
    - kategori yang masih dipakai konten tidak boleh dihapus.

#### Tag Management

- CRUD tag inline.
- Search tag.
- Count konten per tag.
- Auto slug generation via model observer.
- Delete sesuai permission.

#### User & Role Management

- CRUD user.
- Search user by name/email.
- Filter role dan status.
- Aktivasi/deaktivasi user.
- Assign role saat create/update sesuai permission.
- Super Admin dapat mengubah role.
- Admin/editor/author/viewer mengikuti permission matrix.
- User address management untuk admin panel dan settings.
- Invite User UI saat ini belum memiliki backend; tetap non-goal MVP bila proyek sejenis belum butuh invitation flow.

#### API

- API protected by `auth:sanctum` dan `verified`.
- Resource endpoints:
    - users
    - user addresses
    - categories
    - tags
    - media
    - contents
- Extra endpoints:
    - category tree
    - tag search
    - pending review contents
    - scheduled contents
    - approval history
    - workflow actions
    - publish actions
- Response memakai Eloquent API Resources.

#### Audit & Activity Logging

- Activity log menyimpan user, action, entity type, entity id, description, IP address, user agent, dan timestamp.
- Dashboard menampilkan 10 aktivitas terbaru.
- Non-editor hanya melihat aktivitas dirinya sendiri.
- Editor/admin melihat aktivitas editorial lebih luas.

### User Stories & Acceptance Criteria

#### Story 1 — Login Aman

As a user, I want to login with secure authentication so that only authorized people can access CMS.

Acceptance criteria:

- Guest hanya bisa melihat public welcome dan auth screens.
- Internal routes menolak user tanpa login.
- Internal routes menolak user belum verified.
- User dapat reset password.
- User dapat mengaktifkan two-factor authentication.
- User dapat memakai passkey bila tersedia.

#### Story 2 — Author Membuat Draft

As an author, I want to create and edit my own draft so that I can prepare article content before review.

Acceptance criteria:

- Author dapat membuat content baru dengan title dan body wajib.
- Slug otomatis dibuat dari title bila kosong.
- Body kosong setelah strip HTML ditolak.
- HTML body tersanitasi sebelum disimpan.
- Author hanya melihat/mengedit konten miliknya.
- Author tidak dapat edit konten saat status `review`, `approved`, atau `published`.

#### Story 3 — Author Submit Review

As an author, I want to submit draft for editorial review so that editor can approve publication.

Acceptance criteria:

- Tombol submit hanya muncul bila content status `draft` dan content milik user.
- Submit mengubah status ke `review`.
- Submit membuat `content_approvals` action `submitted`.
- Submit membuat activity log.

#### Story 4 — Editor Review Konten

As an editor, I want to approve, reject, or request changes so that editorial quality stays controlled.

Acceptance criteria:

- Review queue hanya berisi status `review`.
- Editor tidak dapat approve konten miliknya sendiri.
- Approve mengubah status ke `approved`, mengisi reviewer dan reviewed_at.
- Reject mengubah status ke `draft` dan menyimpan notes opsional.
- Request changes wajib notes dan mengubah status ke `draft`.
- Semua aksi review tersimpan di approval history.

#### Story 5 — Editor Publish Konten

As an editor, I want to publish approved content now or later so that content release can be controlled.

Acceptance criteria:

- Publish hanya bisa dari `approved`.
- Publish immediate mengubah status ke `published` dan mengisi published_at.
- Schedule hanya bisa dari `approved` dengan `scheduled_at` valid masa depan.
- Cancel schedule menghapus pending schedule.
- Scheduler publish hanya konten yang masih `approved` saat due.
- Scheduler mencatat failed status bila konten invalid.

#### Story 6 — Admin Kelola Media

As an admin/editor/author, I want to upload and reuse media so that article assets are centralized.

Acceptance criteria:

- Upload menerima hanya ekstensi yang diizinkan.
- Upload di atas 10MB ditolak.
- Upload di-throttle 20 request/menit.
- Media tersimpan dengan random filename.
- User dapat search dan filter media.
- User dapat menyalin URL media.
- Alt text dapat diperbarui.
- Delete media menghapus record dan file.

#### Story 7 — Admin Kelola Taxonomy

As an admin/editor, I want to manage categories and tags so that content can be organized.

Acceptance criteria:

- Kategori mendukung parent-child hierarchy.
- Kategori tidak boleh parent ke dirinya sendiri.
- Kategori dengan child tidak dapat dihapus.
- Kategori yang dipakai konten tidak dapat dihapus.
- Tag dapat dibuat, diedit, dicari, dan dihapus sesuai permission.
- Tag menampilkan count konten.

#### Story 8 — Super Admin Kelola User dan Role

As a super admin, I want to manage users and roles so that CMS access follows organization policy.

Acceptance criteria:

- User dapat dibuat dengan name, email, password, role, active status.
- Email user unik.
- Password minimal 8 karakter dan confirmed.
- Super Admin dapat mengubah role user.
- User tidak dapat menghapus akun sendiri.
- User dapat diaktifkan/dinonaktifkan.
- Inactive user harus diblokir dari autentikasi aktif bila aturan ini diaktifkan di Fortify pipeline.

#### Story 9 — API Consumer Mengakses CMS Data

As an API client, I want to access CMS resources through authenticated API so that external systems can integrate safely.

Acceptance criteria:

- Semua API membutuhkan Sanctum token/session valid.
- Semua API membutuhkan verified user.
- API mengikuti permission/policy yang sama dengan web.
- API resource tidak membocorkan password, 2FA secret, recovery codes, atau remember token.

### Non-Goals

- Public website rendering artikel untuk pembaca umum.
- Multi-tenant CMS.
- Visual page builder drag-and-drop.
- Full analytics dashboard selain metric editorial dasar.
- Invite user backend flow.
- Real-time collaborative editing.
- Versioning/revision diff konten.
- CDN/image transformation service.
- Monetization/paywall/subscription.
- AI content generation production-ready; tab `AI Assist` ada di UI, tetapi belum didefinisikan sebagai sistem AI fungsional.

## 3. AI System Requirements

Tidak berlaku untuk MVP saat ini. UI memiliki tab `AI Assist`, tetapi belum ditemukan backend/service AI. Jika proyek sejenis ingin mengaktifkan AI, jadikan modul terpisah dengan requirement berikut:

### Tool Requirements

- Provider LLM via API dengan request timeout dan retry policy.
- Prompt template untuk headline, excerpt, SEO suggestion, dan grammar suggestion.
- Moderation/safety filter untuk output.
- Audit log untuk penggunaan AI.
- Rate limit per user/role.

### Evaluation Strategy

- 50 sampel artikel internal sebagai benchmark.
- SEO title suggestion harus 30–60 karakter pada >= 90% kasus.
- Meta description suggestion harus 70–160 karakter pada >= 90% kasus.
- Output tidak boleh mengubah fakta utama artikel.
- Semua output AI harus require human approval sebelum disimpan.

## 4. Technical Specifications

### Architecture Overview

#### Stack

- Backend: PHP 8.5, Laravel 13.
- Frontend: React 19, Inertia.js v3, TypeScript, Vite.
- Styling/UI: Tailwind CSS v4, Radix UI primitives, Lucide icons, Sonner toast.
- Auth: Laravel Fortify, Sanctum, Passkeys, 2FA.
- Authorization: Spatie Laravel Permission + Laravel Policies.
- Database: MariaDB/MySQL/SQLite supported, MariaDB active.
- Testing: Pest 4, PHPUnit 12.
- Static analysis/style: Larastan/PHPStan, Pint, ESLint, Prettier, TypeScript.
- Route typing: Laravel Wayfinder.

#### High-Level Flow

1. Browser loads Inertia React page from Laravel web route.
2. User authenticates via Fortify.
3. `auth` + `verified` middleware protects CMS routes.
4. Controllers authorize action using policies/permissions.
5. Form Requests validate and sanitize input.
6. Services execute business workflows in DB transactions where needed.
7. Eloquent models persist data and relationships.
8. Inertia returns page props to React.
9. React pages submit actions via Inertia router/Wayfinder routes.
10. Toast/flash feedback shown after redirect.

#### Content Workflow Flow

1. Author creates content as `draft`.
2. Author edits draft and attaches category, tags, media.
3. Author submits draft.
4. System changes status to `review` and records approval entry.
5. Editor reviews from Review Queue.
6. Editor approves, rejects, or requests changes.
7. Approved content can be published now or scheduled.
8. Scheduler processes due scheduled publishes.
9. Published content can be unpublished or archived.

### Data Model

#### users

Stores account, profile, security, and active status.

Key fields:

- name
- email
- profile_photo_path
- job_title
- bio
- email_verified_at
- password
- two_factor_secret
- two_factor_recovery_codes
- two_factor_confirmed_at
- is_active

#### roles / permissions / model_has_roles / model_has_permissions / role_has_permissions

Spatie permission tables for RBAC.

Roles:

- super_admin
- admin
- editor
- author
- viewer

Permissions:

- login
- manage_user
- change_role
- create_content
- edit_any_content
- edit_own_content
- delete_content
- approve_content
- publish_content
- manage_category
- manage_tag
- manage_media
- upload_media
- view_analytics
- view_audit_log

#### contents

Stores article content and editorial metadata.

Key fields:

- title
- sub_title
- slug
- excerpt
- body
- featured_video
- breaking_news_flag
- editor_pick_flag
- featured_image_id
- image_caption
- image_credit
- thumbnail_id
- category_id
- status
- author_id
- reviewer_id
- reviewed_at
- published_at

#### content_approvals

Stores workflow history.

Key fields:

- content_id
- reviewer_id
- action
- notes
- created_at

#### scheduled_publishes

Stores delayed publish jobs.

Key fields:

- content_id
- scheduled_at
- status
- processed_at
- error_message

#### media

Stores uploaded asset metadata.

Key fields:

- filename
- original_name
- path
- mime_type
- size
- alt_text
- uploaded_by

#### categories

Stores hierarchical taxonomy.

Key fields:

- name
- slug
- description
- parent_id

#### tags

Stores flat taxonomy.

Key fields:

- name
- slug

#### content_tags

Pivot table between contents and tags.

#### activity_logs

Stores user activity audit trail.

Key fields:

- user_id
- action
- entity_type
- entity_id
- description
- ip_address
- user_agent
- created_at

#### addresses

Stores user addresses for profile/admin use.

Key fields:

- user_id
- label
- address_line1
- address_line2
- city
- state
- postal_code
- country
- is_primary
- latitude
- longitude
- notes

### Backend Components

#### Controllers

- `DashboardController`: dashboard metrics and summaries.
- `ContentController`: web CRUD content.
- `ContentWorkflowController`: web submit/approve/reject/request changes.
- `ContentPublishController`: web publish/schedule/cancel/unpublish/archive.
- `ContentReviewController`: review queue.
- `MediaLibraryController`: web media library and picker.
- `CategoryManagementController`: web category management.
- `TagManagementController`: web tag management.
- `UserManagementController`: web user management.
- `UserAddressController`: admin user addresses.
- `RoleManagementController`: role display.
- `ApiDocsController`: API docs page.
- `Api/*Controller`: API CRUD/query/workflow/publish resources.

#### Services

- `ContentWorkflowService`: submit, approve, reject, request changes inside DB transactions.
- `ContentPublishService`: publish, schedule, cancel schedule, unpublish, archive.
- `ActivityLogService`: centralized activity records.
- `CmsDataService`: shared CMS lookup data for categories/tags.

#### Policies

- `ContentPolicy`
- `UserPolicy`
- `MediaPolicy`
- `CategoryPolicy`
- `TagPolicy`
- `RolePolicy`

Policy requirements:

- Every write action must be authorized server-side.
- UI can hide buttons, but policy remains source of truth.
- Own-content rules must be enforced in both web and API.

#### Form Requests

- `ContentRequest`: validates content and sanitizes HTML.
- `MediaRequest`: validates upload and permission.
- `CategoryRequest`
- `TagRequest`
- `UserRequest`
- Settings requests for profile, password, 2FA, address, deletion.

### Frontend Components

#### Pages

- `welcome`: public landing page.
- `auth/*`: login, forgot password, reset password, verify email, confirm password, 2FA challenge.
- `dashboard`: editorial dashboard.
- `contents/index`: content list.
- `contents/editor`: article editor and workflow panel.
- `review/index`: review queue.
- `media/index`: media library.
- `categories/index` and `categories/form`: category management.
- `tags/index`: tag management.
- `users/index`, `users/form`, `users/addresses`: user management.
- `roles/index`: roles/permissions overview.
- `settings/*`: profile, security, appearance, addresses.
- `api-docs/index`: API documentation.

#### Shared UI

- Page header.
- Section cards.
- Metric cards.
- Status badges.
- Filter bar.
- Responsive table shell.
- Empty state.
- Confirm dialog.
- Activity timeline.
- Media picker.
- Rich text editor.
- Safe HTML renderer.
- Radix-based UI primitives.

### Integration Points

#### Web Routes

Protected by `auth` and `verified`:

- `/dashboard`
- `/contents`
- `/review`
- `/users`
- `/users/{user}/addresses`
- `/roles`
- `/media`
- `/categories`
- `/tags`
- `/api-docs`

#### API Routes

Protected by `auth:sanctum` and `verified`:

- `/api/users`
- `/api/users/{user}/role`
- `/api/users/{user}/activate`
- `/api/users/{user}/deactivate`
- `/api/users/{user}/addresses`
- `/api/categories/tree`
- `/api/categories`
- `/api/tags/search`
- `/api/tags`
- `/api/media`
- `/api/contents/pending-review`
- `/api/contents/scheduled`
- `/api/contents/{content}/approval-history`
- `/api/contents/{content}/submit`
- `/api/contents/{content}/approve`
- `/api/contents/{content}/reject`
- `/api/contents/{content}/request-changes`
- `/api/contents/{content}/publish`
- `/api/contents/{content}/schedule`
- `/api/contents/{content}/unpublish`
- `/api/contents/{content}/archive`
- `/api/contents`

#### Scheduler

- Command: `php artisan publish:scheduled`.
- Development worker: `php artisan schedule:work`.
- Production cron: run `php artisan schedule:run` every minute.

#### Storage

- Public disk required.
- `php artisan storage:link` required.
- Uploaded media served from storage URL.

### Security & Privacy

#### Authentication

- All CMS web routes require `auth` and `verified`.
- Fortify handles login, password reset, email verification, 2FA, passkeys.
- Passwords hashed by Laravel casts.
- Sensitive user fields hidden: password, 2FA secret, recovery codes, remember token.

#### Authorization

- Spatie roles/permissions define coarse access.
- Laravel policies enforce object-level access.
- Authors restricted to own content for view/edit.
- Separation of duty: author cannot approve own content.
- Server-side authorization mandatory for web and API.

#### Input Validation

- Form Requests validate server-side.
- Content title required, max 255.
- Content body required and must contain non-empty text after HTML stripped.
- Slug unique.
- Media IDs must exist.
- Category and tag IDs must exist.
- Uploads max 10MB and restricted mime/extensions.

#### XSS Protection

- Rich text content sanitized server-side with HTMLPurifier.
- Display of stored HTML uses safe rendering component.
- Featured video HTML also sanitized.

#### Rate Limiting

- Media upload throttled to 20 requests/minute.
- Additional API rate limits should be added for public/external consumers.

#### Auditability

- Workflow actions create approval history.
- Business actions create activity logs with IP/user agent.
- Audit logs support investigation of content/user/media changes.

#### Privacy

- Do not expose full user security fields through API or Inertia props.
- Treat profile photo, bio, address, IP, and user agent as personal data.
- Role changes and account deactivation should be auditable in future iterations.

### Performance Requirements

- Dashboard queries must avoid N+1 by eager loading relations.
- Content list paginated at 15 items/page.
- User list paginated at 20 items/page.
- Media library paginated at 24 items/page.
- Tag list paginated at 20 items/page.
- Review queue paginated.
- Search should respond < 500ms for 10k contents with proper indexes.
- Scheduled publish command should process due batch within 60 seconds for normal editorial volume.

### Accessibility & Responsive Requirements

- CMS must support desktop and tablet editorial workflows.
- Mobile layout must remain usable for review and quick status checks.
- Buttons and form fields need visible focus states.
- Destructive actions require confirmation dialog.
- Media images need alt text support.
- Status should not rely on color only; labels required.

### Testing Requirements

#### Backend Feature Tests

- Auth flow: login, registration, password reset, verification, 2FA.
- Content CRUD permissions by role.
- Workflow transitions and blocked invalid transitions.
- Publish, schedule, cancel schedule, unpublish, archive.
- Category CRUD and delete guards.
- Tag CRUD.
- Media upload validation, update alt text, delete.
- User management permissions.
- API auth and permission enforcement.

#### Unit Tests

- ContentStatus transition rules.
- Policies for each role.
- Cache invalidation around taxonomy/media if applicable.
- Scheduled publish command due/failed cases.

#### Static Quality Gates

- `vendor/bin/pint`
- `composer run types:check`
- `npm run lint:check`
- `npm run format:check`
- `npm run types:check`
- `php artisan test --compact`

## 5. Risks & Roadmap

### Technical Risks

#### Workflow State Drift

Risk: UI actions and backend policy can diverge, causing buttons to appear for invalid states.

Mitigation:

- Treat policy response from backend as source of truth.
- Add tests per status transition and role.
- Generate frontend route/action helpers with Wayfinder.

#### Scheduled Publish Failure

Risk: Scheduler not running in production, causing approved scheduled content not to publish.

Mitigation:

- Add health check for scheduler heartbeat.
- Add failed schedule admin view.
- Alert if pending schedule is overdue by > 5 minutes.

#### XSS Through Rich Text

Risk: Rich text editor can submit unsafe HTML.

Mitigation:

- Keep server-side HTMLPurifier whitelist.
- Test unsafe tags/attributes.
- Sanitize all rendered rich text, including featured video embeds.

#### Permission Misconfiguration

Risk: Role seeder grants too broad access or production permissions become stale.

Mitigation:

- Permission matrix as version-controlled source of truth.
- Role/permission tests.
- Admin UI should show effective permissions read-only before editing support added.

#### Media Storage Growth

Risk: Local public storage grows without lifecycle management.

Mitigation:

- Track unused media.
- Add storage quota and cleanup job.
- Consider S3-compatible storage and CDN for production.

#### Invite UI Without Backend

Risk: User expects invite flow works because UI button exists.

Mitigation:

- Hide invite button until backend implemented or label as coming soon.
- Prioritize invitation flow in v1.1 if needed.

#### Hardcoded URLs In Some Frontend Areas

Risk: Route changes break pages using string URLs.

Mitigation:

- Convert all frontend navigation/actions to Wayfinder route imports.
- Add TypeScript route checks in CI.

### Product Risks

#### Editorial Adoption

Risk: Users bypass workflow if steps feel heavy.

Mitigation:

- Keep primary action prominent.
- Provide clear status labels and next-step guidance.
- Add dashboard shortcuts for pending tasks.

#### Role Ambiguity

Risk: Organizations have custom editorial roles not matching five default roles.

Mitigation:

- Keep default roles as baseline.
- Add configurable custom roles/permissions in later phase.

#### Content Model Variance

Risk: Project sejenis may need pages, events, products, or custom fields beyond article model.

Mitigation:

- Define content type abstraction in v2.0.
- Keep MVP focused on article/news editorial workflow.

### Phased Rollout

#### MVP

- Auth and verified internal access.
- Roles and permissions seed.
- Dashboard metrics.
- Content CRUD.
- Rich text editor.
- Media library.
- Category and tag management.
- Submit/review/approve/reject/request changes.
- Publish immediate.
- Schedule publish command.
- User management.
- API protected by Sanctum.
- Activity logs.
- Feature and policy tests for core flows.

#### v1.1

- Invite user backend flow.
- Scheduler monitoring dashboard.
- Failed scheduled publish retry UI.
- Content revision history.
- Audit log full UI with filters.
- Better API docs with examples and token instructions.
- Convert remaining hardcoded frontend URLs to Wayfinder.
- Bulk content actions backend.
- Media usage tracking.

#### v1.2

- Public content delivery API.
- Preview URL for unpublished content.
- SEO metadata fields expanded.
- OpenGraph/Twitter Card support.
- Image focal point/crop metadata.
- Advanced search with indexing.
- Notification system for review requests and approvals.

#### v2.0

- Multi-content-type architecture.
- Custom fields/schema builder.
- Multi-site or multi-tenant support.
- CDN/object storage integration.
- AI assist production module with evaluation and human approval.
- Collaborative editing or editorial comments.
- Analytics module for published content performance.

## Review Findings Summary

### Strengths

- Stack modern and coherent: Laravel 13, Inertia v3, React 19, TypeScript, Tailwind v4.
- Clear editorial status lifecycle exists in enum and policies.
- Authorization is layered through Spatie permission and Laravel policies.
- Rich text content is sanitized server-side.
- Media upload has size/type validation and rate limit.
- Dashboard already role-aware.
- API and web routes both protected.
- Tests already cover many feature areas.

### Gaps For Future Improvement

- Invite User UI exists but backend not available.
- `AI Assist` tab exists but AI capability not implemented.
- Some frontend routes still use hardcoded URLs instead of Wayfinder.
- Scheduled publishing needs production monitoring/alerting.
- Audit log exists as data and dashboard feed, but full audit UI is not visible.
- Public article consumption layer is out of scope and must be built separately if product needs visitor-facing website.
