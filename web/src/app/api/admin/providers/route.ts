import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        place: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const body = await req.json();
    const { name, phone, place } = body as {
      name?: string;
      phone?: string;
      place?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Имя поставщика обязательно' },
        { status: 400 }
      );
    }

    // Check if provider with this name already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { name: name.trim() },
    });

    if (existingProvider) {
      return NextResponse.json(
        { error: 'Поставщик с таким именем уже существует' },
        { status: 409 }
      );
    }

    const provider = await prisma.provider.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        place: place?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        place: true,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);

    // Handle Prisma unique constraint errors
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Поставщик с таким именем уже существует' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Не удалось создать поставщика' },
      { status: 500 }
    );
  }
}
