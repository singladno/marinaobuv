import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { normalizePhoneToE164 } from '@/lib/server/sms';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { phone, name, email, password, role, providerId } = body;

    // Validate required fields - either phone or email must be provided
    if (!role || !password) {
      return NextResponse.json(
        { error: 'Role and password are required' },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Either phone or email must be provided' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Normalize phone number if provided
    const normalizedPhone = phone ? normalizePhoneToE164(phone) : null;

    // Check if user with this phone or email already exists
    const whereConditions = [];
    if (normalizedPhone) {
      whereConditions.push({ phone: normalizedPhone });
    }
    if (email) {
      whereConditions.push({ email: email });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: whereConditions,
      },
    });

    if (existingUser) {
      if (normalizedPhone && existingUser.phone === normalizedPhone) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 400 }
        );
      }
      if (email && existingUser.email === email) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create user with proper password hash
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: email || null,
        name,
        role,
        providerId: providerId || null,
        passwordHash: hashedPassword,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
