/**
 * Central geo client — powered by Photon (Komoot + OpenStreetMap).
 * No API key required. Fully free.
 * Docs: https://photon.komoot.io
 */

const PHOTON_BASE = "https://photon.komoot.io/api";

// Bolivia bounding box: lon_min,lat_min,lon_max,lat_max
const BOLIVIA_BBOX = "-70,-22,-57,-9";

// ─── Types ────────────────────────────────────────────────────────

export interface PlaceResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  neighborhood: string | null;
  city: string | null;
  department: string | null;
  /** Always null — Photon has no unique place IDs */
  placeId: string | null;
  /** Always null — Photon has no editorial summaries */
  summary: string | null;
}

export interface AutocompleteSuggestion {
  label: string;
  lat: number;
  lng: number;
  neighborhood: string | null;
  city: string | null;
  department: string | null;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

// ─── Helpers ──────────────────────────────────────────────────────

function buildAddress(props: PhotonProperties): string {
  const parts: string[] = [];
  if (props.street) {
    parts.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street);
  } else if (props.name) {
    parts.push(props.name);
  }
  const neighborhood = props.district ?? props.suburb;
  if (neighborhood) parts.push(neighborhood);
  if (props.city) parts.push(props.city);
  if (props.state) parts.push(props.state);
  // Only append Bolivia if not already present
  if (props.country !== "Bolivia" && props.countrycode !== "BO") parts.push("Bolivia");
  return parts.join(", ");
}

async function fetchPhoton(query: string, limit: number): Promise<PhotonFeature[]> {
  const params = new URLSearchParams({
    q: query.includes("Bolivia") ? query : `${query}, Bolivia`,
    limit: String(limit),
    lang: "es",
    bbox: BOLIVIA_BBOX,
  });

  const res = await fetch(`${PHOTON_BASE}?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];
  const data: PhotonResponse = await res.json();
  return data.features ?? [];
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Geocode a free-text address within Bolivia.
 * Returns the best match or null on failure.
 */
export async function searchPlace(address: string): Promise<PlaceResult | null> {
  try {
    const features = await fetchPhoton(address, 1);
    if (!features.length) return null;

    const { geometry: { coordinates: [lng, lat] }, properties: props } = features[0];
    const neighborhood = props.district ?? props.suburb ?? null;

    return {
      formattedAddress: buildAddress(props),
      lat,
      lng,
      neighborhood,
      city: props.city ?? null,
      department: props.state ?? null,
      placeId: null,
      summary: null,
    };
  } catch {
    return null;
  }
}

/**
 * Return up to `limit` autocomplete suggestions for a partial address query.
 * Safe to call on every keystroke — Photon is free.
 */
export async function autocomplete(
  query: string,
  limit = 5
): Promise<AutocompleteSuggestion[]> {
  if (query.trim().length < 3) return [];

  try {
    const features = await fetchPhoton(query, limit);

    return features.map(({ geometry: { coordinates: [lng, lat] }, properties: props }) => ({
      label: buildAddress(props),
      lat,
      lng,
      neighborhood: props.district ?? props.suburb ?? null,
      city: props.city ?? null,
      department: props.state ?? null,
    }));
  } catch {
    return [];
  }
}
