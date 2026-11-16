import { debounce } from './debounce.js';
import { searchCountries } from './searchCountries.js';
import { createCachedSearch } from './cachedSearch.js';
import { HttpError } from './HttpError.js';
import type { Country } from './mapCountryResponse.js';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface SearchState {
  status: SearchStatus;
  countries: Country[];
  error: string | null;
}

export interface SearchManager {
  handleInput: (rawQuery: string) => void;
  searchImmediate: (rawQuery: string) => void;
  retry: () => void;
}

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_TIMEOUT_MS = 5000;

export function createSearchManager(
  onStateChange: (state: SearchState) => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  onSuccessQuery?: (query: string) => void
): SearchManager {
  const cachedSearch = createCachedSearch(searchCountries);
  let activeController: AbortController | null = null;
  let lastQuery = '';

  const abortActiveRequest = (): void => {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  };

  const executeSearch = async (query: string): Promise<void> => {
    abortActiveRequest();

    const controller = new AbortController();
    activeController = controller;

    onStateChange({
      status: 'loading',
      countries: [],
      error: null,
    });

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Request timeout', 'TimeoutError'));
    }, timeoutMs);

    try {
      const countries = await cachedSearch(query, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      if (countries.length > 0 && onSuccessQuery) {
        onSuccessQuery(query);
      }

      onStateChange({
        status: countries.length > 0 ? 'success' : 'empty',
        countries,
        error: null,
      });
    } catch (error: unknown) {
      const abortReason = controller.signal.reason;

      if (
        (error instanceof DOMException && error.name === 'TimeoutError') ||
        (abortReason instanceof DOMException && abortReason.name === 'TimeoutError')
      ) {
        onStateChange({
          status: 'error',
          countries: [],
          error: 'Request timeout: the server took too long to respond.',
        });
        return;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      if (error instanceof HttpError) {
        onStateChange({
          status: 'error',
          countries: [],
          error: `Server error (${error.status}): failed to load countries.`,
        });
        return;
      }

      onStateChange({
        status: 'error',
        countries: [],
        error: 'Network error: please check your internet connection.',
      });
    } finally {
      clearTimeout(timeoutId);
      if (activeController === controller) {
        activeController = null;
      }
    }
  };

  const debouncedSearch = debounce((query: string) => {
    if (query) {
      void executeSearch(query);
    }
  }, debounceMs);

  const handleInput = (rawQuery: string): void => {
    const trimmed = rawQuery.trim();
    lastQuery = trimmed;

    abortActiveRequest();

    if (!trimmed) {
      onStateChange({
        status: 'idle',
        countries: [],
        error: null,
      });
      return;
    }

    debouncedSearch(trimmed);
  };

  const searchImmediate = (rawQuery: string): void => {
    const trimmed = rawQuery.trim();
    lastQuery = trimmed;
    if (trimmed) {
      void executeSearch(trimmed);
    }
  };

  const retry = (): void => {
    if (lastQuery) {
      void executeSearch(lastQuery);
    }
  };

  return {
    handleInput,
    searchImmediate,
    retry,
  };
}
