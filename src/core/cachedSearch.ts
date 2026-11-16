import type { Country } from './mapCountryResponse.js';

export type CountryFetcher = (query: string, signal: AbortSignal) => Promise<Country[]>;

interface InFlightEntry {
  promise: Promise<Country[]>;
  controller: AbortController;
  subscribers: number;
}

function withCallerSignal<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  onCallerAbort?: () => void
): Promise<T> {
  if (signal.aborted) {
    onCallerAbort?.();
    return Promise.reject(
      signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')
    );
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      onCallerAbort?.();
      reject(
        signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')
      );
    };

    signal.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
}

export function createCachedSearch(fetcher: CountryFetcher): CountryFetcher {
  const cache = new Map<string, Country[]>();
  const inFlight = new Map<string, InFlightEntry>();

  return (rawQuery: string, signal: AbortSignal): Promise<Country[]> => {
    const key = rawQuery.trim().toLowerCase();

    const cached = cache.get(key);
    if (cached !== undefined) {
      return withCallerSignal(Promise.resolve(cached), signal);
    }

    let entry = inFlight.get(key);
    if (!entry) {
      const internalController = new AbortController();
      const promise = fetcher(key, internalController.signal)
        .then((data) => {
          cache.set(key, data);
          return data;
        })
        .finally(() => {
          inFlight.delete(key);
        });

      entry = {
        promise,
        controller: internalController,
        subscribers: 0,
      };
      inFlight.set(key, entry);
    }

    entry.subscribers += 1;
    const currentEntry = entry;

    return withCallerSignal(currentEntry.promise, signal, () => {
      currentEntry.subscribers -= 1;
      if (currentEntry.subscribers <= 0) {
        currentEntry.controller.abort();
        inFlight.delete(key);
      }
    });
  };
}
