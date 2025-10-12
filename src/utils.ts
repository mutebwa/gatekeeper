import type { Entry } from './types';
import { STORAGE_KEY } from './constants';

// Helper function to load/save state for simulation
export const loadEntries = (): Entry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load entries from localStorage", e);
        return [];
    }
};

export const saveEntries = (entries: Entry[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error("Failed to save entries to localStorage", e);
    }
};
