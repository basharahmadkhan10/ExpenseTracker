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

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: { date: 'desc' },
    });

    const formatted = expenses.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      payerId: e.payerId,
      payerName: e.payer.name,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      exchangeRate: e.exchangeRate,
      convertedAmount: e.convertedAmount,
      date: e.date,
      splitType: e.splitType,
      splits: e.splits.map((sp) => ({
        userId: sp.userId,
        name: sp.user.name,
        amount: sp.amount,
      })),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { description, amount, currency, exchangeRate, date, splitType, payerId, splits } =
      await request.json();

    if (!description || !amount || !date || !payerId || !splits || splits.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    const parsedRate = exchangeRate ? parseFloat(exchangeRate) : 1.0;
    const convertedAmount = parsedAmount * parsedRate;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const exp = await prisma.$transaction(async (tx) => {
      const e = await tx.expense.create({
        data: {
          groupId,
          payerId,
          description: description.trim(),
          amount: parsedAmount,
          currency: currency || 'INR',
          exchangeRate: parsedRate,
          convertedAmount,
          date: expenseDate,
          splitType: splitType || 'EQUAL',
        },
      });

      for (const sp of splits) {
        await tx.expenseSplit.create({
          data: {
            expenseId: e.id,
            userId: sp.userId,
            amount: Math.round(parseFloat(sp.amount) * 100) / 100,
          },
        });
      }

      return e;
    });

    return NextResponse.json(exp, { status: 201 });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
