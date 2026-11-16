import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchManager } from '../core/searchManager.js';
describe('searchManager (Race Condition, Abort & Timeout)', () => {
    const mockFetch = vi.fn();
    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        vi.resetAllMocks();
    });
    it('should abort previous request on new input and resolve race condition in favor of the latest query', async () => {
        let resolveFirstRequest;
        let firstSignalAborted = false;
        mockFetch.mockImplementationOnce((_url, options) => {
            return new Promise((resolve, reject) => {
                resolveFirstRequest = resolve;
                options?.signal?.addEventListener('abort', () => {
                    firstSignalAborted = true;
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => [
                {
                    name: { common: 'Spain', official: 'Kingdom of Spain' },
                    capital: ['Madrid'],
                    region: 'Europe',
                    population: 47351567,
                    area: 505992,
                    flags: { svg: 'https://flagcdn.com', png: 'https://flagcdn.com' },
                },
            ],
        });
        let latestState = { status: 'idle', countries: [], error: null };
        const manager = createSearchManager((state) => {
            latestState = state;
        }, 300);
        manager.handleInput('sp');
        await vi.advanceTimersByTimeAsync(300);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        manager.handleInput('spain');
        expect(firstSignalAborted).toBe(true);
        await vi.advanceTimersByTimeAsync(300);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(latestState.status).toBe('success');
        expect(latestState.countries[0]?.name).toBe('Spain');
        resolveFirstRequest({
            ok: true,
            status: 200,
            json: async () => [
                {
                    name: { common: 'Somalia', official: 'Federal Republic of Somalia' },
                    capital: ['Mogadishu'],
                    region: 'Africa',
                    population: 15893219,
                    area: 637657,
                    flags: { svg: 'https://flagcdn.com', png: 'https://flagcdn.com' },
                },
            ],
        });
        expect(latestState.countries[0]?.name).toBe('Spain');
        expect(latestState.error).toBeNull();
    });
    it('should handle TimeoutError separately from AbortError and expose user-facing error', async () => {
        mockFetch.mockImplementationOnce((_url, options) => {
            return new Promise((_resolve, reject) => {
                options?.signal?.addEventListener('abort', () => {
                    reject(options.signal?.reason ?? new DOMException('Aborted', 'AbortError'));
                });
            });
        });
        let latestState = { status: 'idle', countries: [], error: null };
        const manager = createSearchManager((state) => {
            latestState = state;
        }, 300, 3000);
        manager.handleInput('spain');
        await vi.advanceTimersByTimeAsync(300);
        expect(latestState.status).toBe('loading');
        await vi.advanceTimersByTimeAsync(3000);
        expect(latestState.status).toBe('error');
        expect(latestState.error).toMatch(/timeout/i);
    });
    it('should clear results and abort active request when input becomes empty', async () => {
        let signalAborted = false;
        mockFetch.mockImplementationOnce((_url, options) => {
            return new Promise((_resolve, reject) => {
                options?.signal?.addEventListener('abort', () => {
                    signalAborted = true;
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });
        });
        let latestState = { status: 'idle', countries: [], error: null };
        const manager = createSearchManager((state) => {
            latestState = state;
        }, 300);
        manager.handleInput('spain');
        await vi.advanceTimersByTimeAsync(300);
        expect(latestState.status).toBe('loading');
        manager.handleInput('   ');
        expect(signalAborted).toBe(true);
        expect(latestState.status).toBe('idle');
        expect(latestState.countries).toEqual([]);
        expect(latestState.error).toBeNull();
    });
});
