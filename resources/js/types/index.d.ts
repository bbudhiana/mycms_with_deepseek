import type { PageProps as BasePageProps } from '@inertiajs/core';

declare module '@inertiajs/core' {
    interface PageProps extends BasePageProps {
        auth?: {
            user?: {
                id: number;
                name: string;
                email: string;
                job_title: string | null;
                bio: string | null;
                is_active: boolean;
                profile_photo_url: string | null;
                roles: string[];
                permissions: string[];
            } | null;
        };
        flash?: {
            success?: string | null;
            error?: string | null;
            info?: string | null;
        };
    }
}

export {};
