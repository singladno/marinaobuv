import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    // Validate required fields
    if (!newPassword) {
      return NextResponse.json(
        { error: 'Требуется новый пароль' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user password:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении пароля пользователя' },
      { status: 500 }
    );
  }
}
