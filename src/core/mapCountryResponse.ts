export interface RawLanguage {
  name?: string;
  code?: string;
}

export interface RawCurrency {
  name: string;
  code?: string;
  symbol?: string;
}

export interface RawCountryResponse {
  name: string | { common: string; official?: string };
  officialName?: string;
  capital?: string | string[];
  region: string;
  population: number;
  area?: number;
  borders?: string[];
  flags: {
    svg: string;
    png: string;
    alt?: string;
  };
  languages?: RawLanguage[] | Record<string, string>;
  currencies?: RawCurrency[] | Record<string, { name: string; symbol?: string }>;
}

export interface Country {
  name: string;
  officialName: string;
  flag: string;
  flagAlt: string;
  capital: string;
  region: string;
  population: number;
  area: number;
  borders: string[];
  languages: string[];
  currencies: string[];
}

export function mapCountryResponse(raw: RawCountryResponse): Country {
  const commonName = typeof raw.name === 'string' ? raw.name : raw.name.common;
  const officialName =
    raw.officialName ??
    (typeof raw.name === 'object' && raw.name.official ? raw.name.official : commonName);

  let capital = 'No capital';
  if (typeof raw.capital === 'string' && raw.capital.trim().length > 0) {
    capital = raw.capital;
  } else if (Array.isArray(raw.capital) && raw.capital.length > 0) {
    capital = raw.capital[0];
  }

  let languages: string[] = [];
  if (Array.isArray(raw.languages)) {
    languages = raw.languages.map((lang) => lang.name ?? lang.code ?? '').filter(Boolean);
  } else if (raw.languages && typeof raw.languages === 'object') {
    languages = Object.values(raw.languages);
  }

  let currencies: string[] = [];
  if (Array.isArray(raw.currencies)) {
    currencies = raw.currencies.map((curr) =>
      curr.symbol ? `${curr.name} (${curr.symbol})` : curr.name
    );
  } else if (raw.currencies && typeof raw.currencies === 'object') {
    currencies = Object.values(raw.currencies).map((curr) =>
      curr.symbol ? `${curr.name} (${curr.symbol})` : curr.name
    );
  }

  return {
    name: commonName,
    officialName,
    flag: raw.flags.svg || raw.flags.png,
    flagAlt: raw.flags.alt ?? `Flag of ${commonName}`,
    capital,
    region: raw.region,
    population: raw.population,
    area: raw.area ?? 0,
    borders: raw.borders ?? [],
    languages,
    currencies,
  };
}
