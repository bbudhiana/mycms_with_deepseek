import '../css/app.css';
import type { ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { AppLayout } from './layouts/AppLayout';

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
    setup({ el, App, props }) {
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
