import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDateParam) {
      const start = new Date(startDateParam);
      if (!isNaN(start.getTime())) {
        dateFilter.gte = start;
      }
    }
    if (endDateParam) {
      const end = new Date(endDateParam);
      if (!isNaN(end.getTime())) {
        dateFilter.lte = end;
      }
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const queryFilter = hasDateFilter ? { date: dateFilter } : {};

    const targetUserProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    });

    if (!targetUserProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Fetch splits where targetUser owes money (Owed splits)
    const splits = await prisma.expenseSplit.findMany({
      where: {
        userId: targetUserId,
        expense: {
          groupId,
          ...queryFilter,
        },
      },
      include: {
        expense: {
          include: {
            payer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        expense: {
          date: 'asc',
        },
      },
    });

    const detailedSplits = splits.map((s) => ({
      expenseId: s.expense.id,
      date: s.expense.date,
      description: s.expense.description,
      payerName: s.expense.payer.name,
      payerId: s.expense.payerId,
      originalAmount: s.expense.amount,
      currency: s.expense.currency,
      exchangeRate: s.expense.exchangeRate,
      convertedAmount: s.expense.convertedAmount,
      splitType: s.expense.splitType,
      yourShare: s.amount,
    }));

    // 2. Fetch expenses paid by targetUser
    const paidExpenses = await prisma.expense.findMany({
      where: {
        groupId,
        payerId: targetUserId,
        ...queryFilter,
      },
      include: {
        splits: {
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
      orderBy: {
        date: 'asc',
      },
    });

    const detailedPaidExpenses = paidExpenses.map((e) => ({
      expenseId: e.id,
      date: e.date,
      description: e.description,
      originalAmount: e.amount,
      currency: e.currency,
      exchangeRate: e.exchangeRate,
      convertedAmount: e.convertedAmount,
      splitType: e.splitType,
      splits: e.splits.map((sp) => ({
        userId: sp.userId,
        name: sp.user.name,
        amount: sp.amount,
      })),
    }));

    // 3. Fetch settlements paid by targetUser
    const settlementsPaid = await prisma.settlement.findMany({
      where: {
        groupId,
        payerId: targetUserId,
        ...queryFilter,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const detailedSettlementsPaid = settlementsPaid.map((s) => ({
      settlementId: s.id,
      date: s.date,
      amount: s.amount,
      receiverName: s.receiver.name,
      receiverId: s.receiverId,
    }));

    // 4. Fetch settlements received by targetUser
    const settlementsReceived = await prisma.settlement.findMany({
      where: {
        groupId,
        receiverId: targetUserId,
        ...queryFilter,
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const detailedSettlementsReceived = settlementsReceived.map((s) => ({
      settlementId: s.id,
      date: s.date,
      amount: s.amount,
      payerName: s.payer.name,
      payerId: s.payerId,
    }));

    // Aggregate summaries
    const totalPaid = detailedPaidExpenses.reduce((sum, e) => sum + e.convertedAmount, 0);
    const totalOwed = detailedSplits.reduce((sum, s) => sum + s.yourShare, 0);
    const totalSettlementsPaid = detailedSettlementsPaid.reduce((sum, s) => sum + s.amount, 0);
    const totalSettlementsReceived = detailedSettlementsReceived.reduce(
      (sum, s) => sum + s.amount,
      0,
    );

    const netBalance = totalPaid + totalSettlementsPaid - (totalOwed + totalSettlementsReceived);

    return NextResponse.json(
      {
        user: targetUserProfile,
        summary: {
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalOwed: Math.round(totalOwed * 100) / 100,
          settlementsPaid: Math.round(totalSettlementsPaid * 100) / 100,
          settlementsReceived: Math.round(totalSettlementsReceived * 100) / 100,
          netBalance: Math.round(netBalance * 100) / 100,
        },
        splits: detailedSplits,
        paidExpenses: detailedPaidExpenses,
        settlementsPaid: detailedSettlementsPaid,
        settlementsReceived: detailedSettlementsReceived,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Fetch drilldown details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
