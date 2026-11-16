export interface RawCountryResponse {
  name: {
    common: string;
    official: string;
  };
  capital?: string[];
  region: string;
  population: number;
  area: number;
  borders?: string[];
  flags: {
    svg: string;
    png: string;
    alt?: string;
  };
  languages?: Record<string, string>;
  currencies?: Record<
    string,
    {
      name: string;
      symbol?: string;
    }
  >;
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
  const capital = raw.capital && raw.capital.length > 0 ? raw.capital[0] : 'No capital';
  const flagAlt = raw.flags.alt ?? `Flag of ${raw.name.common}`;
  const borders = raw.borders ?? [];
  const languages = raw.languages ? Object.values(raw.languages) : [];

  const currencies = raw.currencies
    ? Object.values(raw.currencies).map((currency) =>
        currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name
      )
    : [];

  return {
    name: raw.name.common,
    officialName: raw.name.official,
    flag: raw.flags.svg || raw.flags.png,
    flagAlt,
    capital,
    region: raw.region,
    population: raw.population,
    area: raw.area,
    borders,
    languages,
    currencies,
  };
}
