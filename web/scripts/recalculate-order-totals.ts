/**
 * Script to recalculate order totals for all existing orders
 * This fixes orders that were created with incorrect total calculations
 */

import { prisma } from '../src/lib/server/db';

async function recalculateOrderTotals() {
  console.log('🔄 Starting order totals recalculation...\n');

  try {
    // Get all orders with their items and feedbacks
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            feedbacks: {
              where: {
                feedbackType: {
                  in: ['WRONG_SIZE', 'WRONG_ITEM'],
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Found ${orders.length} orders to process\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    let totalDifference = 0;

    for (const order of orders) {
      // Calculate new total excluding refused items
      const newTotal = order.items.reduce((sum, item) => {
        // Check if item is refused
        const isRefused = item.feedbacks.some(
          feedback =>
            feedback.feedbackType === 'WRONG_SIZE' ||
            feedback.feedbackType === 'WRONG_ITEM'
        );

        if (isRefused) {
          return sum;
        }

        // Add item total: priceBox * qty
        return sum + Number(item.priceBox) * item.qty;
      }, 0);

      const oldTotal = Number(order.total);
      const difference = newTotal - oldTotal;

      // Only update if there's a difference
      if (Math.abs(difference) > 0.01) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            total: newTotal,
            subtotal: newTotal,
          },
        });

        updatedCount++;
        totalDifference += difference;

        console.log(
          `✅ Order ${order.orderNumber || order.id.slice(-8)}: ${oldTotal.toFixed(2)} → ${newTotal.toFixed(2)} (${difference > 0 ? '+' : ''}${difference.toFixed(2)})`
        );
      } else {
        unchangedCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   • Total orders processed: ${orders.length}`);
    console.log(`   • Orders updated: ${updatedCount}`);
    console.log(`   • Orders unchanged: ${unchangedCount}`);
    console.log(
      `   • Total difference: ${totalDifference > 0 ? '+' : ''}${totalDifference.toFixed(2)}`
    );
    console.log('\n✅ Order totals recalculation completed!');
  } catch (error) {
    console.error('❌ Error recalculating order totals:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
recalculateOrderTotals()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
