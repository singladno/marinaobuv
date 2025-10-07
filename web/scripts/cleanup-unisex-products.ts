import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUnisexProducts() {
  console.log('🔍 Finding products with UNISEX gender...');
  
  // Find products with UNISEX gender
  const unisexProducts = await prisma.product.findMany({
    where: {
      gender: 'UNISEX' as any
    },
    select: {
      id: true,
      name: true,
      gender: true
    }
  });

  console.log(`Found ${unisexProducts.length} products with UNISEX gender:`);
  unisexProducts.forEach(product => {
    console.log(`- ${product.name} (${product.id})`);
  });

  if (unisexProducts.length > 0) {
    console.log('\n🔄 Updating UNISEX products to MALE...');
    
    const result = await prisma.product.updateMany({
      where: {
        gender: 'UNISEX' as any
      },
      data: {
        gender: 'MALE'
      }
    });

    console.log(`✅ Updated ${result.count} products from UNISEX to MALE`);
  } else {
    console.log('✅ No products with UNISEX gender found');
  }

  // Also check draft products
  console.log('\n🔍 Checking draft products...');
  const unisexDrafts = await prisma.waDraftProduct.findMany({
    where: {
      gender: 'UNISEX' as any
    },
    select: {
      id: true,
      name: true,
      gender: true
    }
  });

  console.log(`Found ${unisexDrafts.length} draft products with UNISEX gender`);

  if (unisexDrafts.length > 0) {
    console.log('\n🔄 Updating UNISEX draft products to MALE...');
    
    const result = await prisma.waDraftProduct.updateMany({
      where: {
        gender: 'UNISEX' as any
      },
      data: {
        gender: 'MALE'
      }
    });

    console.log(`✅ Updated ${result.count} draft products from UNISEX to MALE`);
  }

  console.log('\n✅ Cleanup completed!');
}

cleanupUnisexProducts()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
