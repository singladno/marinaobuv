import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    success: true,
    targetGroupId: env.TARGET_GROUP_ID || 'Not set',
    message: env.TARGET_GROUP_ID
      ? `Target group ID is set to: ${env.TARGET_GROUP_ID}`
      : 'TARGET_GROUP_ID is not set in environment variables'
  });
}
