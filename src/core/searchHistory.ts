const STORAGE_KEY = 'country_search_history';
const MAX_HISTORY_ITEMS = 5;

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): string[] {
  const normalized = query.trim();
  if (!normalized) {
    return getSearchHistory();
  }

  const current = getSearchHistory().filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase()
  );
  const updated = [normalized, ...current].slice(0, MAX_HISTORY_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore the error if localStorage is full or disabled
  }

  return updated;
}
