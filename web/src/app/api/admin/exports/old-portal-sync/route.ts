import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { publicUrl } from '@/lib/s3u';
import { logRequestError } from '@/lib/server/request-logging';
import { queueOldPortalXmlImport } from '@/lib/services/old-portal-xml-import-service';

const XML_NAME_RE =
  /^products-export-\d{4}-\d{2}-\d{2}(?:-\d{2}-\d{2}-\d{2})?\.xml$/;

function hasExportAccess(role: string): boolean {
  return role === 'ADMIN' || role === 'EXPORT_MANAGER';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasExportAccess(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const xmlFilename =
      typeof body.xmlFilename === 'string' ? body.xmlFilename.trim() : '';

    if (!xmlFilename || !XML_NAME_RE.test(xmlFilename)) {
      return NextResponse.json(
        {
          error: 'Invalid xmlFilename',
          message:
            'Ожидается имя файла вида products-export-YYYY-MM-DD-HH-MM-SS.xml',
        },
        { status: 400 }
      );
    }

    const s3Url = publicUrl(`exports/${xmlFilename}`);

    const actor =
      session.user.email || session.user.name || session.user.id || 'unknown';

    const result = await queueOldPortalXmlImport({
      xmlFilename,
      s3Url,
      triggeredBy: `manual:${actor}`,
      mode: 'background',
    });

    if (result.ok) {
      return NextResponse.json({
        success: true,
        accepted: true,
        runId: result.runId,
      });
    }

    if (result.reason === 'disabled') {
      return NextResponse.json(
        {
          error: 'Old portal import disabled',
          message:
            'Импорт на старый портал выключен. Задайте OLD_PORTAL_XML_IMPORT_ENABLED=true на сервере.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Import already running',
        message:
          'Уже выполняется загрузка XML на старый портал. Дождитесь завершения.',
        running: result.running,
      },
      { status: 409 }
    );
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/exports/old-portal-sync',
      error,
      'Old portal sync:'
    );
    return NextResponse.json(
      {
        error: 'Failed to queue old portal import',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
