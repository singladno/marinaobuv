import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

interface ParsingProgressUpdate {
  parsingHistoryId: string;
  messagesRead?: number;
  productsCreated?: number;
  status?: 'running' | 'completed' | 'failed';
  errorMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ParsingProgressUpdate = await request.json();
    const {
      parsingHistoryId,
      messagesRead,
      productsCreated,
      status,
      errorMessage,
    } = body;

    if (!parsingHistoryId) {
      return NextResponse.json(
        { success: false, error: 'parsingHistoryId is required' },
        { status: 400 }
      );
    }

    // Build update data object with only provided fields
    const updateData: any = {};

    if (messagesRead !== undefined) {
      updateData.messagesRead = messagesRead;
    }

    if (productsCreated !== undefined) {
      updateData.productsCreated = productsCreated;
    }

    if (status) {
      updateData.status = status;

      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();

        // Calculate duration if completing
        const parsingRecord = await prisma.parsingHistory.findUnique({
          where: { id: parsingHistoryId },
          select: { startedAt: true },
        });

        if (parsingRecord) {
          const duration = Math.floor(
            (Date.now() - parsingRecord.startedAt.getTime()) / 1000
          );
          updateData.duration = duration;
        }
      }
    }

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    // Upsert the parsing history record with safe defaults to avoid not-found errors
    const updatedRecord = await prisma.parsingHistory.upsert({
      where: { id: parsingHistoryId },
      update: updateData,
      create: {
        id: parsingHistoryId,
        // Provide sensible defaults when record is first created
        startedAt: new Date(),
        status: updateData.status ?? 'running',
        messagesRead:
          typeof updateData.messagesRead === 'number'
            ? updateData.messagesRead
            : 0,
        productsCreated:
          typeof updateData.productsCreated === 'number'
            ? updateData.productsCreated
            : 0,
        // Only include optional fields if already computed
        ...(updateData.completedAt
          ? { completedAt: updateData.completedAt }
          : {}),
        ...(updateData.duration ? { duration: updateData.duration } : {}),
        ...(updateData.errorMessage
          ? { errorMessage: updateData.errorMessage }
          : {}),
      },
    });

    console.log(`📊 Updated parsing progress for ${parsingHistoryId}:`, {
      messagesRead: updatedRecord.messagesRead,
      productsCreated: updatedRecord.productsCreated,
      status: updatedRecord.status,
    });

    return NextResponse.json({
      success: true,
      data: updatedRecord,
    });
  } catch (error) {
    console.error('❌ Error updating parsing progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update parsing progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsingHistoryId = searchParams.get('parsingHistoryId');

    if (!parsingHistoryId) {
      return NextResponse.json(
        { success: false, error: 'parsingHistoryId is required' },
        { status: 400 }
      );
    }

    const record = await prisma.parsingHistory.findUnique({
      where: { id: parsingHistoryId },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Parsing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('❌ Error fetching parsing progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch parsing progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
