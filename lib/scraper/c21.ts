/**
 * Century 21 Bolivia Property Scraper
 * Extracts property data from C21 listing URLs
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
 * Scrape a Century 21 Bolivia property from URL
 * Uses server-side fetching with user-agent rotation
 */
export async function scrapeC21Property(url: string): Promise<ScrapedProperty> {
  // Validate URL
  if (!url.includes('c21.com.bo')) {
    throw new Error('URL must be from c21.com.bo');
  }

  try {
    // Fetch the page with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse property data from HTML
    return parseC21Property(html, url);
  } catch (error) {
    console.error('Scraper error:', error);
    throw new Error('No se pudo extraer la propiedad. Verifica que la URL sea correcta.');
  }
}

/**
 * Parse C21 HTML to extract property data
 */
function parseC21Property(html: string, sourceUrl: string): ScrapedProperty {
  // Remove script tags and get clean text
  const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Extract title
  const titleMatch = cleanHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || 
                     cleanHtml.match(/<meta[^>]*property[^>]*title[^>]*content="([^"]+)"/i) ||
                     cleanHtml.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : 'Propiedad Century 21';

  // Extract price - C21 typically shows prices like "$ 150,000 USD" or "USD 150,000"
  const pricePatterns = [
    /(?:USD|Bs\.?)\s*[:\-]?\s*([\d.,]+)/i,
    /([\d.,]+)\s*(?:USD|\$)/i,
    /Precio[\s:]*([\d.,]+)/i,
    /price["']?\s*[:>]\s*["']?([\d.,]+)/i,
  ];
  
  let price: number | null = null;
  let currency = 'USD';
  
  for (const pattern of pricePatterns) {
    const match = cleanHtml.match(pattern);
    if (match) {
      const rawPrice = match[1].replace(/[.,]/g, '');
      const parsedPrice = parseInt(rawPrice, 10);
      price = isNaN(parsedPrice) ? null : parsedPrice;
      if (cleanHtml.toLowerCase().includes('bs') || cleanHtml.toLowerCase().includes('boliviano')) {
        currency = 'BOB';
      }
      break;
    }
  }

  // Extract description - look for common description containers
  const descPatterns = [
    /<div[^>]*class[^>]*desc[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class[^>]*detail[^>]*>([\s\S]*?)<\/div>/i,
    /<p[^>]*class[^>]*description[^>]*>([\s\S]*?)<\/p>/i,
    /<meta[^>]*name[^>]*description[^>]*content="([^"]+)"/i,
  ];
  
  let description = '';
  for (const pattern of descPatterns) {
    const match = cleanHtml.match(pattern);
    if (match) {
      description = cleanText(match[1]);
      if (description.length > 20) break;
    }
  }

  // Extract area
  const areaMatch = cleanHtml.match(/(\d+)\s*m[²2]/i) ||
                    cleanHtml.match(/(\d+)\s*(?:m2|mts|metros)/i) ||
                    cleanHtml.match(/(\d+)\s*mt2/i);
  const area_m2 = areaMatch ? parseInt(areaMatch[1]) : null;

  // Extract bedrooms
  const bedMatch = cleanHtml.match(/(\d+)\s*(?:hab|dorm|recamara|cuarto)/i) ||
                   cleanHtml.match(/(\d+)\s*(?:dormitorio|bedroom)/i);
  const bedrooms = bedMatch ? parseInt(bedMatch[1]) : null;

  // Extract bathrooms
  const bathMatch = cleanHtml.match(/(\d+)\s*(?:baño|bano|bath)/i);
  const bathrooms = bathMatch ? parseInt(bathMatch[1]) : null;

  // Extract address
  const addressMatch = cleanHtml.match(/Direcci[oó]n[:\s]*([^<]+)/i) ||
                       cleanHtml.match(/Ubicaci[oó]n[:\s]*([^<]+)/i);
  const address = addressMatch ? cleanText(addressMatch[1]) : '';

  // Extract city from address or page content
  const cityMatch = cleanHtml.match(/(?:Santa Cruz|La Paz|Cochabamba|Sucre|Tarija|Potos[ií]|Oruro|Beni|Pando)/i);
  const city = cityMatch ? cityMatch[0] : null;

  // Extract images
  const imageMatches = cleanHtml.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/gi);
  const images: string[] = [];
  for (const match of imageMatches) {
    const src = match[1];
    if (src && (src.includes('property') || src.includes('listing') || src.match(/\.(jpg|jpeg|png|webp)/i))) {
      images.push(src.startsWith('http') ? src : `https://c21.com.bo${src}`);
    }
  }

  // Detect property type from content
  let property_type = 'otro';
  const content = cleanHtml.toLowerCase();
  if (content.includes('casa')) property_type = 'casa';
  else if (content.includes('departamento') || content.includes('apartamento') || content.includes('piso')) property_type = 'departamento';
  else if (content.includes('terreno') || content.includes('lote')) property_type = 'terreno';
  else if (content.includes('oficina') || content.includes('oficinas')) property_type = 'oficina';
  else if (content.includes('local') || content.includes('comercial')) property_type = 'local_comercial';

  return {
    title: title || 'Propiedad Century 21',
    description: description || `Propiedad extraída de Century 21 Bolivia`,
    price,
    currency,
    property_type,
    address: address || '',
    city,
    area_m2,
    bedrooms,
    bathrooms,
    images: images.slice(0, 10), // Limit to 10 images
    source_url: sourceUrl,
  };
}

/**
 * Clean HTML text for display
 */
function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate if URL is a valid C21 property listing
 */
export function isValidC21Url(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('c21.com.bo');
  } catch {
    return false;
  }
}
