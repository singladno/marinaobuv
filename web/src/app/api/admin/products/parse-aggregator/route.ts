import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { parseAggregatorHTML } from '@/lib/utils/aggregator-parser';
import {
  IMAGE_ANALYSIS_SYSTEM_PROMPT,
  IMAGE_ANALYSIS_USER_PROMPT,
} from '@/lib/prompts/image-analysis-prompts';
import {
  CATEGORY_ANALYSIS_SYSTEM_PROMPT,
  CATEGORY_ANALYSIS_USER_PROMPT,
} from '@/lib/prompts/category-analysis-prompts';
import { uploadImage, getPublicUrl, getObjectKey } from '@/lib/storage';
import {
  PerImageColorService,
  type ImageColorResult,
} from '@/lib/services/per-image-color-service';
import { getGroqConfig } from '@/lib/groq-proxy-config';
import { getCategoryTree, getLeafCategories } from '@/lib/catalog-categories';
import { groqChatCompletion } from '@/lib/services/groq-api-wrapper';
import {
  mapGender,
  mapSeason,
  generateArticleNumber,
} from '@/lib/services/product-creation-mappers';

interface PlaywrightResult {
  html: string;
  screenshotBuffer: Buffer | null;
}

async function fetchHtmlWithPlaywright(
  url: string,
  debug: boolean
): Promise<PlaywrightResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  try {
    const useSystemChrome =
      process.env.AGGREGATOR_PLAYWRIGHT_USE_CHROME === 'true';
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const navigationTimeoutMs = Number(
      process.env.AGGREGATOR_PLAYWRIGHT_TIMEOUT_MS || '90000'
    );

    if (useSystemChrome) {
      // Use the same Chrome profile (with VPN/extensions) for local debugging.
      // Set AGGREGATOR_CHROME_PROFILE_DIR in your env to your Chrome profile path.
      // Example on macOS: /Users/<you>/Library/Application Support/Google/Chrome/Default
      const userDataDir = process.env.AGGREGATOR_CHROME_PROFILE_DIR;
      console.log(
        '[AGGREGATOR DEBUG] Using system Chrome with userDataDir:',
        userDataDir
      );

      context = await chromium.launchPersistentContext(userDataDir || '', {
        headless: !debug,
        channel: 'chrome',
      });
      // Set a consistent user agent for all pages in this context
      await Promise.all(
        context
          .pages()
          .map(page => page.setExtraHTTPHeaders({ 'User-Agent': userAgent }))
      );
    } else {
      // Default: use Playwright-managed Chromium
      browser = await chromium.launch({
        headless: !debug,
      });

      context = await browser.newContext({
        userAgent,
      });
    }

    const page = await context.newPage();
    // Increase navigation timeout
    page.setDefaultNavigationTimeout(navigationTimeoutMs);

    console.log('[AGGREGATOR] Navigating to:', url);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: navigationTimeoutMs,
    });

    // Wait for the page content to be rendered - wait for wrap-text or gallery-images to appear
    console.log('[AGGREGATOR] Waiting for page content to load...');
    try {
      await page.waitForSelector('div.wrap-text, div.gallery-images', {
        timeout: 10000,
      });
      console.log('[AGGREGATOR] Page content loaded');
    } catch (error) {
      console.warn(
        '[AGGREGATOR] Timeout waiting for page content, continuing anyway'
      );
    }

    // Click "Показать описание" button to unfold the hidden text block
    try {
      // Wait for the link to be visible
      const showDescriptionLink = page
        .locator('div.wrap-text div.link-show a')
        .first();

      try {
        await showDescriptionLink.waitFor({ state: 'visible', timeout: 5000 });
        console.log(
          '[AGGREGATOR] "Показать описание" button found, clicking...'
        );
        await showDescriptionLink.click();

        // Wait for the text to become visible (unfolded state)
        // After clicking, the text should be in div.wrap-text > div:not(.link-show)
        await page.waitForSelector('div.wrap-text > div:not(.link-show)', {
          timeout: 5000,
          state: 'visible',
        });
        console.log('[AGGREGATOR] Description unfolded successfully');
      } catch (waitError) {
        console.log(
          '[AGGREGATOR] "Показать описание" button not found or already unfolded, continuing'
        );
      }
    } catch (error) {
      console.warn(
        '[AGGREGATOR] Failed to click "Показать описание" button:',
        error
      );
      // Continue anyway - the screenshot will still be taken
    }

    const html = await page.content();
    let screenshotBuffer: Buffer | null = null;

    if (debug) {
      console.log('[AGGREGATOR DEBUG] Final URL:', page.url());
      console.log('[AGGREGATOR DEBUG] HTML snippet:', html.substring(0, 1000));
    }

    try {
      // Always take a screenshot so we can attach it as source screenshot
      console.log('[AGGREGATOR] Taking screenshot...');
      screenshotBuffer = await page.screenshot({
        path: debug ? 'playwright-aggregator-debug.png' : undefined,
        fullPage: true,
        type: 'png',
      });
      console.log(
        '[AGGREGATOR] Screenshot captured successfully:',
        screenshotBuffer ? `${screenshotBuffer.length} bytes` : 'NULL'
      );
      if (debug) {
        console.log(
          '[AGGREGATOR DEBUG] Saved screenshot to playwright-aggregator-debug.png'
        );
        // Keep the browser window open briefly in debug mode so you can see it
        await page.waitForTimeout(5000);
      }
    } catch (screenshotError) {
      console.error(
        '[AGGREGATOR] Failed to capture screenshot:',
        screenshotError
      );
      screenshotBuffer = null;
    }

    await context.close();
    if (browser) {
      await browser.close();
    }

    return { html, screenshotBuffer };
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();
    const {
      dataId,
      html: rawHtml,
      test,
    } = body as {
      dataId?: string;
      html?: string;
      test?: boolean;
    };

    let html: string;
    let screenshotBuffer: Buffer | null = null;

    console.log('[AGGREGATOR] ========================================');
    console.log('[AGGREGATOR] Starting aggregator product parsing');
    console.log('[AGGREGATOR] Request body:', {
      dataId: dataId || 'NOT PROVIDED',
      hasHtml: !!rawHtml,
    });
    if (rawHtml && rawHtml.trim()) {
      // Safe/offline mode: HTML already provided by client, no external fetch
      console.log('[AGGREGATOR] Using provided HTML (offline mode)');
      html = rawHtml;
      console.log('[AGGREGATOR] Provided HTML length:', html.length);
    } else {
      if (!dataId || !dataId.trim()) {
        console.error(
          '[AGGREGATOR] ERROR: data-id is required but not provided'
        );
        return NextResponse.json(
          { error: 'data-id обязателен' },
          { status: 400 }
        );
      }

      // Fetch HTML from aggregator using Playwright (real browser)
      const url = `https://tk-sad.ru/baza/search?q=${dataId.trim()}`;
      console.log('[AGGREGATOR] Fetching HTML with Playwright from:', url);

      try {
        const debugMode = process.env.AGGREGATOR_PLAYWRIGHT_DEBUG === 'true';
        console.log('[AGGREGATOR] Playwright debug mode:', debugMode);
        const result = await fetchHtmlWithPlaywright(url, debugMode);
        html = result.html;
        screenshotBuffer = result.screenshotBuffer;
        console.log(
          '[AGGREGATOR] Playwright fetch successful. HTML length:',
          html.length
        );
        console.log(
          '[AGGREGATOR] Screenshot buffer:',
          screenshotBuffer ? `${screenshotBuffer.length} bytes` : 'NONE'
        );
      } catch (playwrightError: any) {
        console.error(
          '[AGGREGATOR] Playwright failed to fetch aggregator HTML'
        );
        console.error(
          '[AGGREGATOR] Playwright error type:',
          typeof playwrightError
        );
        console.error(
          '[AGGREGATOR] Playwright error message:',
          playwrightError?.message
        );
        console.error(
          '[AGGREGATOR] Playwright error stack:',
          playwrightError?.stack
        );
        console.error(
          '[AGGREGATOR] Full Playwright error:',
          JSON.stringify(
            playwrightError,
            Object.getOwnPropertyNames(playwrightError)
          )
        );
        return NextResponse.json(
          {
            error:
              'Не удалось получить HTML от агрегатора через Playwright. Проверьте, установлен ли браузер (npm run playwright:install) и попробуйте еще раз.',
          },
          { status: 502 }
        );
      }
    }

    // Parse HTML
    console.log('[AGGREGATOR] ========== PARSING HTML ==========');
    console.log('[AGGREGATOR] Starting HTML parsing...');
    console.log('[AGGREGATOR] HTML length before parsing:', html.length);
    const parsedData = parseAggregatorHTML(html);
    console.log('[AGGREGATOR] HTML parsing completed');

    console.log('[AGGREGATOR] ========== PARSED DATA SUMMARY ==========');
    console.log('[AGGREGATOR] Parsed data validation:');
    console.log(
      '[AGGREGATOR] - Has textInfo:',
      !!parsedData.textInfo,
      parsedData.textInfo ? `${parsedData.textInfo.length} chars` : 'EMPTY'
    );
    console.log('[AGGREGATOR] - Images count:', parsedData.images?.length || 0);
    console.log('[AGGREGATOR] - Images array:', parsedData.images);
    console.log('[AGGREGATOR] - Provider name:', parsedData.providerName || 'NOT FOUND');
    console.log('[AGGREGATOR] - Provider link:', parsedData.providerLink || 'NOT FOUND');
    console.log('[AGGREGATOR] - Provider location:', parsedData.providerLocation || 'NOT FOUND');
    console.log('[AGGREGATOR] - Price:', parsedData.price || 'NOT FOUND');
    console.log('[AGGREGATOR] - Sizes:', parsedData.sizes || []);
    console.log('[AGGREGATOR] - Labels:', parsedData.labels || []);
    console.log('[AGGREGATOR] Full parsed data:', JSON.stringify({
      hasTextInfo: !!parsedData.textInfo,
      textInfoLength: parsedData.textInfo?.length || 0,
      imagesCount: parsedData.images?.length || 0,
      providerName: parsedData.providerName,
      providerLink: parsedData.providerLink,
      providerLocation: parsedData.providerLocation,
      price: parsedData.price,
      sizesCount: parsedData.sizes?.length || 0,
      labelsCount: parsedData.labels?.length || 0,
    }, null, 2));
    console.log('[AGGREGATOR] ========== END PARSED DATA SUMMARY ==========');

    // TEST MODE: Only parse and log, don't proceed with LLM or DB operations
    // Only allow test mode in development
    if (test) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Test mode is not available in production' },
          { status: 403 }
        );
      }
      console.log('[AGGREGATOR TEST] ========================================');
      console.log('[AGGREGATOR TEST] TEST MODE - Parsed HTML data object:');
      console.log('[AGGREGATOR TEST]', JSON.stringify(parsedData, null, 2));
      console.log('[AGGREGATOR TEST] ========================================');
      return NextResponse.json(
        {
          message:
            'Test parsing completed. Check server console for parsed data.',
          parsedData,
        },
        { status: 200 }
      );
    }

    if (!parsedData.textInfo && parsedData.images.length === 0) {
      console.error(
        '[AGGREGATOR] ERROR: No text info and no images extracted from HTML'
      );
      console.error(
        '[AGGREGATOR] This usually means the HTML structure is different than expected'
      );
      return NextResponse.json(
        { error: 'Не удалось извлечь данные из HTML' },
        { status: 400 }
      );
    }

    // Get or create provider
    let providerId: string | null = null;
    console.log('[AGGREGATOR] Provider processing started');
    console.log('[AGGREGATOR] Provider data:', {
      providerName: parsedData.providerName,
      providerLink: parsedData.providerLink,
      providerLocation: parsedData.providerLocation,
    });

    if (parsedData.providerName || parsedData.providerLink) {
      // Check if provider with same link exists
      if (parsedData.providerLink) {
        console.log(
          '[AGGREGATOR] Looking for provider by link:',
          parsedData.providerLink
        );
        const existingProvider = await prisma.provider.findFirst({
          where: { link: parsedData.providerLink },
        });

        if (existingProvider) {
          providerId = existingProvider.id;
          console.log('[AGGREGATOR] Found existing provider by link:', {
            id: existingProvider.id,
            name: existingProvider.name,
          });
          // Update provider info if needed
          await prisma.provider.update({
            where: { id: existingProvider.id },
            data: {
              name: parsedData.providerName || existingProvider.name,
              location:
                parsedData.providerLocation || existingProvider.location,
            },
          });
          console.log('[AGGREGATOR] Updated existing provider info');
        } else {
          // Create new provider
          console.log('[AGGREGATOR] Creating new provider with link');
          const newProvider = await prisma.provider.create({
            data: {
              name: parsedData.providerName || 'Неизвестный поставщик',
              link: parsedData.providerLink,
              location: parsedData.providerLocation,
            },
          });
          providerId = newProvider.id;
          console.log('[AGGREGATOR] Created new provider:', {
            id: newProvider.id,
            name: newProvider.name,
            link: newProvider.link,
          });
        }
      } else if (parsedData.providerName) {
        // Try to find by name
        console.log(
          '[AGGREGATOR] Looking for provider by name:',
          parsedData.providerName
        );
        const existingProvider = await prisma.provider.findUnique({
          where: { name: parsedData.providerName },
        });

        if (existingProvider) {
          providerId = existingProvider.id;
          console.log('[AGGREGATOR] Found existing provider by name:', {
            id: existingProvider.id,
            name: existingProvider.name,
          });
        } else {
          console.log('[AGGREGATOR] Creating new provider with name only');
          const newProvider = await prisma.provider.create({
            data: {
              name: parsedData.providerName,
              location: parsedData.providerLocation,
            },
          });
          providerId = newProvider.id;
          console.log('[AGGREGATOR] Created new provider:', {
            id: newProvider.id,
            name: newProvider.name,
          });
        }
      }
    } else {
      console.log('[AGGREGATOR] No provider data found in parsed HTML');
    }

    console.log('[AGGREGATOR] Final providerId:', providerId);

    // Download and upload first image to S3 for vision analysis
    // We need at least one image for vision API
    // Check if we have images for analysis
    console.log('[AGGREGATOR] Checking for images before analysis...');
    console.log('[AGGREGATOR] parsedData.images:', parsedData.images);
    console.log(
      '[AGGREGATOR] parsedData.images type:',
      typeof parsedData.images
    );
    console.log(
      '[AGGREGATOR] parsedData.images is array:',
      Array.isArray(parsedData.images)
    );
    console.log(
      '[AGGREGATOR] parsedData.images length:',
      parsedData.images?.length || 0
    );

    if (!parsedData.images || parsedData.images.length === 0) {
      console.error('[AGGREGATOR] ERROR: No images found for analysis');
      console.error(
        '[AGGREGATOR] This is a critical error - images are required for vision analysis'
      );
      console.error('[AGGREGATOR] Parsed data summary:', {
        hasTextInfo: !!parsedData.textInfo,
        textInfoLength: parsedData.textInfo?.length || 0,
        imagesCount: parsedData.images?.length || 0,
        imagesArray: parsedData.images,
        labelsCount: parsedData.labels?.length || 0,
        hasProvider: !!parsedData.providerName,
      });
      return NextResponse.json(
        { error: 'Не найдено изображений для анализа' },
        { status: 400 }
      );
    }

    const firstImageUrl = parsedData.images[0];
    console.log('[AGGREGATOR] First image URL:', firstImageUrl);
    console.log(
      '[AGGREGATOR] Total images to process:',
      parsedData.images.length
    );
    let firstImagePublicUrl: string | null = null;
    let firstImageS3Key: string | null = null;
    let base64Image: string;

    try {
      console.log('[AGGREGATOR] Downloading first image from:', firstImageUrl);
      // Download first image
      const imageResponse = await fetch(firstImageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MarinaObuvBot/1.0)',
        },
      });

      console.log(
        '[AGGREGATOR] Image fetch response status:',
        imageResponse.status,
        imageResponse.statusText
      );
      console.log(
        '[AGGREGATOR] Image fetch response headers:',
        Object.fromEntries(imageResponse.headers.entries())
      );
      if (!imageResponse.ok) {
        console.error('[AGGREGATOR] ERROR: Failed to fetch image');
        console.error('[AGGREGATOR] Response status:', imageResponse.status);
        console.error(
          '[AGGREGATOR] Response statusText:',
          imageResponse.statusText
        );
        return NextResponse.json(
          {
            error: `Не удалось загрузить изображение: ${imageResponse.statusText}`,
          },
          { status: 400 }
        );
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      console.log(
        '[AGGREGATOR] Image downloaded successfully. Buffer size:',
        imageBuffer.length,
        'bytes'
      );
      const contentType =
        imageResponse.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.split('/')[1] || 'jpg';
      console.log('[AGGREGATOR] Image content type:', contentType);
      console.log('[AGGREGATOR] Image extension:', ext);

      // Convert to base64 for Groq vision API (Groq can't fetch S3 URLs reliably)
      base64Image = `data:${contentType};base64,${imageBuffer.toString('base64')}`;
      console.log(
        '[AGGREGATOR] Image converted to base64. Length:',
        base64Image.length,
        'chars'
      );

      // Generate temporary product ID for image upload
      const tempProductId = `temp-${Date.now()}`;
      firstImageS3Key = getObjectKey({ productId: tempProductId, ext });
      console.log(
        '[AGGREGATOR] Generated S3 key for first image:',
        firstImageS3Key
      );

      // Upload to S3
      console.log('[AGGREGATOR] Uploading first image to S3...');
      const uploadSuccess = await uploadImage(
        firstImageS3Key,
        imageBuffer,
        contentType
      );
      if (uploadSuccess) {
        firstImagePublicUrl = getPublicUrl(firstImageS3Key);
        console.log('[AGGREGATOR] First image uploaded to S3 successfully');
        console.log(
          '[AGGREGATOR] First image public URL:',
          firstImagePublicUrl
        );
      } else {
        console.error('[AGGREGATOR] ERROR: Failed to upload image to S3');
        return NextResponse.json(
          { error: 'Не удалось загрузить изображение в S3' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error(
        '[AGGREGATOR] ERROR: Exception while processing first image'
      );
      console.error('[AGGREGATOR] Error type:', typeof error);
      console.error('[AGGREGATOR] Error message:', error?.message);
      console.error('[AGGREGATOR] Error stack:', error?.stack);
      console.error(
        '[AGGREGATOR] Full error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      console.error('[AGGREGATOR] First image URL that failed:', firstImageUrl);
      return NextResponse.json(
        {
          error: `Ошибка при обработке изображения: ${error?.message || error}`,
        },
        { status: 500 }
      );
    }

    // Analyze with Groq Vision API (same as WA parser)
    // Use vision API with text context and first image (as base64 to avoid URL fetch timeouts)
    let groq: Groq;
    if (process.env.NODE_ENV === 'production') {
      const groqConfig = await getGroqConfig();
      groq = new Groq(groqConfig);
    } else {
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }

    console.log('[AGGREGATOR] Starting vision analysis with text context');
    console.log('[AGGREGATOR] Text context (full):', parsedData.textInfo);
    console.log(
      '[AGGREGATOR] Text context length:',
      parsedData.textInfo?.length || 0
    );
    console.log(
      '[AGGREGATOR] Using base64 image (length:',
      base64Image.length,
      'chars)'
    );

    // Build the user prompt to log it
    const userPromptText = IMAGE_ANALYSIS_USER_PROMPT(
      'image', // Placeholder - actual image is in base64 below
      parsedData.textInfo
    );
    console.log(
      '[AGGREGATOR] User prompt text (first 500 chars):',
      userPromptText.substring(0, 500)
    );
    console.log(
      '[AGGREGATOR] User prompt includes text context:',
      userPromptText.includes(parsedData.textInfo || '')
    );
    console.log(
      '[AGGREGATOR] User prompt includes "женские":',
      userPromptText.toLowerCase().includes('женские')
    );
    console.log(
      '[AGGREGATOR] User prompt includes "мужские":',
      userPromptText.toLowerCase().includes('мужские')
    );

    const analysisResponse = await groqChatCompletion(
      groq,
      {
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: [
          {
            role: 'system',
            content: IMAGE_ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPromptText,
              },
              {
                type: 'image_url',
                image_url: { url: base64Image }, // Use base64 instead of URL
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 2000,
      },
      `aggregator-vision-analysis-${Date.now()}`,
      {
        maxRetries: 5,
        baseDelayMs: 2000,
        maxDelayMs: 60000,
        timeoutMs: 120000,
      }
    );

    // Type guard: ensure it's ChatCompletion, not Stream
    if (!('choices' in analysisResponse)) {
      throw new Error('Unexpected response type from Groq API');
    }

    // Log the raw response from Groq
    console.log(
      '[AGGREGATOR] Raw Groq response (full):',
      JSON.stringify(analysisResponse, null, 2)
    );
    console.log(
      '[AGGREGATOR] Raw message content:',
      analysisResponse.choices[0]?.message?.content
    );

    const rawContent = analysisResponse.choices[0].message.content || '{}';
    console.log('[AGGREGATOR] Raw content before parsing:', rawContent);
    console.log('[AGGREGATOR] Raw content length:', rawContent.length);

    const analysisResult = JSON.parse(rawContent);

    console.log(
      '[AGGREGATOR] ========== LLM ANALYSIS RESULT =========='
    );
    console.log(
      '[AGGREGATOR] Full analysis result (parsed JSON):',
      JSON.stringify(analysisResult, null, 2)
    );
    console.log(
      '[AGGREGATOR] Analysis result gender (raw, type:',
      typeof analysisResult.gender,
      '):',
      analysisResult.gender
    );
    console.log(
      '[AGGREGATOR] Analysis result season (raw, type:',
      typeof analysisResult.season,
      '):',
      analysisResult.season
    );
    console.log('[AGGREGATOR] Analysis result name:', analysisResult.name);
    console.log(
      '[AGGREGATOR] Analysis result description (first 200 chars):',
      analysisResult.description?.substring(0, 200)
    );
    console.log(
      '[AGGREGATOR] Analysis result price (LLM):',
      analysisResult.price,
      '| HTML parsed price:',
      parsedData.price
    );
    console.log(
      '[AGGREGATOR] Analysis result color (LLM):',
      analysisResult.color,
      '| type:',
      typeof analysisResult.color,
      '| isNull:',
      analysisResult.color === null,
      '| isUndefined:',
      analysisResult.color === undefined
    );
    console.log(
      '[AGGREGATOR] Analysis result material:',
      analysisResult.material
    );
    console.log(
      '[AGGREGATOR] ========== END LLM ANALYSIS RESULT =========='
    );

    // Download and upload remaining images to S3
    const uploadedImages: Array<{
      url: string;
      key: string;
      color: string | null;
    }> = [];

    // Add first image (already uploaded)
    if (firstImagePublicUrl && firstImageS3Key) {
      uploadedImages.push({
        url: firstImagePublicUrl,
        key: firstImageS3Key,
        color: null, // Will be set after color extraction
      });
    }

    // Process remaining images
    console.log(
      `[AGGREGATOR] ========== PROCESSING REMAINING ${parsedData.images.length - 1} IMAGES ==========`
    );
    for (let i = 1; i < parsedData.images.length; i++) {
      const imageUrl = parsedData.images[i];
      console.log(
        `[AGGREGATOR] Processing image ${i + 1}/${parsedData.images.length}:`,
        imageUrl
      );
      try {
        // Download image
        console.log(`[AGGREGATOR] Downloading image ${i + 1} from:`, imageUrl);
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MarinaObuvBot/1.0)',
          },
        });

        console.log(
          `[AGGREGATOR] Image ${i + 1} download response status:`,
          imageResponse.status,
          imageResponse.statusText
        );

        if (!imageResponse.ok) {
          console.error(
            `[AGGREGATOR] Failed to download image ${i + 1}: ${imageResponse.statusText}`
          );
          continue;
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log(
          `[AGGREGATOR] Image ${i + 1} downloaded, buffer size:`,
          imageBuffer.length,
          'bytes'
        );
        const contentType =
          imageResponse.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.split('/')[1] || 'jpg';
        console.log(
          `[AGGREGATOR] Image ${i + 1} content type:`,
          contentType,
          '| extension:',
          ext
        );

        // Generate temporary product ID for image upload
        const tempProductId = `temp-${Date.now()}`;
        const s3Key = getObjectKey({ productId: tempProductId, ext });
        console.log(`[AGGREGATOR] Image ${i + 1} S3 key:`, s3Key);

        // Upload to S3
        console.log(`[AGGREGATOR] Uploading image ${i + 1} to S3...`);
        const uploadSuccess = await uploadImage(
          s3Key,
          imageBuffer,
          contentType
        );
        console.log(
          `[AGGREGATOR] Image ${i + 1} upload result:`,
          uploadSuccess ? 'SUCCESS' : 'FAILED'
        );
        if (uploadSuccess) {
          const publicUrl = getPublicUrl(s3Key);
          console.log(`[AGGREGATOR] Image ${i + 1} public URL:`, publicUrl);
          uploadedImages.push({
            url: publicUrl,
            key: s3Key,
            color: null, // Will be set after color extraction
          });
          console.log(
            `[AGGREGATOR] Image ${i + 1} added to uploadedImages array. Total images:`,
            uploadedImages.length
          );
        } else {
          console.error(
            `[AGGREGATOR] Image ${i + 1} upload to S3 failed, skipping`
          );
        }
      } catch (error) {
        console.error(
          `[AGGREGATOR] Error processing image ${i + 1}:`,
          error
        );
        console.error(
          `[AGGREGATOR] Error details for image ${i + 1}:`,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error.stack : ''
        );
        continue;
      }
    }
    console.log(
      `[AGGREGATOR] ========== FINISHED PROCESSING IMAGES. Total uploaded: ${uploadedImages.length} ==========`
    );

    // Extract colors for each image
    console.log(
      `[AGGREGATOR] ========== STARTING COLOR ANALYSIS ==========`
    );
    console.log(
      `[AGGREGATOR] Total images to analyze: ${uploadedImages.length}`
    );
    const colorService = new PerImageColorService();
    const imageUrls = uploadedImages.map(img => img.url);
    console.log(
      `[AGGREGATOR] Image URLs for color analysis:`,
      imageUrls.map((url, i) => `${i + 1}. ${url}`)
    );
    console.log(
      `[AGGREGATOR] Calling colorService.analyzeImageColors with ${imageUrls.length} URLs`
    );

    let colorResults: ImageColorResult[];
    try {
      colorResults = await colorService.analyzeImageColors(imageUrls);
      console.log(
        `[AGGREGATOR] Color analysis completed. Results count: ${colorResults.length}`
      );
    } catch (colorError) {
      console.error(
        `[AGGREGATOR] ERROR in color analysis:`,
        colorError
      );
      console.error(
        `[AGGREGATOR] Color error details:`,
        colorError instanceof Error ? colorError.message : String(colorError),
        colorError instanceof Error ? colorError.stack : ''
      );
      // Continue with empty results
      colorResults = [];
    }

    console.log(
      `[AGGREGATOR] Color analysis results (detailed):`,
      JSON.stringify(
        colorResults.map((r, i) => ({
          index: i + 1,
          url: r.url,
          color: r.color,
          colorType: typeof r.color,
          isNull: r.color === null,
          isUndefined: r.color === undefined,
        })),
        null,
        2
      )
    );
    console.log(
      `[AGGREGATOR] Color analysis results (summary):`,
      colorResults.map((r, i) => `${i + 1}. ${r.url}: ${r.color || 'null'}`)
    );

    // Map colors to uploaded images
    // Use color from main vision analysis as fallback for first image if per-image analysis returns null
    const mainAnalysisColor = analysisResult.color || null;
    console.log(
      `[AGGREGATOR] Main vision analysis color: ${mainAnalysisColor || 'null'} | type: ${typeof mainAnalysisColor}`
    );

    console.log(
      `[AGGREGATOR] ========== MAPPING COLORS TO IMAGES ==========`
    );
    console.log(
      `[AGGREGATOR] uploadedImages.length: ${uploadedImages.length}, colorResults.length: ${colorResults.length}`
    );

    for (let i = 0; i < uploadedImages.length; i++) {
      console.log(
        `[AGGREGATOR] Processing color for image ${i + 1}/${uploadedImages.length}`
      );
      console.log(
        `[AGGREGATOR] Image ${i + 1} URL: ${uploadedImages[i].url}`
      );

      // Use per-image color if available
      let finalColor = null;
      if (i < colorResults.length) {
        finalColor = colorResults[i].color;
        console.log(
          `[AGGREGATOR] Image ${i + 1} color from analysis: ${finalColor || 'null'}`
        );
      } else {
        console.log(
          `[AGGREGATOR] Image ${i + 1} has no color result (index ${i} >= ${colorResults.length})`
        );
      }

      // Use main analysis color as fallback for first image if per-image analysis returns null
      if (!finalColor && i === 0 && mainAnalysisColor) {
        finalColor = mainAnalysisColor;
        console.log(
          `[AGGREGATOR] Using main analysis color "${mainAnalysisColor}" as fallback for first image`
        );
      }

      uploadedImages[i].color = finalColor;
      console.log(
        `[AGGREGATOR] Image ${i + 1} final color assigned: ${finalColor || 'null'} | type: ${typeof finalColor}`
      );
      console.log(
        `[AGGREGATOR] Image ${i + 1} color in uploadedImages array: ${uploadedImages[i].color || 'null'}`
      );
    }
    console.log(
      `[AGGREGATOR] ========== FINISHED MAPPING COLORS ==========`
    );
    console.log(
      `[AGGREGATOR] Final uploadedImages with colors:`,
      JSON.stringify(
        uploadedImages.map((img, i) => ({
          index: i + 1,
          url: img.url,
          color: img.color,
          colorType: typeof img.color,
        })),
        null,
        2
      )
    );

    // Convert sizes to the required format
    const sizes = parsedData.sizes.map(size => ({
      size: size.trim(),
      count: 1, // Default to 1 pair per size
    }));

    // Generate slug
    const baseSlug = analysisResult.name
      ? analysisResult.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      : `product-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug },
      });
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate article number (same as other products - 6-digit random number)
    const article = generateArticleNumber();

    // Map gender and season FIRST (before category analysis)
    // This ensures we use the same mapped values for both product creation and category analysis
    console.log('[AGGREGATOR] === GENDER MAPPING DEBUG ===');
    console.log(
      '[AGGREGATOR] Raw analysis result gender (before mapping):',
      analysisResult.gender,
      '| type:',
      typeof analysisResult.gender,
      '| value:',
      JSON.stringify(analysisResult.gender)
    );
    console.log(
      '[AGGREGATOR] Raw analysis result season (before mapping):',
      analysisResult.season,
      '| type:',
      typeof analysisResult.season
    );

    // Log what mapGender will receive
    if (analysisResult.gender) {
      const genderInput = String(analysisResult.gender);
      console.log('[AGGREGATOR] Calling mapGender with input:', genderInput);
      console.log(
        '[AGGREGATOR] Input includes "FEMALE":',
        genderInput.toUpperCase().includes('FEMALE')
      );
      console.log(
        '[AGGREGATOR] Input includes "MALE":',
        genderInput.toUpperCase().includes('MALE')
      );
      console.log(
        '[AGGREGATOR] Input includes "ЖЕНСКИЙ":',
        genderInput.toUpperCase().includes('ЖЕНСКИЙ')
      );
      console.log(
        '[AGGREGATOR] Input includes "МУЖСКОЙ":',
        genderInput.toUpperCase().includes('МУЖСКОЙ')
      );
    }

    const mappedGender = analysisResult.gender
      ? mapGender(analysisResult.gender)
      : null;
    const mappedSeason = analysisResult.season
      ? mapSeason(analysisResult.season)
      : null;

    console.log('[AGGREGATOR] Mapped gender (after mapGender):', mappedGender);
    console.log('[AGGREGATOR] Mapped season (after mapSeason):', mappedSeason);
    console.log('[AGGREGATOR] === END GENDER MAPPING DEBUG ===');

    // Determine category using the same flow as WA parser
    let categoryId: string | null = null;
    if (analysisResult.name) {
      try {
        console.log(
          `[AGGREGATOR] Analyzing category for product: ${analysisResult.name}`
        );

        const categoryTree = await getCategoryTree();
        // Use only leaf categories (same as WA parser)
        const leafCategories = getLeafCategories(categoryTree);
        const categoryTreeJson = JSON.stringify(leafCategories, null, 2);

        // Create mock image analysis result from aggregator analysis result
        // (WA parser uses image analysis results, but we have text analysis)
        // IMPORTANT: Use mapped gender/season values, not raw ones
        const mockImageAnalysisResult = [
          {
            name: analysisResult.name || '',
            description: analysisResult.description || '',
            material: analysisResult.material || '',
            gender: mappedGender || '', // Use mapped gender (FEMALE/MALE)
            season: mappedSeason || '', // Use mapped season (SPRING/SUMMER/AUTUMN/WINTER)
            color: 'unknown', // Color will be determined separately
          },
        ];

        console.log(
          '[AGGREGATOR] Mock image analysis result for category:',
          mockImageAnalysisResult
        );

        // Use same Groq initialization as WA parser
        let categoryGroq: Groq;
        if (process.env.NODE_ENV === 'production') {
          const groqConfig = await getGroqConfig();
          categoryGroq = new Groq(groqConfig);
        } else {
          categoryGroq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
          });
        }

        // Use same category analysis flow as WA parser
        const categoryResponse = await groqChatCompletion(
          categoryGroq,
          {
            model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Same model as WA parser
            messages: [
              {
                role: 'system',
                content: CATEGORY_ANALYSIS_SYSTEM_PROMPT,
              },
              {
                role: 'user',
                content: CATEGORY_ANALYSIS_USER_PROMPT(
                  mockImageAnalysisResult,
                  categoryTreeJson,
                  parsedData.textInfo // Use original text info as context
                ),
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
            max_tokens: 2000, // Same as WA parser
          },
          `category-analysis-aggregator-${Date.now()}`,
          {
            maxRetries: 5,
            baseDelayMs: 2000,
            maxDelayMs: 60000,
            timeoutMs: 120000,
          }
        );

        // Type guard: ensure it's ChatCompletion, not Stream
        if (!('choices' in categoryResponse)) {
          throw new Error('Unexpected response type from Groq API');
        }

        const categoryResult = JSON.parse(
          categoryResponse.choices[0].message.content || '{}'
        );

        if (categoryResult.categoryId) {
          // Validate that the returned categoryId is actually in the leaf categories list
          const isValidLeafCategory = leafCategories.some(
            cat => cat.id === categoryResult.categoryId
          );

          if (isValidLeafCategory) {
            // Double-check that it's actually a leaf category (no children)
            const category = await prisma.category.findUnique({
              where: { id: categoryResult.categoryId },
              include: { children: true },
            });

            if (category && category.children.length === 0) {
              categoryId = categoryResult.categoryId;
              console.log(
                `[AGGREGATOR] Selected category: ${category.name} (${categoryId})`
              );
            } else {
              console.warn(
                `[AGGREGATOR] Category ${categoryResult.categoryId} is not a leaf category, falling back`
              );
            }
          } else {
            console.warn(
              `[AGGREGATOR] Invalid category ID returned: ${categoryResult.categoryId}`
            );
          }
        }
      } catch (categoryError) {
        console.error(
          '[AGGREGATOR] Error determining category, falling back to first active category:',
          categoryError
        );
      }
    }

    // Fallback: first active category if LLM-based method failed
    if (!categoryId) {
      const defaultCategory = await prisma.category.findFirst({
        where: { isActive: true },
        orderBy: { sort: 'asc' },
      });

      if (!defaultCategory) {
        return NextResponse.json(
          {
            error:
              'Не найдена ни одна активная категория. Создайте категорию перед импортом товаров.',
          },
          { status: 400 }
        );
      }
      categoryId = defaultCategory.id;
      console.log(
        `[AGGREGATOR] Using fallback category: ${defaultCategory.name} (${categoryId})`
      );
    }

    // Map gender and season using same logic as WA parser
    // Create product (deactivated initially)
    // Note: mappedGender and mappedSeason are already defined above (before category analysis)
    // Note: mappedGender and mappedSeason are already defined above (before category analysis)

    // Price logic for AG flow:
    // - buyPrice = parsed/LLM price (this is the purchase price from aggregator)
    // - pricePair = buyPrice * 1.3 (30% markup)
    const buyPrice =
      analysisResult.price && analysisResult.price > 0
        ? analysisResult.price
        : parsedData.price && parsedData.price > 0
          ? parsedData.price
          : null;

    const pricePair = buyPrice ? buyPrice * 1.3 : 0;

    console.log('[AGGREGATOR] Price calculation:', {
      llmPrice: analysisResult.price,
      parsedPrice: parsedData.price,
      buyPrice,
      pricePair,
      markup: '30%',
    });

    console.log(
      `[AGGREGATOR] ========== CREATING PRODUCT ==========`
    );
    console.log('[AGGREGATOR] Product data before creation:', {
      name: analysisResult.name || 'Товар из агрегатора',
      slug,
      article,
      categoryId,
      pricePair,
      buyPrice,
      currency: 'RUB',
      material: analysisResult.material || '',
      gender: mappedGender,
      season: mappedSeason,
      description: analysisResult.description || '',
      sizes: sizes,
      isActive: false,
      source: 'AG',
      agLabels: parsedData.labels,
      providerId: providerId,
      providerIdType: typeof providerId,
      providerIdIsNull: providerId === null,
      providerIdIsUndefined: providerId === undefined,
    });
    console.log('[AGGREGATOR] Creating product with providerId:', providerId);

    let product;
    try {
      product = await prisma.product.create({
        data: {
          name: analysisResult.name || 'Товар из агрегатора',
          slug,
          article,
          categoryId, // Determined via the same logic as WA parser (with fallback)
          pricePair,
          buyPrice,
          currency: 'RUB',
          material: analysisResult.material || '',
          gender: mappedGender, // Use mapped gender (same as WA parser) - already mapped above
          season: mappedSeason, // Use mapped season (same as WA parser) - already mapped above
          description: analysisResult.description || '',
          sizes: sizes,
          isActive: false, // Deactivated initially
          source: 'AG',
          agLabels: parsedData.labels,
          providerId: providerId,
        },
      });
      console.log('[AGGREGATOR] Product created successfully');
    } catch (productError) {
      console.error('[AGGREGATOR] ERROR creating product:', productError);
      console.error(
        '[AGGREGATOR] Product creation error details:',
        productError instanceof Error ? productError.message : String(productError),
        productError instanceof Error ? productError.stack : ''
      );
      throw productError;
    }

    console.log('[AGGREGATOR] Product created (from DB):', {
      id: product.id,
      name: product.name,
      providerId: product.providerId,
      providerIdType: typeof product.providerId,
      providerIdIsNull: product.providerId === null,
      providerIdIsUndefined: product.providerId === undefined,
      buyPrice: product.buyPrice,
      pricePair: product.pricePair,
    });

    // Verify providerId was actually saved
    if (providerId && product.providerId !== providerId) {
      console.error(
        `[AGGREGATOR] WARNING: providerId mismatch! Expected: ${providerId}, Got: ${product.providerId}`
      );
    } else if (providerId && product.providerId === providerId) {
      console.log(
        `[AGGREGATOR] ✓ providerId verified: ${product.providerId}`
      );
    } else if (!providerId && !product.providerId) {
      console.log(
        `[AGGREGATOR] ✓ providerId is null as expected (no provider data found)`
      );
    } else {
      console.error(
        `[AGGREGATOR] WARNING: Unexpected providerId state. Expected: ${providerId}, Got: ${product.providerId}`
      );
    }
    console.log(
      `[AGGREGATOR] ========== PRODUCT CREATED ==========`
    );

    // Upload images to product
    console.log(
      `[AGGREGATOR] ========== CREATING PRODUCT IMAGE RECORDS ==========`
    );
    console.log(
      `[AGGREGATOR] Creating ${uploadedImages.length} product image records for product ${product.id}`
    );

    for (let i = 0; i < uploadedImages.length; i++) {
      const img = uploadedImages[i];
      console.log(
        `[AGGREGATOR] Creating image record ${i + 1}/${uploadedImages.length}`
      );
      console.log(
        `[AGGREGATOR] Image ${i + 1} data before creation:`,
        JSON.stringify({
          url: img.url,
          key: img.key,
          color: img.color,
          colorType: typeof img.color,
          isNull: img.color === null,
          isUndefined: img.color === undefined,
        }, null, 2)
      );

      // Update S3 key to use actual product ID
      const newKey = getObjectKey({
        productId: product.id,
        ext: img.key.split('.').pop() || 'jpg',
      });
      console.log(`[AGGREGATOR] Image ${i + 1} new S3 key:`, newKey);

      // Copy image to new location (or just update the key reference)
      // For now, we'll create the image record with the existing URL
      try {
        const createdImage = await prisma.productImage.create({
          data: {
            productId: product.id,
            url: img.url,
            key: img.key,
            alt: `Product image ${i + 1}`,
            color: img.color,
            sort: i,
            isPrimary: i === 0,
          },
        });
        console.log(
          `[AGGREGATOR] Image ${i + 1} created successfully:`,
          JSON.stringify({
            id: createdImage.id,
            url: createdImage.url,
            color: createdImage.color,
            colorType: typeof createdImage.color,
            isNull: createdImage.color === null,
            isUndefined: createdImage.color === undefined,
          }, null, 2)
        );
      } catch (imageError) {
        console.error(
          `[AGGREGATOR] ERROR creating image record ${i + 1}:`,
          imageError
        );
        console.error(
          `[AGGREGATOR] Image creation error details:`,
          imageError instanceof Error ? imageError.message : String(imageError),
          imageError instanceof Error ? imageError.stack : ''
        );
        throw imageError; // Re-throw to fail the whole operation
      }
    }
    console.log(
      `[AGGREGATOR] ========== FINISHED CREATING PRODUCT IMAGE RECORDS ==========`
    );

    // Attach Playwright screenshot as source screenshot, if available
    if (screenshotBuffer) {
      try {
        console.log(
          '[AGGREGATOR] Uploading Playwright screenshot to S3 for product',
          product.id
        );
        const screenshotKey = getObjectKey({
          productId: product.id,
          ext: 'png',
        });
        console.log('[AGGREGATOR] Screenshot S3 key:', screenshotKey);
        const uploaded = await uploadImage(
          screenshotKey,
          screenshotBuffer,
          'image/png'
        );
        if (uploaded) {
          const screenshotUrl = getPublicUrl(screenshotKey);
          console.log(
            '[AGGREGATOR] Screenshot uploaded successfully:',
            screenshotUrl
          );
          await prisma.product.update({
            where: { id: product.id },
            data: {
              sourceScreenshotKey: screenshotKey,
              sourceScreenshotUrl: screenshotUrl,
            },
          });
          console.log(
            '[AGGREGATOR] Product updated with source screenshot fields'
          );
          // Update product object to include screenshot URL in response
          (product as any).sourceScreenshotKey = screenshotKey;
          (product as any).sourceScreenshotUrl = screenshotUrl;
        } else {
          console.error(
            '[AGGREGATOR] Failed to upload Playwright screenshot for product',
            product.id
          );
        }
      } catch (screenshotUploadError) {
        console.error(
          '[AGGREGATOR] Error uploading Playwright screenshot:',
          screenshotUploadError
        );
      }
    } else {
      console.warn(
        '[AGGREGATOR] No screenshot buffer available to save for product',
        product.id
      );
    }

    // Fetch the final product with all updates (including screenshot)
    console.log(
      `[AGGREGATOR] ========== FETCHING FINAL PRODUCT ==========`
    );
    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        category: true,
        provider: true,
      },
    });

    console.log('[AGGREGATOR] Final product fetched:', {
      id: finalProduct?.id,
      name: finalProduct?.name,
      providerId: finalProduct?.providerId,
      providerIdType: typeof finalProduct?.providerId,
      provider: finalProduct?.provider
        ? {
            id: finalProduct.provider.id,
            name: finalProduct.provider.name,
            phone: finalProduct.provider.phone,
            place: finalProduct.provider.place,
          }
        : null,
      buyPrice: finalProduct?.buyPrice,
      pricePair: finalProduct?.pricePair,
      imagesCount: finalProduct?.images?.length || 0,
      images: finalProduct?.images?.map((img, i) => ({
        index: i + 1,
        id: img.id,
        url: img.url,
        color: img.color,
        colorType: typeof img.color,
        isNull: img.color === null,
        isUndefined: img.color === undefined,
      })),
    });

    // Verify all images have colors
    const imagesWithoutColor = finalProduct?.images?.filter(
      img => !img.color || img.color === null || img.color === undefined
    ) || [];
    if (imagesWithoutColor.length > 0) {
      console.error(
        `[AGGREGATOR] WARNING: ${imagesWithoutColor.length} images without color:`,
        JSON.stringify(
          imagesWithoutColor.map(img => ({
            id: img.id,
            url: img.url,
            color: img.color,
          })),
          null,
          2
        )
      );
    } else {
      console.log(
        `[AGGREGATOR] ✓ All ${finalProduct?.images?.length || 0} images have colors`
      );
    }

    // Verify provider
    if (providerId && !finalProduct?.providerId) {
      console.error(
        `[AGGREGATOR] ERROR: providerId was set to ${providerId} but final product has no providerId!`
      );
    } else if (providerId && finalProduct?.providerId !== providerId) {
      console.error(
        `[AGGREGATOR] ERROR: providerId mismatch! Expected: ${providerId}, Got: ${finalProduct?.providerId}`
      );
    } else if (providerId && finalProduct?.provider) {
      console.log(
        `[AGGREGATOR] ✓ Provider verified: ${finalProduct.provider.name} (${finalProduct.provider.id})`
      );
    } else if (!providerId) {
      console.log(
        `[AGGREGATOR] ✓ No provider expected (no provider data in parsed HTML)`
      );
    }

    console.log(
      `[AGGREGATOR] ========== FINAL PRODUCT SUMMARY ==========`
    );

    return NextResponse.json(
      {
        productId: product.id,
        product: finalProduct,
        message: 'Товар успешно создан из агрегатора',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error parsing aggregator product:', error);

    // Provide user-friendly error messages for common issues
    let errorMessage = 'Не удалось распарсить товар из агрегатора';
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      if (
        errorStr.includes('context deadline exceeded') ||
        errorStr.includes('deadline exceeded') ||
        errorStr.includes('timeout')
      ) {
        errorMessage =
          'Превышено время ожидания ответа от сервера. Попробуйте еще раз - система автоматически повторит запрос.';
      } else if (errorStr.includes('400')) {
        errorMessage = 'Ошибка при анализе товара. Попробуйте еще раз.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
