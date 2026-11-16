import { describe, it, expect, vi } from 'vitest';
import { createCachedSearch } from '../core/cachedSearch.js';
import type { Country } from '../core/mapCountryResponse.js';

const mockCountries: Country[] = [
  {
    name: 'Spain',
    officialName: 'Kingdom of Spain',
    flag: 'https://flagcdn.com',
    flagAlt: 'Flag of Spain',
    capital: 'Madrid',
    region: 'Europe',
    population: 47351567,
    area: 505992,
    borders: ['FRA', 'PRT'],
    languages: ['Spanish'],
    currencies: ['Euro (€)'],
  },
];

describe('createCachedSearch', () => {
  it('should return cached result on repeated query without calling fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue(mockCountries);
    const cachedSearch = createCachedSearch(fetcher);

    const controller1 = new AbortController();
    const firstResult = await cachedSearch('Spain', controller1.signal);

    const controller2 = new AbortController();
    const secondResult = await cachedSearch('  spain  ', controller2.signal);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(mockCountries);
    expect(secondResult).toEqual(mockCountries);
  });

  it('should deduplicate in-flight requests and keep caller AbortSignals independent', async () => {
    let resolveFetch!: (value: Country[]) => void;
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<Country[]>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const cachedSearch = createCachedSearch(fetcher);

    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const promise1 = cachedSearch('spain', controller1.signal);
    const promise2 = cachedSearch('spain', controller2.signal);

    expect(fetcher).toHaveBeenCalledTimes(1);

    controller1.abort();

    await expect(promise1).rejects.toMatchObject({ name: 'AbortError' });

    resolveFetch(mockCountries);

    const result2 = await promise2;
    expect(result2).toEqual(mockCountries);
  });
});
