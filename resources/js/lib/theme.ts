export const THEME_KEY = 'mynews-theme';

export function applyTheme(theme: string) {
    const resolved =
        theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'dark'
            : 'light';
    document.documentElement.dataset.theme = resolved;
}

export function initTheme() {
    const stored = localStorage.getItem(THEME_KEY) ?? 'system';
    applyTheme(stored);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(stored));
    window.addEventListener('storage', (e) => {
        if (e.key === THEME_KEY && e.newValue) applyTheme(e.newValue);
    });
}
