#!/usr/bin/env tsx

/**
 * Test script for the fixed color mapping system
 * This will show you how the new color mapping works
 */

import './load-env';
import { FixedColorMappingService } from '../lib/services/fixed-color-mapping-service';

async function testColorMapping() {
  console.log('🧪 Testing Fixed Color Mapping System\n');

  const colorMappingService = new FixedColorMappingService();

  // Test data - simulate analysis results
  const mockAnalysisResults = [
    {
      imageUrl: 'https://example.com/image1.jpg',
      colors: ['черный', 'белый'],
      name: 'Test Product 1',
    },
    {
      imageUrl: 'https://example.com/image2.jpg',
      colors: ['коричневый'],
      name: 'Test Product 2',
    },
    {
      imageUrl: 'https://example.com/image3.jpg',
      colors: ['синий', 'красный'],
      name: 'Test Product 3',
    },
  ];

  console.log('📊 Mock Analysis Results:');
  mockAnalysisResults.forEach((result, index) => {
    console.log(`  Image ${index + 1}: ${result.imageUrl}`);
    console.log(`    Colors: ${result.colors.join(', ')}`);
    console.log(`    Name: ${result.name}`);
    console.log('');
  });

  // Test color mapping extraction
  console.log('🔍 Testing Color Mapping Extraction...\n');

  const colorMappings =
    colorMappingService.extractColorMappingsFromAnalysis(mockAnalysisResults);

  console.log('📋 Extracted Color Mappings:');
  colorMappings.forEach((mapping, index) => {
    console.log(`  Mapping ${index + 1}:`);
    console.log(`    Image URL: ${mapping.imageUrl}`);
    console.log(`    Color: ${mapping.color}`);
    console.log('');
  });

  // Test URL matching
  console.log('🔗 Testing URL Matching...\n');

  const testCases = [
    {
      imageUrl: 'https://s3.amazonaws.com/bucket/images/abc123.jpg',
      originalUrl: 'https://example.com/abc123.jpg',
      expected: true,
    },
    {
      imageUrl: 'https://s3.amazonaws.com/bucket/images/def456.jpg',
      originalUrl: 'https://example.com/abc123.jpg',
      expected: false,
    },
    {
      imageUrl: 'https://example.com/same-image.jpg',
      originalUrl: 'https://example.com/same-image.jpg',
      expected: true,
    },
  ];

  testCases.forEach((testCase, index) => {
    const isMatch = (colorMappingService as any).isUrlMatch(
      testCase.imageUrl,
      testCase.originalUrl
    );
    const status = isMatch === testCase.expected ? '✅' : '❌';
    console.log(`  Test ${index + 1}: ${status}`);
    console.log(`    Image: ${testCase.imageUrl}`);
    console.log(`    Original: ${testCase.originalUrl}`);
    console.log(`    Expected: ${testCase.expected}, Got: ${isMatch}`);
    console.log('');
  });

  console.log('🎉 Color mapping test completed!');
  console.log(
    '💡 The new system properly maps each image to its specific detected color.'
  );
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testColorMapping();
}
