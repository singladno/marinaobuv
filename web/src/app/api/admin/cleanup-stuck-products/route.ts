import { NextResponse } from 'next/server';

import { cleanupStuckProducts } from '@/scripts/cleanup-stuck-products';

export async function POST() {
  try {
    console.log('🧹 Starting cleanup of stuck products...');

    await cleanupStuckProducts();

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned up stuck products',
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup stuck products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
