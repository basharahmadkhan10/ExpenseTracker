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

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const memberDetails = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      joinedAt: m.joinedAt,
      leftAt: m.leftAt,
    }));

    const balances: {
      [userId: string]: { paid: number; owed: number; net: number; name: string };
    } = {};
    memberDetails.forEach((m) => {
      balances[m.id] = { name: m.name, paid: 0, owed: 0, net: 0 };
    });

    // 1. Calculate how much each member paid (converted to INR)
    const paidRecords = await prisma.expense.findMany({
      where: {
        groupId,
        ...queryFilter,
      },
      select: {
        payerId: true,
        convertedAmount: true,
      },
    });
    paidRecords.forEach((rec) => {
      if (balances[rec.payerId]) {
        balances[rec.payerId].paid += rec.convertedAmount;
      }
    });

    // 2. Calculate how much each member owes (splits in INR)
    const owedRecords = await prisma.expenseSplit.findMany({
      where: {
        expense: {
          groupId,
          ...queryFilter,
        },
      },
      select: {
        userId: true,
        amount: true,
      },
    });
    owedRecords.forEach((rec) => {
      if (balances[rec.userId]) {
        balances[rec.userId].owed += rec.amount;
      }
    });

    // 3. Incorporate Settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId,
        ...queryFilter,
      },
      select: {
        payerId: true,
        receiverId: true,
        amount: true,
      },
    });
    settlements.forEach((set) => {
      if (balances[set.payerId]) {
        balances[set.payerId].paid += set.amount;
      }
      if (balances[set.receiverId]) {
        balances[set.receiverId].owed += set.amount;
      }
    });

    // 4. Calculate Net balances
    const summary = Object.keys(balances).map((userId) => {
      const bal = balances[userId];
      const net = bal.paid - bal.owed;
      return {
        userId,
        name: bal.name,
        totalPaid: Math.round(bal.paid * 100) / 100,
        totalOwed: Math.round(bal.owed * 100) / 100,
        netBalance: Math.round(net * 100) / 100,
      };
    });

    // 5. Simplified debts minimization algorithm
    const payersList: { name: string; id: string; amount: number }[] = [];
    const receiversList: { name: string; id: string; amount: number }[] = [];

    summary.forEach((s) => {
      if (s.netBalance < -0.01) {
        payersList.push({ id: s.userId, name: s.name, amount: -s.netBalance });
      } else if (s.netBalance > 0.01) {
        receiversList.push({ id: s.userId, name: s.name, amount: s.netBalance });
      }
    });

    payersList.sort((a, b) => b.amount - a.amount);
    receiversList.sort((a, b) => b.amount - a.amount);

    const transactions: {
      from: string;
      fromId: string;
      to: string;
      toId: string;
      amount: number;
    }[] = [];
    let pIdx = 0;
    let rIdx = 0;

    while (pIdx < payersList.length && rIdx < receiversList.length) {
      const debtor = payersList[pIdx];
      const creditor = receiversList[rIdx];

      const amountToSettle = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        from: debtor.name,
        fromId: debtor.id,
        to: creditor.name,
        toId: creditor.id,
        amount: Math.round(amountToSettle * 100) / 100,
      });

      debtor.amount -= amountToSettle;
      creditor.amount -= amountToSettle;

      if (debtor.amount < 0.01) pIdx++;
      if (receiversList[rIdx].amount < 0.01) rIdx++;
    }

    return NextResponse.json(
      {
        balances: summary,
        reconciliation: transactions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Fetch balances error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
