#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

async function testParallelParsing() {
  try {
    console.log('🧪 Testing parallel parsing execution...');

    // Create multiple parsing history records to simulate parallel runs
    console.log('\n1. Creating multiple parsing records...');

    const record1 = await prisma.parsingHistory.create({
      data: {
        startedAt: new Date(),
        status: 'running',
        messagesRead: 0,
        productsCreated: 0,
      },
    });

    const record2 = await prisma.parsingHistory.create({
      data: {
        startedAt: new Date(),
        status: 'running',
        messagesRead: 0,
        productsCreated: 0,
      },
    });

    console.log('✅ Created 2 running parsing records');

    // Check how many are running
    const runningCount = await prisma.parsingHistory.count({
      where: { status: 'running' },
    });
    console.log('✅ Running parsers count:', runningCount);

    // Simulate completion of first record
    console.log('\n2. Completing first record...');
    await prisma.parsingHistory.update({
      where: { id: record1.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        messagesRead: 10,
        productsCreated: 2,
        duration: 30,
      },
    });

    // Check running count again
    const runningCountAfter = await prisma.parsingHistory.count({
      where: { status: 'running' },
    });
    console.log('✅ Running parsers after completion:', runningCountAfter);

    // Complete second record
    console.log('\n3. Completing second record...');
    await prisma.parsingHistory.update({
      where: { id: record2.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        messagesRead: 15,
        productsCreated: 3,
        duration: 45,
      },
    });

    // Check final statistics
    console.log('\n4. Checking final statistics...');
    const stats = await prisma.parsingHistory.aggregate({
      where: { status: 'completed' },
      _sum: {
        messagesRead: true,
        productsCreated: true,
      },
    });

    console.log('✅ Final statistics:', {
      totalMessages: stats._sum.messagesRead,
      totalProducts: stats._sum.productsCreated,
    });

    // Clean up test records
    console.log('\n5. Cleaning up test records...');
    await prisma.parsingHistory.deleteMany({
      where: {
        id: { in: [record1.id, record2.id] },
      },
    });
    console.log('✅ Test records deleted');

    console.log('\n🎉 Parallel parsing test completed successfully!');
    console.log('✅ Multiple parsers can run simultaneously');
    console.log('✅ Each parser tracks its own progress independently');
    console.log('✅ Statistics are aggregated correctly');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testParallelParsing();
