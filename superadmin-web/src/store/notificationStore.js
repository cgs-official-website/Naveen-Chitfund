import { create } from 'zustand';

const STORAGE_KEY = 'sa_read_notifications';

const getInitialDismissed = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useNotificationStore = create((set, get) => ({
  dismissedIds: getInitialDismissed(),

  // Mark an item as clicked/read (so badge and item disappear)
  dismissNotification: (id) => {
    set((state) => {
      if (state.dismissedIds.includes(id)) return state;
      const updated = [...state.dismissedIds, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { dismissedIds: updated };
    });
  },

  // Dismiss by path or module tag
  dismissByPath: (path) => {
    set((state) => {
      if (state.dismissedIds.includes(path)) return state;
      const updated = [...state.dismissedIds, path];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { dismissedIds: updated };
    });
  },

  // Clear all notifications
  dismissAll: (allIds = []) => {
    set((state) => {
      const merged = Array.from(new Set([...state.dismissedIds, ...allIds]));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return { dismissedIds: merged };
    });
  },

  resetDismissed: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ dismissedIds: [] });
  },
}));
