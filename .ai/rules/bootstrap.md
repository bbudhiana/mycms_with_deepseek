---
paths:
    - bootstrap/app.php
---

# Bootstrap

## Sanctum stateful API auth requires EnsureFrontendRequestsAreStateful

In Laravel 13 + Sanctum 4 the api group no longer auto-applies EnsureFrontendRequestsAreStateful, so session-authenticated fetch() calls to /api/* return 401. It is prepended in bootstrap/app.php. Any state-changing fetch to /api/* must also send the X-XSRF-TOKEN header (decoded from the cookie), e.g. media-picker.tsx uses getXsrfToken().
