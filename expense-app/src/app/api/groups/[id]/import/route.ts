import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { processImport } from '@/lib/importer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'CSV File is required' }, { status: 400 });
    }

    const fileText = await file.text();
    const result = await processImport(fileText, groupId, file.name);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('CSV Import route error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const sessions = await prisma.importSession.findMany({
      where: { groupId },
      include: {
        _count: {
          select: {
            anomalies: {
              where: { status: 'PENDING' },
            },
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const formatted = sessions.map(s => ({
      id: s.id,
      fileName: s.fileName,
      uploadedAt: s.uploadedAt,
      status: s.status,
      pendingAnomaliesCount: s._count.anomalies,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Fetch import sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
