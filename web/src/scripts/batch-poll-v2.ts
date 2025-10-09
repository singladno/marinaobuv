#!/usr/bin/env tsx

import fs from 'node:fs';
import { prisma } from '../lib/db-node';
import { pollBatch, downloadBatchResults } from '../lib/batch/openai-batch';
import { BatchProductService } from '../lib/services/batch-product-service';
import { BatchRetryService } from '../lib/services/batch-retry-service';

/**
 * Updated batch polling service that uses product batch IDs
 * instead of group IDs to avoid collisions
 */
async function processAnalysisResult(customId: string, result: any) {
  console.log(`📊 Processing analysis result for batch ${customId}`);

  const batchProductService = new BatchProductService();

  try {
    await batchProductService.updateProductWithAnalysis(customId, result);
    console.log(
      `✅ Updated product with analysis results for batch ${customId}`
    );
  } catch (error) {
    console.error(
      `❌ Error updating product with analysis for batch ${customId}:`,
      error
    );
  }
}

async function processColorResult(customId: string, result: any) {
  console.log(`🎨 Processing color result for batch ${customId}`);

  const batchProductService = new BatchProductService();

  try {
    // Extract batch ID from custom_id (format: "color_batch_id:image_index")
    const [batchId] = customId.split(':');

    // Get all color results for this batch
    const colorResults = await getColorResultsForBatch(batchId);
    colorResults.push(result);

    await batchProductService.updateProductWithColors(batchId, colorResults);
    console.log(`✅ Updated product with color results for batch ${batchId}`);
  } catch (error) {
    console.error(
      `❌ Error updating product with colors for batch ${customId}:`,
      error
    );
  }
}

async function getColorResultsForBatch(batchId: string): Promise<any[]> {
  // This would need to be implemented to collect all color results for a batch
  // For now, return empty array
  return [];
}

async function checkAndActivateProducts() {
  console.log(`🔍 Checking for products ready to activate...`);

  // Find products that have completed both analysis and colors
  const readyProducts = await prisma.product.findMany({
    where: {
      batchProcessingStatus: 'colors_complete',
      isActive: false,
    },
  });

  const batchProductService = new BatchProductService();

  for (const product of readyProducts) {
    try {
      await batchProductService.activateProduct(product.id);
      console.log(`✅ Activated product ${product.id}`);
    } catch (error) {
      console.error(`❌ Error activating product ${product.id}:`, error);
    }
  }
}

async function handleFailedBatch(job: any) {
  console.log(`🔄 Handling failed batch ${job.batchId} (${job.type})...`);

  // Find the product associated with this batch
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ analysisBatchId: job.batchId }, { colorBatchId: job.batchId }],
    },
  });

  if (!product) {
    console.error(`❌ No product found for failed batch ${job.batchId}`);
    return;
  }

  console.log(`🔄 Retrying batch for product ${product.id}...`);

  // Create new batch IDs
  const newAnalysisBatchId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newColorBatchId = `color_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Update product with new batch IDs
  await prisma.product.update({
    where: { id: product.id },
    data: {
      analysisBatchId: newAnalysisBatchId,
      colorBatchId: newColorBatchId,
      batchProcessingStatus: 'pending',
    },
  });

  // Resubmit the batch with new IDs
  try {
    const retryService = new BatchRetryService();
    await retryService.resubmitFailedBatch(
      product.id,
      newAnalysisBatchId,
      newColorBatchId
    );
    console.log(`✅ Product ${product.id} batch resubmitted successfully`);
  } catch (error) {
    console.error(
      `❌ Failed to resubmit batch for product ${product.id}:`,
      error
    );
  }
}

async function main() {
  const running = await prisma.gptBatchJob.findMany({
    where: { status: 'running' },
  });

  const failed = await prisma.gptBatchJob.findMany({
    where: { status: 'failed' },
  });

  if (running.length === 0 && failed.length === 0) {
    console.log('No batches to process');
    return;
  }

  console.log(`🔍 Polling ${running.length} running batches...`);
  console.log(`🔄 Handling ${failed.length} failed batches...`);

  // Handle failed batches first
  for (const job of failed) {
    await handleFailedBatch(job);
  }

  // Poll running batches
  for (const job of running) {
    console.log(`📊 Checking batch ${job.batchId} (${job.type})...`);
    const b = await pollBatch(job.batchId!);

    if (b.status === 'completed') {
      console.log(`✅ Batch ${job.batchId} completed, processing results...`);

      const outputFileId = (b as any).output_file_id;

      if (!outputFileId) {
        console.warn(
          `⚠️ Batch ${job.batchId} completed but has no output file ID. This indicates a failed batch - marking for retry.`
        );

        // Mark as failed so it gets retried with new batch IDs
        await prisma.gptBatchJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            outputFileId: null,
          },
        });
        console.log(
          `🔄 Marked batch ${job.batchId} as failed (will be retried)`
        );
        continue;
      }

      try {
        const filePath = await downloadBatchResults(outputFileId);
        const content = await fs.promises.readFile(filePath, 'utf8');

        for (const line of content.trim().split('\n')) {
          if (!line.trim()) continue; // Skip empty lines

          try {
            const row = JSON.parse(line);
            const customId = row.custom_id as string;
            const result = row.response?.body?.choices?.[0]?.message?.content;

            if (result) {
              try {
                const parsedResult = JSON.parse(result);

                if (customId.startsWith('analysis_')) {
                  await processAnalysisResult(customId, parsedResult);
                } else if (customId.startsWith('color_')) {
                  await processColorResult(customId, parsedResult);
                }
              } catch (error) {
                console.error(
                  `❌ Error parsing result for ${customId}:`,
                  error
                );
              }
            }
          } catch (error) {
            console.error(
              `❌ Error parsing batch result line: ${line.substring(0, 100)}...`,
              error
            );
          }
        }

        await prisma.gptBatchJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            outputFileId: outputFileId,
          },
        });
        console.log(`✅ Processed results for batch ${job.batchId}`);
      } catch (error) {
        console.error(
          `❌ Error downloading or processing results for batch ${job.batchId}:`,
          error
        );

        // Mark as failed if we can't process the results
        await prisma.gptBatchJob.update({
          where: { id: job.id },
          data: { status: 'failed' },
        });
      }
    } else if (
      b.status === 'failed' ||
      b.status === 'cancelled' ||
      b.status === 'expired'
    ) {
      await prisma.gptBatchJob.update({
        where: { id: job.id },
        data: { status: 'failed' },
      });
      console.log(`❌ Batch ${job.batchId} ended with status ${b.status}`);
    } else {
      console.log(`⏳ Batch ${job.batchId} still ${b.status}`);
    }
  }

  // Check for products ready to activate
  await checkAndActivateProducts();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
