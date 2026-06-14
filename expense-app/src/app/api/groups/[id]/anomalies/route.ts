import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

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

    const anomalies = await prisma.importAnomaly.findMany({
      where: {
        session: {
          groupId,
        },
      },
      include: {
        session: {
          select: {
            fileName: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // shows PENDING first, since PENDING < APPROVED/REJECTED alphabetically
        { rowNumber: 'asc' },
      ],
    });

    return NextResponse.json(anomalies, { status: 200 });
  } catch (error) {
    console.error('Fetch anomalies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
