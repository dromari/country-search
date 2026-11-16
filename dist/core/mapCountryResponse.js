export function mapCountryResponse(raw) {
    const commonName = typeof raw.name === 'string' ? raw.name : raw.name.common;
    const officialName = raw.officialName ??
        (typeof raw.name === 'object' && raw.name.official ? raw.name.official : commonName);
    let capital = 'No capital';
    if (typeof raw.capital === 'string' && raw.capital.trim().length > 0) {
        capital = raw.capital;
    }
    else if (Array.isArray(raw.capital) && raw.capital.length > 0) {
        capital = raw.capital[0];
    }
    let languages = [];
    if (Array.isArray(raw.languages)) {
        languages = raw.languages.map((lang) => lang.name ?? lang.code ?? '').filter(Boolean);
    }
    else if (raw.languages && typeof raw.languages === 'object') {
        languages = Object.values(raw.languages);
    }
    let currencies = [];
    if (Array.isArray(raw.currencies)) {
        currencies = raw.currencies.map((curr) => curr.symbol ? `${curr.name} (${curr.symbol})` : curr.name);
    }
    else if (raw.currencies && typeof raw.currencies === 'object') {
        currencies = Object.values(raw.currencies).map((curr) => curr.symbol ? `${curr.name} (${curr.symbol})` : curr.name);
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
