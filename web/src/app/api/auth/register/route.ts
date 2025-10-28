import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/server/db';
import { emailService } from '@/lib/server/email';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone } = body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
    };

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Требуются email и номер телефона' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json({ error: 'Требуется пароль' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            'Пользователь с таким email или номером телефона уже существует',
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Determine role based on admin email/phone
    let role: 'CLIENT' | 'PROVIDER' | 'CLIENT' = 'CLIENT';
    if (env.ADMIN_EMAIL && email === env.ADMIN_EMAIL) {
      role = 'CLIENT';
    } else if (env.ADMIN_PHONE && phone === env.ADMIN_PHONE) {
      role = 'CLIENT';
    }

    // Check if there's a provider with this phone
    let providerId = null;
    if (phone) {
      const provider = await prisma.provider.findFirst({
        where: { phone },
      });
      if (provider) {
        role = 'PROVIDER';
        providerId = provider.id;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        role,
        providerId,
      },
    });

    // Send welcome email if user has email
    if (email && name) {
      try {
        await emailService.sendWelcomeEmail(email, name);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
