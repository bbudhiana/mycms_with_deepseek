<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Promote Laravel session flash keys (success/error/info) into the Inertia
 * flash channel so the client can render them via the `inertia:flash` event.
 *
 * Tanpa middleware ini, controller hanya menaruh flash di session Laravel
 * biasa; Inertia menerima nilai itu via `HandleInertiaRequests::share()`
 * di prop `flash`. Inertia core lalu mempertahankan referensi prop bila
 * nilainya deep-equal antar navigasi (`preserveEqualProps`), sehingga
 * `useEffect([page.props.flash])` tidak terpicu untuk update berulang
 * dengan pesan persis sama → toast tidak muncul sejak pembaruan kedua.
 *
 * Setelah dipindahkan ke `Inertia::flash()`, flash dibaca oleh
 * `resolveFlashData()` di Inertia Laravel dan dipancarkan sebagai event
 * `inertia:flash` — tidak bergantung pada referensi props.
 */
class PromoteFlashToInertia
{
    private const KEYS = ['success', 'error', 'info'];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->hasSession()) {
            return $response;
        }

        $session = $request->session();
        $flash = [];

        foreach (self::KEYS as $key) {
            if ($session->has($key)) {
                $flash[$key] = $session->get($key);
                $session->forget($key);
            }
        }

        if ($flash !== []) {
            Inertia::flash($flash);
        }

        return $response;
    }
}
