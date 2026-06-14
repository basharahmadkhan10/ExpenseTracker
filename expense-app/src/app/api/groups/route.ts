import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.groupMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      members: m.group.members.map((gm) => ({
        id: gm.user.id,
        name: gm.user.name,
        joinedAt: gm.joinedAt,
        leftAt: gm.leftAt,
      })),
    }));

    return NextResponse.json(groups, { status: 200 });
  } catch (error) {
    console.error('Fetch groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name: name.trim(),
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: user.id,
          joinedAt: new Date(),
        },
      });

      return g;
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
