/**
 * Universal Property Scraper
 * Extracts property data from any real estate listing URL using regex-based HTML parsing.
 */

export interface ScrapedProperty {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  property_type: string;
  address: string;
  city: string | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  source_url: string;
}

/**
 * Scrape any property listing URL.
 */
export async function scrapeProperty(url: string): Promise<ScrapedProperty> {
  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("URL inválida. Verifica que sea una dirección web completa.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Solo se aceptan URLs con protocolo http o https.");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-419,es;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`No se pudo acceder al sitio (${response.status}). Verifica que la URL sea pública.`);
    }

    const html = await response.text();
    return parseProperty(html, url, parsedUrl.hostname);
  } catch (error) {
    if (error instanceof Error && error.message.includes("No se pudo")) throw error;
    console.error("Universal scraper error:", error);
    throw new Error("No se pudo extraer la propiedad. Verifica que la URL sea accesible y tenga información de inmueble.");
  }
}

/**
 * Parse HTML from any source to extract property data.
 */
function parseProperty(html: string, sourceUrl: string, hostname: string): ScrapedProperty {
  const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // ── Title ────────────────────────────────────────────────────────────
  const titleMatch =
    cleanHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    cleanHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
    cleanHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    cleanHtml.match(/<title>([^<|–-]+)/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : "Propiedad";

  // ── Description ──────────────────────────────────────────────────────
  const descMatch =
    cleanHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    cleanHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
    cleanHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    cleanHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
    cleanHtml.match(/<div[^>]*class[^>]*desc[^>]*>([\s\S]*?)<\/div>/i) ||
    cleanHtml.match(/<p[^>]*class[^>]*description[^>]*>([\s\S]*?)<\/p>/i);
  const description = descMatch ? cleanText(descMatch[1]) : `Propiedad extraída de ${hostname}`;

  // ── Price ─────────────────────────────────────────────────────────────
  const pricePatterns = [
    /(?:USD|US\$)\s*[:\-]?\s*([\d.,]+)/i,
    /\$\s*([\d.,]+)/,
    /(?:Bs\.?|BOB)\s*[:\-]?\s*([\d.,]+)/i,
    /([\d.,]+)\s*(?:USD|US\$)/i,
    /([\d.,]+)\s*(?:Bs\.?|BOB)/i,
    /[Pp]recio[\s:]*\$?\s*([\d.,]+)/i,
    /"price"[^:]*:\s*"?([\d.]+)"?/i,
    /price["']?\s*[:>]\s*["']?([\d.,]+)/i,
  ];

  let price: number | null = null;
  let currency = "USD";

  for (const pattern of pricePatterns) {
    const match = cleanHtml.match(pattern);
    if (match) {
      const raw = match[1].replace(/,/g, "");
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
        if (/Bs\.?|BOB|boliviano/i.test(cleanHtml.slice(0, 500)) ||
            /Bs\.?|BOB/i.test(match[0])) {
          currency = "BOB";
        }
        break;
      }
    }
  }

  // ── Area ──────────────────────────────────────────────────────────────
  const areaMatch =
    cleanHtml.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i) ||
    cleanHtml.match(/(\d+)\s*(?:m2|mts|metros cuadrados?|mt2)/i) ||
    cleanHtml.match(/"area"[^:]*:\s*"?(\d+)"?/i);
  const area_m2 = areaMatch ? parseInt(areaMatch[1].replace(",", ".")) : null;

  // ── Bedrooms ──────────────────────────────────────────────────────────
  const bedMatch =
    cleanHtml.match(/(\d+)\s*(?:hab(?:itaciones?)?|dorm(?:itorios?)?|recamaras?|cuartos?|bedrooms?)/i) ||
    cleanHtml.match(/"bedrooms?"[^:]*:\s*"?(\d+)"?/i);
  const bedrooms = bedMatch ? parseInt(bedMatch[1]) : null;

  // ── Bathrooms ─────────────────────────────────────────────────────────
  const bathMatch =
    cleanHtml.match(/(\d+)\s*(?:baños?|banos?|bathrooms?|wc)/i) ||
    cleanHtml.match(/"bathrooms?"[^:]*:\s*"?(\d+)"?/i);
  const bathrooms = bathMatch ? parseInt(bathMatch[1]) : null;

  // ── Address ───────────────────────────────────────────────────────────
  const addressMatch =
    cleanHtml.match(/[Dd]irecci[oó]n[:\s]*([^<\n]{5,80})/i) ||
    cleanHtml.match(/[Uu]bicaci[oó]n[:\s]*([^<\n]{5,80})/i) ||
    cleanHtml.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  const address = addressMatch ? cleanText(addressMatch[1]) : "";

  // ── City (Bolivian departments + major cities) ────────────────────────
  const cityPattern = /\b(Santa Cruz(?: de la Sierra)?|La Paz|Cochabamba|Sucre|Tarija|Potos[ií]|Oruro|Trinidad|Cobija)\b/i;
  const cityMatch = (address + " " + cleanHtml).match(cityPattern);
  const city = cityMatch ? cityMatch[1] : null;

  // ── Property type ─────────────────────────────────────────────────────
  let property_type = "otro";
  const content = cleanHtml.toLowerCase();
  if (/\b(casa|house|chalet|villa)\b/.test(content)) property_type = "casa";
  else if (/\b(departamento|apartamento|depto|piso|flat|apartment)\b/.test(content)) property_type = "departamento";
  else if (/\b(terreno|lote|solar|land|lot)\b/.test(content)) property_type = "terreno";
  else if (/\b(oficina|office)\b/.test(content)) property_type = "oficina";
  else if (/\b(local comercial|local|comercial|shop|store)\b/.test(content)) property_type = "local_comercial";

  // ── Images ────────────────────────────────────────────────────────────
  const images: string[] = [];
  const base = `${new URL(sourceUrl).protocol}//${new URL(sourceUrl).host}`;

  // og:image first (usually the best image)
  const ogImageMatch = cleanHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                       cleanHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImageMatch) {
    const src = ogImageMatch[1];
    images.push(src.startsWith("http") ? src : `${base}${src}`);
  }

  // Then scan img tags
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    if (!src || src.startsWith("data:")) continue;
    if (/\.(jpg|jpeg|png|webp)/i.test(src) || src.includes("photo") || src.includes("image") || src.includes("propert") || src.includes("inmueble")) {
      const full = src.startsWith("http") ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
      if (!images.includes(full)) images.push(full);
    }
    if (images.length >= 10) break;
  }

  return {
    title: title || "Propiedad",
    description: description || `Propiedad extraída de ${hostname}`,
    price,
    currency,
    property_type,
    address,
    city,
    area_m2,
    bedrooms,
    bathrooms,
    images: images.slice(0, 10),
    source_url: sourceUrl,
  };
}

function cleanText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Validate any http/https URL */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}
