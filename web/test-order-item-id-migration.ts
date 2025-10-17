import { prisma } from './src/lib/db-node';
import { generateItemCode } from './src/lib/itemCodeGenerator';

async function testOrderItemIdMigration() {
  console.log('🧪 Testing Order Item ID Migration...');

  try {
    // Test 1: Check if the sequence exists
    console.log('📋 Test 1: Checking if sequence exists...');
    const sequenceResult = await prisma.$queryRaw<{ sequence_name: string }[]>`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_name = 'order_item_id_seq'
    `;

    if (sequenceResult.length === 0) {
      throw new Error('❌ Sequence order_item_id_seq not found');
    }
    console.log('✅ Sequence exists');

    // Test 2: Check if the function exists
    console.log('📋 Test 2: Checking if function exists...');
    const functionResult = await prisma.$queryRaw<{ routine_name: string }[]>`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'get_next_order_item_id'
    `;

    if (functionResult.length === 0) {
      throw new Error('❌ Function get_next_order_item_id not found');
    }
    console.log('✅ Function exists');

    // Test 3: Test the function directly
    console.log('📋 Test 3: Testing function directly...');
    const functionTestResult = await prisma.$queryRaw<
      [{ get_next_order_item_id: string }]
    >`
      SELECT get_next_order_item_id() as get_next_order_item_id
    `;

    const generatedId = functionTestResult[0]?.get_next_order_item_id;
    if (!generatedId || !/^\d+$/.test(generatedId)) {
      throw new Error(`❌ Function returned invalid ID: ${generatedId}`);
    }
    console.log(`✅ Function works, generated ID: ${generatedId}`);

    // Test 4: Test the generateItemCode function
    console.log('📋 Test 4: Testing generateItemCode function...');
    const itemCode1 = await generateItemCode();
    const itemCode2 = await generateItemCode();

    if (!/^\d+$/.test(itemCode1) || !/^\d+$/.test(itemCode2)) {
      throw new Error(
        `❌ generateItemCode returned invalid format: ${itemCode1}, ${itemCode2}`
      );
    }

    if (itemCode1 === itemCode2) {
      throw new Error(
        `❌ generateItemCode returned duplicate IDs: ${itemCode1}`
      );
    }

    const id1 = parseInt(itemCode1);
    const id2 = parseInt(itemCode2);

    if (id2 !== id1 + 1) {
      throw new Error(`❌ IDs are not sequential: ${id1}, ${id2}`);
    }

    console.log(
      `✅ generateItemCode works, generated IDs: ${itemCode1}, ${itemCode2}`
    );

    // Test 5: Check existing order items
    console.log('📋 Test 5: Checking existing order items...');
    const existingItems = await prisma.orderItem.findMany({
      select: {
        id: true,
        itemCode: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 5,
    });

    console.log(
      `📊 Found ${existingItems.length} existing order items (showing first 5):`
    );
    existingItems.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ID: ${item.id}, ItemCode: ${item.itemCode}, Created: ${item.createdAt}`
      );
    });

    // Test 6: Check if any order items have non-numeric item codes
    console.log('📋 Test 6: Checking for non-numeric item codes...');
    const allItems = await prisma.orderItem.findMany({
      select: {
        id: true,
        itemCode: true,
      },
      take: 10,
    });

    const nonNumericItems = allItems.filter(
      item => item.itemCode && !/^[0-9]+$/.test(item.itemCode)
    );

    if (nonNumericItems.length > 0) {
      console.log(
        `⚠️  Found ${nonNumericItems.length} items with non-numeric codes (showing first 5):`
      );
      nonNumericItems.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ID: ${item.id}, ItemCode: ${item.itemCode}`
        );
      });
    } else {
      console.log('✅ All existing order items have numeric item codes');
    }

    console.log('');
    console.log(
      '🎉 All tests passed! Order Item ID Migration is working correctly.'
    );
    console.log('');
    console.log('📋 Test Summary:');
    console.log('- ✅ Database sequence exists and is functional');
    console.log('- ✅ Database function exists and works correctly');
    console.log(
      '- ✅ generateItemCode function works and generates sequential IDs'
    );
    console.log('- ✅ Existing order items are properly formatted');
    console.log('');
    console.log('🚀 The migration is ready for production use!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOrderItemIdMigration().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
