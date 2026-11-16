import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from '../core/mapCountryResponse.js';

describe('mapCountryResponse', () => {
  it('should correctly map a full raw API response to a country model', () => {
    const rawCountry = {
      name: {
        common: 'Spain',
        official: 'Kingdom of Spain',
      },
      capital: ['Madrid'],
      region: 'Europe',
      population: 47351567,
      area: 505992,
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      flags: {
        svg: 'https://flagcdn.com',
        png: 'https://flagcdn.com',
        alt: 'The flag of Spain is composed of three horizontal bands.',
      },
      languages: {
        spa: 'Spanish',
        cat: 'Catalan',
      },
      currencies: {
        EUR: {
          name: 'Euro',
          symbol: '€',
        },
      },
    };

    const result = mapCountryResponse(rawCountry);

    expect(result).toEqual({
      name: 'Spain',
      officialName: 'Kingdom of Spain',
      flag: 'https://flagcdn.com',
      flagAlt: 'The flag of Spain is composed of three horizontal bands.',
      capital: 'Madrid',
      region: 'Europe',
      population: 47351567,
      area: 505992,
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      languages: ['Spanish', 'Catalan'],
      currencies: ['Euro (€)'],
    });
  });

  it('should handle countries without capital, languages, borders, and currencies', () => {
    const rawAntarctica = {
      name: {
        common: 'Antarctica',
        official: 'Antarctica',
      },
      region: 'Antarctic',
      population: 1000,
      area: 14000000,
      flags: {
        svg: 'https://flagcdn.com',
        png: 'https://flagcdn.com',
      },
    };

    const result = mapCountryResponse(rawAntarctica);

    expect(result).toEqual({
      name: 'Antarctica',
      officialName: 'Antarctica',
      flag: 'https://flagcdn.com',
      flagAlt: 'Flag of Antarctica',
      capital: 'No capital',
      region: 'Antarctic',
      population: 1000,
      area: 14000000,
      borders: [],
      languages: [],
      currencies: [],
    });
  });
});
