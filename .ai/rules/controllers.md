---
paths:
  - app/Http/Controllers/SettingsController.php
  - 'app/Http/Controllers/Ai*.php'
---

# Controllers

## Profile photos are custom, not Fortify

Fortify v1.38 has no `profilePhotos()` feature and does NOT register `/user/profile-photo`. Profile photo upload/delete is handled by custom routes `POST/DELETE /settings/profile-photo` (SettingsController) storing to `profile-photos` on the public disk and persisting `users.profile_photo_path`. The `profile_photo_url` is an appended accessor on the User model.

## Integrasi AI di-gate ke super_admin, bukan permission
Group route Integrasi AI (`/ai/*`) di web.php memakai middleware `role:super_admin`. Akses dikunci role murni (bukan permission Spatie) karena fitur rahasia/kritikal. Jangan pindahkan ke permission gate atau `Gate::before`. Api key AI disimpan encrypted (`AiProviderSetting.api_key` cast 'encrypted'), dan frontend mengirim placeholder '••••••••' yang harus diabaikan oleh update agar key lama dipertahankan. Scheduler autopilot ada di routes/console.php (`ai:autopilot` everyMinute).

## Autopilot: image_enabled toggle + author dari schedule
Fitur gambar autopilot dikontrol boolean `image_enabled` di ai_provider_settings (bukan oleh ada/tidaknya URL). Image fetch hanya jalan jika `image_enabled` true DAN `image_endpoint_url` terisi (validasi wajib saat enabled). Saat mati, featured_image dikosongkan. Author konten autopilot diambil dari `ai_schedules.author_id` (dropdown user role 'author' di form jadwal); fallback ke user super_admin pertama bila null. Jalankan-sekarang tetap memakai actor (super_admin) via userOverride.

## Image autopilot: provider pexels/custom
Gambar autopilot punya 2 provider di `ai_provider_settings.image_provider`: `pexels` (panggil https://api.pexels.com/v1/search dengan header `Authorization: <key>` dari `image_api_key`, ambil photos[0].src.large2x) dan `custom` (pakai `image_endpoint_url`). Key Pexels disimpan encrypted, frontend kirim '••••••••' yang diabaikan. Validasi: pexels→image_api_key wajib, custom→image_endpoint_url wajib, keduanya hanya saat `image_enabled` true. Saat pindah provider dari pexels, key lama dihapus.
