import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    const requesterMembership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { username, joinedAt } = await request.json();
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const targetName = username.trim();
    const joinedDate = joinedAt ? new Date(joinedAt) : new Date();

    if (isNaN(joinedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid joinedAt date format' }, { status: 400 });
    }

    // Find or create target user
    let targetUser = await prisma.user.findFirst({
      where: { name: targetName },
    });

    if (!targetUser) {
      const defaultHash = await hashPassword('password123');
      targetUser = await prisma.user.create({
        data: {
          name: targetName,
          passwordHash: defaultHash,
        },
      });
    }

    const existingMembership = await prisma.groupMember.findFirst({
      where: { groupId, userId: targetUser.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this group' },
        { status: 409 },
      );
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id,
        joinedAt: joinedDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: member.user.id,
        name: member.user.name,
        joinedAt: member.joinedAt,
        leftAt: member.leftAt,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Add group member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    const requesterMembership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { userId, joinedAt, leftAt } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const gm = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!gm) {
      return NextResponse.json({ error: 'Member not found in group' }, { status: 404 });
    }

    const updateData: any = {};
    if (joinedAt) {
      const parsedJoined = new Date(joinedAt);
      if (isNaN(parsedJoined.getTime())) {
        return NextResponse.json({ error: 'Invalid joinedAt date format' }, { status: 400 });
      }
      updateData.joinedAt = parsedJoined;
    }

    if (leftAt !== undefined) {
      if (leftAt === null) {
        updateData.leftAt = null;
      } else {
        const parsedLeft = new Date(leftAt);
        if (isNaN(parsedLeft.getTime())) {
          return NextResponse.json({ error: 'Invalid leftAt date format' }, { status: 400 });
        }
        const currentJoined = updateData.joinedAt || gm.joinedAt;
        if (parsedLeft.getTime() < currentJoined.getTime()) {
          return NextResponse.json(
            { error: 'Left date cannot be before joined date' },
            { status: 400 },
          );
        }
        updateData.leftAt = parsedLeft;
      }
    }

    const updated = await prisma.groupMember.update({
      where: { id: gm.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      data: updateData,
    });

    return NextResponse.json(
      {
        id: updated.user.id,
        name: updated.user.name,
        joinedAt: updated.joinedAt,
        leftAt: updated.leftAt,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Update group member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
