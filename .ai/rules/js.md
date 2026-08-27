---
paths:
  - resources/js/app.tsx
---

# Js

## Flash listener: satu kali di bootstrap app.tsx
Toast flash dipasang di bootstrap `app.tsx` via `router.on('flash', ...)` — SEKALI seumur hidup aplikasi, bukan di AppLayout. Hindari duplikasi listener (Inertia v3 layout persist + effect deps [] dapat mendaftarkan listener lebih dari sekali bila dipasang di layout). Server side: `PromoteFlashToInertia` middleware memindahkan session flash Laravel (`success`/`error`/`info`) ke `Inertia::flash()` agar Inertia core memancarkan event `inertia:flash`. `HandleInertiaRequests::share()` tidak membagikan `props.flash` lagi.

## Inertia httpException: suppress untuk status < 400
Listener `inertia:httpException` dipasang sekali di bootstrap `resources/js/app.tsx`. Listener `preventDefault()` event bila `response.status < 400` (respons sukses non-Inertia seperti 204 No Content dari endpoint autosave). Tanpa listener ini, Inertia v3 menampilkan `<dialog id="inertia-error-dialog">` berisi iframe kosong untuk setiap respons non-Inertia — membuat modal putih besar menutupi editor tiap beberapa detik. Untuk endpoint yang mengembalikan 204 plain (bukan Inertia JSON shape), gunakan `response()->noContent()` dengan listener ini. Jika endpoint butuh Inertia shape, kembalikan JSON Inertia dengan `X-Inertia: true`.
