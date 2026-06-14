import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * Retrieves a specific group along with its active memberships and user details.
 * Requires authentication and group membership verification.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id },
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
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const formattedGroup = {
      ...group,
      members: group.members.map((gm) => ({
        id: gm.user.id,
        name: gm.user.name,
        joinedAt: gm.joinedAt,
        leftAt: gm.leftAt,
      })),
    };

    return NextResponse.json(formattedGroup, { status: 200 });
  } catch (error) {
    console.error('Fetch group details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 403 });
    }

    
    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
