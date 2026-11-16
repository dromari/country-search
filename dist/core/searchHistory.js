const STORAGE_KEY = 'country_search_history';
const MAX_HISTORY_ITEMS = 5;
export function getSearchHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((item) => typeof item === 'string')
            : [];
    }
    catch {
        return [];
    }
}
export function addToSearchHistory(query) {
    const normalized = query.trim();
    if (!normalized) {
        return getSearchHistory();
    }
    const current = getSearchHistory().filter((item) => item.toLowerCase() !== normalized.toLowerCase());
    const updated = [normalized, ...current].slice(0, MAX_HISTORY_ITEMS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    catch {
        // Ignore the error if localStorage is full or disabled
    }
    return updated;
}
