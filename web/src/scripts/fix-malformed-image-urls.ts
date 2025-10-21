import { prisma } from '../lib/db-node';

async function fixMalformedImageUrls() {
  console.log('🔍 Checking for malformed image URLs...');

  try {
    // Find all product images with double https://
    const malformedImages = await prisma.productImage.findMany({
      where: {
        url: {
          startsWith: 'https://https://',
        },
      },
    });

    console.log(`Found ${malformedImages.length} malformed image URLs`);

    if (malformedImages.length === 0) {
      console.log('✅ No malformed URLs found');
      return;
    }

    // Fix each malformed URL
    for (const image of malformedImages) {
      const fixedUrl = image.url.replace('https://https://', 'https://');

      await prisma.productImage.update({
        where: { id: image.id },
        data: { url: fixedUrl },
      });

      console.log(
        `✅ Fixed URL for image ${image.id}: ${image.url} → ${fixedUrl}`
      );
    }

    console.log(
      `🎉 Successfully fixed ${malformedImages.length} malformed URLs`
    );
  } catch (error) {
    console.error('❌ Error fixing malformed URLs:', error);
    throw error;
  }
}

// Run the script
fixMalformedImageUrls()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });
