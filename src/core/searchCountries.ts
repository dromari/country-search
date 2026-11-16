import { HttpError } from './HttpError.js';
import {
  mapCountryResponse,
  type Country,
  type RawCountryResponse,
} from '../core/mapCountryResponse.js';

const BASE_URL = 'https://countries.dev/name';

export async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  const encodedQuery = encodeURIComponent(query.trim());
  const response = await fetch(`${BASE_URL}/${encodedQuery}`, { signal });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status, `HTTP error! status: ${response.status}`);
  }

  const rawData = (await response.json()) as RawCountryResponse[];
  return rawData.map(mapCountryResponse);
}
