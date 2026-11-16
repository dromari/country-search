import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchCountries } from '../core/searchCountries.js';
import { HttpError } from '../core/HttpError.js';

describe('searchCountries', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('should return mapped countries on a successful 200 response', async () => {
    const rawApiResponse = [
      {
        name: { common: 'Spain', official: 'Kingdom of Spain' },
        capital: ['Madrid'],
        region: 'Europe',
        population: 47351567,
        area: 505992,
        flags: { svg: 'https://flagcdn.com', png: 'https://flagcdn.com' },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => rawApiResponse,
    });

    const controller = new AbortController();
    const result = await searchCountries('spain', controller.signal);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://countries.dev/spain', {
      signal: controller.signal,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Spain');
    expect(result[0].capital).toBe('Madrid');
  });

  it('should return an empty array on 404 Not Found without throwing an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const controller = new AbortController();
    const result = await searchCountries('unknowncountry', controller.signal);

    expect(result).toEqual([]);
  });

  it('should throw HttpError with status code on failed HTTP statuses other than 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const controller = new AbortController();

    try {
      await searchCountries('spain', controller.signal);
      expect.fail('Expected searchCountries to throw HttpError');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(500);
    }
  });
});
