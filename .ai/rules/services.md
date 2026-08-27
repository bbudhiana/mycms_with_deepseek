---
paths:
  - app/Services/AiAutopilotService.php
---

# Services

## Autopilot author: hanya dari schedule, bukan operator
Penulis konten autopilot selalu diambil dari `schedule.author_id`; fallback ke super_admin pertama bila null. User yang memicu "Jalankan Sekarang" TIDAK menjadi penulis — mereka hanya operator. Method `run()` punya parameter `?int $triggeredBy` untuk tujuan audit (siapa yang trigger), bukan untuk jadi author. Untuk mencegah regresi: signature `generateOne(AiSchedule $schedule)` tidak terima author override.

## Autopilot field assignment (konten hasil AI)
- `thumbnail_id` SELALU sama dengan `featured_image_id` (1 unduhan, 1 media, dipakai dua kali).
- `image_caption` = kalimat pertama dari `excerpt` (potong di `.!?` pertama; fallback ke `sub_title`).
- `image_credit` mengikuti `image_provider` di AiProviderSetting: pexels→"Pexels", custom→"Custom Image Source". Saat image_enabled=false, credit=null.
- `sub_title` dari AI; jika AI mengembalikan nilai yang sama dengan `title`, service ganti dengan firstSentence(excerpt).
- `breaking_news_flag` dan `editor_pick_flag` adalah boolean yang diputuskan AI — service tidak override.
- Kategori & Tag: resolve dari marker `Kategori: 'X'` / `Tag: 'X'` di `topic_direction` (per baris). Default kategori `Teknologi`, default tag `Edukasi`. `firstOrCreate` by slug sehingga run berulang tidak duplicate.
