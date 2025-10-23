import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import crypto from 'crypto';

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

    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    console.log('Password reset link:', resetLink);

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json({
      message:
        'Если пользователь с таким email существует, инструкции по восстановлению пароля будут отправлены',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
