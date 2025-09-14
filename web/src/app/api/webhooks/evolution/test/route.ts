import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { normalizeTextToDraft } from '@/lib/yagpt';

/**
 * Test endpoint to verify the pipeline components work
 * Only available in development mode
 */
export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const results: Record<string, any> = {};

    // Test 1: Database connection
    try {
      const messageCount = await prisma.whatsAppMessage.count();
      const draftCount = await prisma.productDraft.count();
      results.database = {
        success: true,
        messageCount,
        draftCount,
      };
    } catch (error) {
      results.database = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 2: YandexGPT (if configured)
    try {
      const testText = "Кроссовки Nike Air Max, размеры 36-42, цена 5000 руб за пару";
      const gptResult = await normalizeTextToDraft(testText);
      results.yandexGPT = {
        success: gptResult.success,
        testText,
        result: gptResult.data,
        error: gptResult.error,
      };
    } catch (error) {
      results.yandexGPT = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 3: Environment variables
    results.environment = {
      evolutionBaseUrl: process.env.EVOLUTION_BASE_URL ? 'Set' : 'Missing',
      evolutionApiKey: process.env.EVOLUTION_API_KEY ? 'Set' : 'Missing',
      evolutionInstance: process.env.EVOLUTION_INSTANCE ? 'Set' : 'Missing',
      evolutionWebhookSecret: process.env.EVOLUTION_WEBHOOK_SECRET ? 'Set' : 'Missing',
      s3Endpoint: process.env.S3_ENDPOINT ? 'Set' : 'Missing',
      s3Bucket: process.env.S3_BUCKET ? 'Set' : 'Missing',
      s3AccessKey: process.env.S3_ACCESS_KEY ? 'Set' : 'Missing',
      s3SecretKey: process.env.S3_SECRET_KEY ? 'Set' : 'Missing',
      cdnBaseUrl: process.env.CDN_BASE_URL ? 'Set' : 'Missing',
      ycFolderId: process.env.YC_FOLDER_ID ? 'Set' : 'Missing',
      ycIamToken: process.env.YC_IAM_TOKEN ? 'Set' : 'Missing',
      ycApiKey: process.env.YC_API_KEY ? 'Set' : 'Missing',
    };

    return NextResponse.json({
      success: true,
      message: 'Pipeline test completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
