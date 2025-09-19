import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTables() {
  console.log('🧹 Starting to clear tables...');

  try {
    // Clear in the correct order to respect foreign key constraints

    // 1. Clear product images first (they reference products)
    console.log('🖼️ Clearing ProductImage table...');
    const deletedProductImages = await prisma.productImage.deleteMany({});
    console.log(`✅ Deleted ${deletedProductImages.count} product images`);

    // 2. Clear draft product images (they reference draft products)
    console.log('📸 Clearing WaDraftProductImage table...');
    const deletedImages = await prisma.waDraftProductImage.deleteMany({});
    console.log(`✅ Deleted ${deletedImages.count} draft product images`);

    // 3. Clear draft products (they reference messages and providers)
    console.log('📦 Clearing WaDraftProduct table...');
    const deletedDrafts = await prisma.waDraftProduct.deleteMany({});
    console.log(`✅ Deleted ${deletedDrafts.count} draft products`);

    // 4. Clear WhatsApp messages last
    console.log('💬 Clearing WhatsAppMessage table...');
    const deletedMessages = await prisma.whatsAppMessage.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} WhatsApp messages`);

    console.log('🎉 All tables cleared successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Product images: ${deletedProductImages.count}`);
    console.log(`   - Draft product images: ${deletedImages.count}`);
    console.log(`   - Draft products: ${deletedDrafts.count}`);
    console.log(`   - WhatsApp messages: ${deletedMessages.count}`);
  } catch (error) {
    console.error('❌ Error clearing tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
