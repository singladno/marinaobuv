import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { emailService } from '@/lib/server/email';
import crypto from 'crypto';
import { logRequestError } from '@/lib/server/request-logging';
import { logger } from '@/lib/server/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message:
          'Если пользователь с таким email существует, инструкции по восстановлению пароля будут отправлены',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    logger.debug({ event: 'password_reset_email_prepared' }, 'password reset link generated');

    // Send email with reset link
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      resetLink
    );

    if (!emailSent) {
      logRequestError(request, '/api/auth/forgot-password', email, 'Failed to send password reset email to:');
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message:
        'Если пользователь с таким email существует, инструкции по восстановлению пароля будут отправлены',
    });
  } catch (error) {
    logRequestError(request, '/api/auth/forgot-password', error, 'Forgot password error:');
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
