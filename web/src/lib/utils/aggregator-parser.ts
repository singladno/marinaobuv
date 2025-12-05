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
  console.log('[AGGREGATOR PARSER] Starting HTML parsing...');
  console.log('[AGGREGATOR PARSER] HTML length:', html.length);
  console.log(
    '[AGGREGATOR PARSER] HTML preview (first 500 chars):',
    html.substring(0, 500)
  );

  const $ = cheerio.load(html);

  // Extract text info from div.wrap-text (unfolded state)
  // After clicking "Показать описание", the text is in div.wrap-text > div (not div.link-show)
  let textInfo = '';

  // Extract text from unfolded state (after "Показать описание" is clicked)
  // The unfolded div is inside wrap-text but not the link-show div
  const textInfoSelector = 'div.wrap-text > div:not(.link-show)';
  const textInfoElements = $(textInfoSelector);
  console.log(
    '[AGGREGATOR PARSER] Text info selector found:',
    textInfoElements.length,
    'elements'
  );

  if (textInfoElements.length > 0) {
    // Get the first div that has actual text content
    textInfoElements.each((index, el) => {
      const elementText = $(el).text().trim();
      if (elementText && !$(el).hasClass('link-show')) {
        textInfo = elementText;
        return false; // Break the loop
      }
    });
  }

  console.log(
    '[AGGREGATOR PARSER] Text info extracted:',
    textInfo ? `${textInfo.length} chars` : 'EMPTY'
  );
  if (textInfo) {
    console.log(
      '[AGGREGATOR PARSER] Text info preview:',
      textInfo.substring(0, 200)
    );
  }

  // Extract images from div.gallery-images
  const images: string[] = [];

  // Check if gallery-images container exists
  const galleryContainer = $('div.gallery-images');
  console.log(
    '[AGGREGATOR PARSER] Gallery container found:',
    galleryContainer.length,
    'elements'
  );

  // Updated selector: Get all img tags inside div.item-image within div.gallery-images
  // This covers multiple structures:
  // - div.gallery-images div.wrap-line-images div.item-image img (old structure)
  // - div.gallery-images div.wrap-thumb-images div.item-image img (old structure)
  // - div.gallery-images div.item-image img (new structure with wrap-vertical-images)
  const allImageSelector = 'div.gallery-images div.item-image img';
  const allImages = $(allImageSelector);
  console.log(
    '[AGGREGATOR PARSER] All images selector found:',
    allImages.length,
    'images'
  );

  allImages.each((index, el) => {
    const src = $(el).attr('src');
    const parentClasses = $(el).closest('div.item-image').attr('class');
    console.log(`[AGGREGATOR PARSER] Image ${index + 1} src:`, src);
    console.log(
      `[AGGREGATOR PARSER] Image ${index + 1} parent classes:`,
      parentClasses
    );
    if (src) {
      const origUrl = convertToOrigUrl(src);
      console.log(
        `[AGGREGATOR PARSER] Image ${index + 1} converted to orig:`,
        origUrl
      );
      // Avoid duplicates
      if (!images.includes(origUrl)) {
        images.push(origUrl);
        console.log(
          `[AGGREGATOR PARSER] Image ${index + 1} added (not duplicate)`
        );
      } else {
        console.log(
          `[AGGREGATOR PARSER] Image ${index + 1} skipped (duplicate)`
        );
      }
    } else {
      console.log(
        `[AGGREGATOR PARSER] Image ${index + 1} has no src attribute`
      );
    }
  });

  // Fallback: Try old selectors if new one didn't find anything
  if (images.length === 0) {
    console.log(
      '[AGGREGATOR PARSER] No images found with new selector, trying old selectors...'
    );

    // Main images from div.wrap-line-images
    const mainImagesSelector =
      'div.gallery-images div.wrap-line-images div.item-image img';
    const mainImages = $(mainImagesSelector);
    console.log(
      '[AGGREGATOR PARSER] Fallback: Main images selector found:',
      mainImages.length,
      'images'
    );

    mainImages.each((index, el) => {
      const src = $(el).attr('src');
      console.log(
        `[AGGREGATOR PARSER] Fallback: Main image ${index + 1} src:`,
        src
      );
      if (src) {
        const origUrl = convertToOrigUrl(src);
        console.log(
          `[AGGREGATOR PARSER] Fallback: Main image ${index + 1} converted to orig:`,
          origUrl
        );
        images.push(origUrl);
      }
    });

    // Additional images from div.wrap-thumb-images
    const thumbImagesSelector =
      'div.gallery-images div.wrap-thumb-images div.item-image img';
    const thumbImages = $(thumbImagesSelector);
    console.log(
      '[AGGREGATOR PARSER] Fallback: Thumb images selector found:',
      thumbImages.length,
      'images'
    );

    thumbImages.each((index, el) => {
      const src = $(el).attr('src');
      console.log(
        `[AGGREGATOR PARSER] Fallback: Thumb image ${index + 1} src:`,
        src
      );
      if (src) {
        const origUrl = convertToOrigUrl(src);
        console.log(
          `[AGGREGATOR PARSER] Fallback: Thumb image ${index + 1} converted to orig:`,
          origUrl
        );
        // Avoid duplicates
        if (!images.includes(origUrl)) {
          images.push(origUrl);
        }
      }
    });
  }

  console.log('[AGGREGATOR PARSER] Total images extracted:', images.length);
  if (images.length > 0) {
    console.log('[AGGREGATOR PARSER] Image URLs:', images);
  } else {
    console.log('[AGGREGATOR PARSER] WARNING: No images found!');
    // Debug: try alternative selectors
    const allImages = $('img');
    console.log(
      '[AGGREGATOR PARSER] Debug: Total img tags in HTML:',
      allImages.length
    );
    allImages.each((index, el) => {
      if (index < 5) {
        // Log first 5 images for debugging
        const src = $(el).attr('src');
        const parentClasses = $(el).parent().attr('class');
        console.log(
          `[AGGREGATOR PARSER] Debug img ${index + 1}: src="${src}", parent classes="${parentClasses}"`
        );
      }
    });
  }

  // Extract labels from div.list-options > div.item-option
  const labels: string[] = [];
  const labelsSelector = 'div.list-options div.item-option';
  const labelElements = $(labelsSelector);
  console.log(
    '[AGGREGATOR PARSER] Labels selector found:',
    labelElements.length,
    'elements'
  );
  labelElements.each((index, el) => {
    const labelText = $(el).text().trim();
    console.log(`[AGGREGATOR PARSER] Label ${index + 1}:`, labelText);
    if (labelText) {
      labels.push(labelText);
    }
  });
  console.log('[AGGREGATOR PARSER] Total labels extracted:', labels.length);

  // Extract provider info from div.post-capt
  let providerLink: string | null = null;
  let providerLocation: string | null = null;
  const postCaptSelector = 'div.post-capt a';
  const postCaptLink = $(postCaptSelector).first();
  console.log(
    '[AGGREGATOR PARSER] Provider link selector found:',
    postCaptLink.length,
    'elements'
  );
  if (postCaptLink.length > 0) {
    const href = postCaptLink.attr('href');
    console.log('[AGGREGATOR PARSER] Provider href:', href);
    if (href) {
      // Make absolute URL if relative
      providerLink = href.startsWith('http')
        ? href
        : `https://tk-sad.ru${href}`;
      console.log(
        '[AGGREGATOR PARSER] Provider link (absolute):',
        providerLink
      );
    }
    providerLocation = postCaptLink.text().trim() || null;
    console.log('[AGGREGATOR PARSER] Provider location:', providerLocation);
  } else {
    console.log('[AGGREGATOR PARSER] No provider link found');
  }

  // Extract provider name from span.post-author
  const providerNameSelector = 'span.post-author';
  const providerNameElement = $(providerNameSelector);
  console.log(
    '[AGGREGATOR PARSER] Provider name selector found:',
    providerNameElement.length,
    'elements'
  );
  const providerName = providerNameElement.text().trim() || null;
  console.log('[AGGREGATOR PARSER] Provider name:', providerName);

  // Extract price from div.post-price
  let price: number | null = null;
  const priceSelector = 'div.post-price';
  const priceElement = $(priceSelector);
  console.log(
    '[AGGREGATOR PARSER] Price selector found:',
    priceElement.length,
    'elements'
  );
  const priceText = priceElement.text().trim();
  console.log('[AGGREGATOR PARSER] Price text:', priceText);
  if (priceText) {
    // Extract numbers from price text (e.g., "1000 руб" -> 1000)
    const priceMatch = priceText.match(/(\d+)/);
    if (priceMatch) {
      price = parseInt(priceMatch[1], 10);
      console.log('[AGGREGATOR PARSER] Price extracted:', price);
    } else {
      console.log('[AGGREGATOR PARSER] No numbers found in price text');
    }
  } else {
    console.log('[AGGREGATOR PARSER] No price text found');
  }

  // Extract sizes from div.list-sizes > div.item-size
  const sizes: string[] = [];
  const sizesSelector = 'div.list-sizes div.item-size';
  const sizeElements = $(sizesSelector);
  console.log(
    '[AGGREGATOR PARSER] Sizes selector found:',
    sizeElements.length,
    'elements'
  );
  sizeElements.each((index, el) => {
    const sizeText = $(el).text().trim();
    console.log(`[AGGREGATOR PARSER] Size ${index + 1}:`, sizeText);
    if (sizeText) {
      sizes.push(sizeText);
    }
  });
  console.log('[AGGREGATOR PARSER] Total sizes extracted:', sizes.length);

  const result = {
    textInfo,
    images,
    labels,
    providerLink,
    providerLocation,
    providerName,
    price,
    sizes,
  };

  console.log('[AGGREGATOR PARSER] Parsing complete. Summary:');
  console.log(
    '[AGGREGATOR PARSER] - Text info:',
    textInfo ? `${textInfo.length} chars` : 'EMPTY'
  );
  console.log('[AGGREGATOR PARSER] - Images:', images.length);
  console.log('[AGGREGATOR PARSER] - Labels:', labels.length);
  console.log('[AGGREGATOR PARSER] - Provider link:', providerLink || 'NONE');
  console.log(
    '[AGGREGATOR PARSER] - Provider location:',
    providerLocation || 'NONE'
  );
  console.log('[AGGREGATOR PARSER] - Provider name:', providerName || 'NONE');
  console.log('[AGGREGATOR PARSER] - Price:', price || 'NONE');
  console.log('[AGGREGATOR PARSER] - Sizes:', sizes.length, sizes);

  return result;
}
