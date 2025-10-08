#!/usr/bin/env tsx

import { prisma } from '../lib/db-node';

/**
 * Show current batch processing status
 */
async function showBatchStatus() {
  console.log('📊 Batch Processing Status');
  console.log('========================');

  // Get all batch jobs
  const batchJobs = await prisma.gptBatchJob.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (batchJobs.length === 0) {
    console.log('✅ No batch jobs found');
    return;
  }

  // Group by type
  const analysisJobs = batchJobs.filter(j => j.type === 'analysis');
  const colorJobs = batchJobs.filter(j => j.type === 'colors');

  console.log(`\n📦 Batch Jobs Summary:`);
  console.log(`  Total: ${batchJobs.length}`);
  console.log(`  Analysis: ${analysisJobs.length}`);
  console.log(`  Colors: ${colorJobs.length}`);

  // Status breakdown
  const statusCount: Record<string, number> = {};
  batchJobs.forEach(j => {
    statusCount[j.status] = (statusCount[j.status] || 0) + 1;
  });

  console.log(`\n📊 Status Breakdown:`);
  Object.entries(statusCount).forEach(([status, count]) => {
    const icon =
      status === 'completed'
        ? '✅'
        : status === 'failed'
          ? '❌'
          : status === 'running'
            ? '🔄'
            : '⏳';
    console.log(`  ${icon} ${status}: ${count}`);
  });

  // Show recent jobs
  console.log(`\n🕒 Recent Jobs:`);
  batchJobs.slice(0, 5).forEach((job, i) => {
    const createdAt = job.createdAt.toLocaleString();
    const icon =
      job.status === 'completed'
        ? '✅'
        : job.status === 'failed'
          ? '❌'
          : job.status === 'running'
            ? '🔄'
            : '⏳';
    console.log(
      `  ${i + 1}. ${icon} ${job.type} - ${job.status} (${createdAt})`
    );
  });

  // Check products
  const products = await prisma.product.findMany({
    where: {
      OR: [{ analysisBatchId: { not: null } }, { colorBatchId: { not: null } }],
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      analysisBatchId: true,
      colorBatchId: true,
      batchProcessingStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (products.length > 0) {
    console.log(`\n🏷️  Products in Batch Processing:`);
    console.log(`  Total: ${products.length}`);

    const statusCount: Record<string, number> = {};
    products.forEach(p => {
      const status = p.batchProcessingStatus || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log(`\n📊 Product Status:`);
    Object.entries(statusCount).forEach(([status, count]) => {
      const icon =
        status === 'completed'
          ? '✅'
          : status === 'analysis_complete'
            ? '🔍'
            : status === 'colors_complete'
              ? '🎨'
              : '⏳';
      console.log(`  ${icon} ${status}: ${count}`);
    });

    console.log(`\n🕒 Recent Products:`);
    products.slice(0, 5).forEach((product, i) => {
      const createdAt = product.createdAt.toLocaleString();
      const icon = product.isActive ? '✅' : '⏳';
      const status = product.batchProcessingStatus || 'pending';
      console.log(
        `  ${i + 1}. ${icon} ${product.name} - ${status} (${createdAt})`
      );
    });
  }

  // Check for failed batches that need retry
  const failedJobs = batchJobs.filter(j => j.status === 'failed');
  if (failedJobs.length > 0) {
    console.log(`\n⚠️  Failed Batches (${failedJobs.length}):`);
    failedJobs.forEach((job, i) => {
      console.log(
        `  ${i + 1}. ${job.type} - ${job.batchId} (${job.createdAt.toLocaleString()})`
      );
    });
    console.log(`\n💡 Run 'npm run batch:poll' to retry failed batches`);
  }

  console.log(`\n✅ Status check completed`);
}

async function main() {
  try {
    await showBatchStatus();
  } catch (error) {
    console.error('❌ Error checking batch status:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
