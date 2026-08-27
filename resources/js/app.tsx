import '../css/app.css';
import type { ReactNode } from 'react';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster, toast } from 'sonner';
import { AppLayout } from './layouts/AppLayout';
import { initTheme } from './lib/theme';

// Flash toast listener dipasang sekali di bootstrap agar tidak bergantung pada
// lifecycle layout (AppLayout persist). `router.on('flash', ...)` mendaftarkan
// listener DOM global; listener fire tiap Inertia client menerima event
// `inertia:flash`, yang dipancarkan oleh core saat `page.flash` root terisi.
router.on('flash', (event) => {
    const f = (event.detail.flash ?? {}) as { success?: string; error?: string; info?: string };
    if (f.success) toast.success(f.success);
    if (f.error) toast.error(f.error);
    if (f.info) toast.info(f.info);
});

// Inertia v3 menampilkan <dialog id="inertia-error-dialog"> setiap menerima
// respons non-Inertia (mis. 204 No Content dari endpoint autosave). Respons
// sukses non-Inertia (status < 400) sebenarnya bukan kesalahan — suppress
// dialog tersebut agar editor autosave tidak memunculkan modal kosong tiap
// beberapa detik.
document.addEventListener('inertia:httpException', (event) => {
    const response = (event as CustomEvent<{ response: { status?: number } }>).detail?.response;
    if (response && typeof response.status === 'number' && response.status < 400) {
        event.preventDefault();
    }
});

createInertiaApp({
    title: (title) => (title ? `${title} — MyNews` : 'MyNews'),
    resolve: async (name) => {
        const page = (await resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'))) as any;

        page.default.layout ??= (pageNode: ReactNode) => {
            if (name === 'Welcome' || name.startsWith('Auth/')) {
                return pageNode;
            }

            return <AppLayout>{pageNode}</AppLayout>;
        };

        return page.default;
    },
    setup({ el, App, props }: { el: HTMLElement | null; App: React.ComponentType<any>; props: any }) {
        if (!el) return;
        initTheme();
        createRoot(el).render(
            <>
                <App {...props} />
                <Toaster position="top-right" richColors closeButton />
            </>,
        );
    },
    progress: {
        color: '#B01E23',
        showSpinner: false,
    },
});
