function withCallerSignal(promise, signal, onCallerAbort) {
    if (signal.aborted) {
        onCallerAbort?.();
        return Promise.reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            onCallerAbort?.();
            reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then((value) => {
            signal.removeEventListener('abort', onAbort);
            resolve(value);
        }, (error) => {
            signal.removeEventListener('abort', onAbort);
            reject(error);
        });
    });
}
export function createCachedSearch(fetcher) {
    const cache = new Map();
    const inFlight = new Map();
    return (rawQuery, signal) => {
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
