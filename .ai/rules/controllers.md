---
paths:
  - app/Http/Controllers/SettingsController.php
---

# Controllers

## Profile photos are custom, not Fortify
Fortify v1.38 has no `profilePhotos()` feature and does NOT register `/user/profile-photo`. Profile photo upload/delete is handled by custom routes `POST/DELETE /settings/profile-photo` (SettingsController) storing to `profile-photos` on the public disk and persisting `users.profile_photo_path`. The `profile_photo_url` is an appended accessor on the User model.
