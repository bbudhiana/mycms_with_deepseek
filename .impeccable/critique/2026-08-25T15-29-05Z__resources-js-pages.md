---
target: MyNews Editorial CMS seluruh surface (resources/js/pages)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 1
timestamp: 2026-08-25T15-29-05Z
slug: resources-js-pages
---
# Critique — MyNews Editorial CMS (resources/js/pages)

Method: dual-agent (A: design review subagent · B: detector CLI + browser overlay)

## Design Health Score: 28/40

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Autosave aria-live 4-state, dirty badge, upload progress, page progress bar |
| 2 | Match System / Real World | 3 | Bahasa editorial fluent; WorkflowStepper render key Inggris mentah |
| 3 | User Control & Freedom | 3 | Batal di mana-mana; no discard confirm on dirty editor, upload queue tak bisa dibatalkan |
| 4 | Consistency & Standards | 2 | ConfirmDialog default destructive untuk semua konfirmasi (merah = bahaya & konfirmasi) |
| 5 | Error Prevention | 3 | Dialog review bagus; publish satu klik tanpa konfirmasi |
| 6 | Recognition Rather Than Recall | 4 | Thumbnail, judul, badge, breadcrumb, filter persist |
| 7 | Flexibility & Efficiency | 2 | Nol keyboard shortcuts, triage 3+ klik, tak ada bulk actions |
| 8 | Aesthetic & Minimalist | 3 | Tenang; debris 4-up MetricCard tiap modul, Tabs satu-tab |
| 9 | Error Recovery | 2 | Autosave onError throw tanpa UI retry; RTE window.prompt |
| 10 | Help & Documentation | 2 | API Docs bagus; nol onboarding, empty state tak mengajar, Passkey dead-end |

## Design Specificity: AUTHENTICATED 60/40

Authored: Newsreader+Inter, masthead palette, funnel konsep produk, bahasa risiko jurnalistik, overdue stack.
Generik: template 4-up MetricCard+PageHeader+Breadcrumbs+tabel di 7 modul; Appearance palsu; Addresses tanpa persona.

Detector CLI: 0 findings. Browser overlay (dashboard/review/contents): tiny body text 6/7/2, undersized functional text 8/0/16, nested cards 4, line length 1, cramped padding 1, overused font Inter 92-93% di semua, kicker+h1 duplikat, cream palette, layout animation height.

## Priority Issues

[P1] Publish satu klik tanpa konfirmasi (Contents/Editor WorkflowActions "Terbit" → router.post publish). Fix: dialog meniru UnpublishDialog, tombol "Ya, Terbitkan".
[P1] Settings/Appearance halaman palsu (tema/font state lokal, "belum diterapkan dinamis"). Fix: sembunyikan sampai theming nyata atau wire token. Passkey card dead-end sama.
[P1] Contents/Index tak ada bulk actions & saved views (PRD janji, hasCheckbox=false). Fix: checkbox baris + toolbar seleksi, atau tandai "Segera".
[P2] Review action row cluster 4 keputusan (Pratinjau/Minta Revisi/Setujui/Tolak). Fix: Setujui satu-satunya filled primary, Tolak ke overflow, akselerator keyboard.
[P3] Autosave failure tanpa UI retry (handleAutosave throw di onError). Fix: error state sticky + tombol Retry.

## Persona Red Flags

Alex: nol shortcuts, triage 3+ klik, no bulk, upload serial tanpa cancel, review row 4 tombol.
Jordan: nol onboarding, empty state tak mengajar, WorkflowStepper Inggris, "Tolak/Minta Revisi" gabung.
Dewi: antrean tak bisa di-sort umur, publish tanpa gate, cancel-schedule tak terlihat.

## Minor Observations

- StatusBadge tak ada scheduled
- Badge BREAKING/PILIHAN EDITOR nempel judul tanpa spasi (data seeder, terlihat live)
- Media copy URL tanpa toast
- Register publik di samping CMS internal
- Select "Select…" Inggris
- AppLayout max-w-7xl, tabel review mengambang
- Drag-drop upload seluruh halaman Media

## Questions

1. Funnel drop approved→published sehat, bukan bottleneck — metrik apa yang benar?
2. Publish tanpa konfirmasi saat approve dapat dialog — asimetri keyakinan?
3. Panjang antrean berapa 4-tombol cluster lebih mahal dari triage?
4. Appearance narasikan ketidaklengkapannya — ship atau tidak?
5. KPI card dihapus dari 4 modul — alur siapa melambat?
