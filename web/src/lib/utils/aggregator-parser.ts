import * as cheerio from 'cheerio';

export interface ParsedAggregatorData {
  textInfo: string;
  images: string[];
  labels: string[];
  providerLink: string | null;
  providerLocation: string | null;
  providerName: string | null;
  price: number | null;
  sizes: string[];
}

/**
 * Convert image URL to original size by replacing last part with 'orig'
 * Example: jupiter.a-a1.ru/img/626125493/103221/457946447/550.webp
 * -> jupiter.a-a1.ru/img/626125493/103221/457946447/orig.webp
 */
function convertToOrigUrl(url: string): string {
  try {
    // Handle both absolute and relative URLs
    const baseUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(baseUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);

    if (pathParts.length > 0) {
      // Replace last part with 'orig' while keeping extension
      const lastPart = pathParts[pathParts.length - 1];
      const ext = lastPart.includes('.') ? lastPart.split('.').pop() : 'webp';
      pathParts[pathParts.length - 1] = `orig.${ext}`;
      urlObj.pathname = '/' + pathParts.join('/');
    }
    return urlObj.toString();
  } catch (error) {
    console.error('Error converting URL to orig:', error, 'Original URL:', url);
    // Fallback: try simple string replacement
    if (url.includes('/')) {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        const ext = lastPart.split('.').pop();
        parts[parts.length - 1] = `orig.${ext}`;
        return parts.join('/');
      }
    }
    return url;
  }
}

/**
 * Parse HTML from aggregator portal
 */
export function parseAggregatorHTML(html: string): ParsedAggregatorData {
  const $ = cheerio.load(html);

  // Extract text info from div.wrap-text > div.hidden
  const textInfo = $('div.wrap-text div.hidden').text().trim() || '';

  // Extract images from div.gallery-images
  const images: string[] = [];

  // Main images from div.wrap-line-images
  $('div.gallery-images div.wrap-line-images div.item-image img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      images.push(convertToOrigUrl(src));
    }
  });

  // Additional images from div.wrap-thumb-images
  $('div.gallery-images div.wrap-thumb-images div.item-image img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const origUrl = convertToOrigUrl(src);
      // Avoid duplicates
      if (!images.includes(origUrl)) {
        images.push(origUrl);
      }
    }
  });

  // Extract labels from div.list-options > div.item-option
  const labels: string[] = [];
  $('div.list-options div.item-option').each((_, el) => {
    const labelText = $(el).text().trim();
    if (labelText) {
      labels.push(labelText);
    }
  });

  // Extract provider info from div.post-capt
  let providerLink: string | null = null;
  let providerLocation: string | null = null;
  const postCaptLink = $('div.post-capt a').first();
  if (postCaptLink.length > 0) {
    const href = postCaptLink.attr('href');
    if (href) {
      // Make absolute URL if relative
      providerLink = href.startsWith('http') ? href : `https://tk-sad.ru${href}`;
    }
    providerLocation = postCaptLink.text().trim() || null;
  }

  // Extract provider name from span.post-author
  const providerName = $('span.post-author').text().trim() || null;

  // Extract price from div.post-price
  let price: number | null = null;
  const priceText = $('div.post-price').text().trim();
  if (priceText) {
    // Extract numbers from price text (e.g., "1000 руб" -> 1000)
    const priceMatch = priceText.match(/(\d+)/);
    if (priceMatch) {
      price = parseInt(priceMatch[1], 10);
    }
  }

  // Extract sizes from div.list-sizes > div.item-size
  const sizes: string[] = [];
  $('div.list-sizes div.item-size').each((_, el) => {
    const sizeText = $(el).text().trim();
    if (sizeText) {
      sizes.push(sizeText);
    }
  });

  return {
    textInfo,
    images,
    labels,
    providerLink,
    providerLocation,
    providerName,
    price,
    sizes,
  };
}
