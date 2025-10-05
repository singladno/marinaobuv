#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

async function testParsingMonitoring() {
  try {
    console.log('🧪 Testing parsing monitoring system...');

    // Test 1: Create a test parsing history record
    console.log('\n1. Creating test parsing history record...');
    const testRecord = await prisma.parsingHistory.create({
      data: {
        startedAt: new Date(),
        status: 'running',
        messagesRead: 0,
        productsCreated: 0,
      },
    });
    console.log('✅ Test record created:', testRecord.id);

    // Test 2: Update the record to completed
    console.log('\n2. Updating record to completed...');
    const updatedRecord = await prisma.parsingHistory.update({
      where: { id: testRecord.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        messagesRead: 15,
        productsCreated: 3,
        duration: 45,
      },
    });
    console.log('✅ Record updated:', updatedRecord.status);

    // Test 3: Query parsing history
    console.log('\n3. Querying parsing history...');
    const history = await prisma.parsingHistory.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
    });
    console.log('✅ Found', history.length, 'records');

    // Test 4: Query running parsers
    console.log('\n4. Querying running parsers...');
    const runningParsers = await prisma.parsingHistory.count({
      where: { status: 'running' },
    });
    console.log('✅ Running parsers:', runningParsers);

    // Test 5: Query statistics
    console.log('\n5. Querying statistics...');
    const stats = await prisma.parsingHistory.aggregate({
      where: { status: 'completed' },
      _sum: {
        messagesRead: true,
        productsCreated: true,
      },
      _avg: {
        duration: true,
      },
    });
    console.log('✅ Statistics:', {
      totalMessages: stats._sum.messagesRead,
      totalProducts: stats._sum.productsCreated,
      avgDuration: Math.round(stats._avg.duration || 0),
    });

    // Clean up test record
    console.log('\n6. Cleaning up test record...');
    await prisma.parsingHistory.delete({
      where: { id: testRecord.id },
    });
    console.log('✅ Test record deleted');

    console.log(
      '\n🎉 All tests passed! Parsing monitoring system is working correctly.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testParsingMonitoring();
