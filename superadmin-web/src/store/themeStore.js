import { create } from 'zustand';
const getInitialTheme = () => {
    const saved = localStorage.getItem('sa_theme');
    if (saved !== null) {
        return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};
export const useThemeStore = create((set) => ({
    isDark: getInitialTheme(),
    toggleTheme: () => set((state) => {
        const next = !state.isDark;
        localStorage.setItem('sa_theme', next ? 'dark' : 'light');
        if (next) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
        return { isDark: next };
    }),
    setTheme: (dark) => {
        localStorage.setItem('sa_theme', dark ? 'dark' : 'light');
        if (dark) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
        set({ isDark: dark });
    },
}));
