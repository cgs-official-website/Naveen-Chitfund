import { create } from 'zustand';
const getInitialSession = () => {
    try {
        const rawAdmin = sessionStorage.getItem('sa_admin');
        const refresh = sessionStorage.getItem('sa_refresh');
        const access = sessionStorage.getItem('sa_access');
        return {
            admin: rawAdmin ? JSON.parse(rawAdmin) : null,
            refreshToken: refresh || null,
            accessToken: access || null,
        };
    }
    catch {
        return { admin: null, refreshToken: null, accessToken: null };
    }
};
const initial = getInitialSession();
export const useAuthStore = create((set) => ({
    accessToken: initial.accessToken,
    refreshToken: initial.refreshToken,
    admin: initial.admin,
    isAuthenticated: Boolean(initial.accessToken && initial.admin),
    login: (accessToken, refreshToken, admin) => {
        sessionStorage.setItem('sa_access', accessToken);
        sessionStorage.setItem('sa_refresh', refreshToken);
        sessionStorage.setItem('sa_admin', JSON.stringify(admin));
        set({
            accessToken,
            refreshToken,
            admin,
            isAuthenticated: true,
        });
    },
    logout: () => {
        sessionStorage.removeItem('sa_access');
        sessionStorage.removeItem('sa_refresh');
        sessionStorage.removeItem('sa_admin');
        set({
            accessToken: null,
            refreshToken: null,
            admin: null,
            isAuthenticated: false,
        });
    },
    setAccessToken: (accessToken) => {
        sessionStorage.setItem('sa_access', accessToken);
        set({ accessToken, isAuthenticated: true });
    },
    clearMustChangePassword: () => {
        set((state) => {
            if (!state.admin)
                return state;
            const updated = { ...state.admin, mustChangePassword: false };
            sessionStorage.setItem('sa_admin', JSON.stringify(updated));
            return { admin: updated };
        });
    },
}));
