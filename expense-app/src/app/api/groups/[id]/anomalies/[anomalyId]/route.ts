import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { findUserByName, parseCsvDate, EXCHANGE_RATE_USD_TO_INR, ParsedCsvRow } from '@/lib/importer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; anomalyId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, anomalyId } = await params;

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const anomaly = await prisma.importAnomaly.findUnique({
      where: { id: anomalyId },
      include: {
        session: true,
      },
    });

    if (!anomaly || anomaly.session.groupId !== groupId) {
      return NextResponse.json({ error: 'Anomaly not found' }, { status: 404 });
    }

    if (anomaly.status !== 'PENDING') {
      return NextResponse.json({ error: 'Anomaly has already been resolved' }, { status: 400 });
    }

    const { action, resolvedRowData } = await request.json();

    if (action === 'REJECT') {
      await prisma.importAnomaly.update({
        where: { id: anomalyId },
        data: { status: 'REJECTED' },
      });
      return NextResponse.json({ success: true, status: 'REJECTED' }, { status: 200 });
    }

    if (action !== 'APPROVE') {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
    }

    // Resolve details: use resolved values or fall back to raw CSV values
    const finalRowData: ParsedCsvRow = resolvedRowData || JSON.parse(anomaly.rawRowData);

    let rawAmount = finalRowData.amount || '';
    rawAmount = rawAmount.toString().replace(/["\s,]/g, '');
    let amount = parseFloat(rawAmount);

    if (isNaN(amount)) {
      return NextResponse.json({ error: 'Resolved amount is invalid' }, { status: 400 });
    }

    amount = Math.round(amount * 100) / 100;

    const currency = (finalRowData.currency || 'INR').trim().toUpperCase();
    let exchangeRate = 1.0;
    let convertedAmount = amount;

    if (currency === 'USD') {
      exchangeRate = EXCHANGE_RATE_USD_TO_INR;
      convertedAmount = amount * exchangeRate;
    }

    const { date: parsedDate } = parseCsvDate(finalRowData.date);
    if (!parsedDate) {
      return NextResponse.json({ error: 'Resolved date is invalid' }, { status: 400 });
    }

    const payerName = (finalRowData.paid_by || '').trim();
    const payerUser = await findUserByName(payerName);
    if (!payerUser) {
      return NextResponse.json({ error: `Resolved payer "${payerName}" not found` }, { status: 400 });
    }

    const splitTypeStr = (finalRowData.split_type || '').trim().toLowerCase();
    const splitWithStr = (finalRowData.split_with || '').trim();
    const descriptionStr = (finalRowData.description || '').toLowerCase();
    const isSettlement = 
      splitTypeStr === '' && 
      (splitWithStr.split(';').length === 1 && splitWithStr.length > 0) &&
      (descriptionStr.includes('paid back') || descriptionStr.includes('settle') || descriptionStr.includes('deposit'));

    if (isSettlement) {
      const receiverName = splitWithStr.trim();
      const receiverUser = await findUserByName(receiverName);
      if (!receiverUser) {
        return NextResponse.json({ error: `Resolved receiver "${receiverName}" not found` }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.settlement.create({
          data: {
            groupId,
            payerId: payerUser.id,
            receiverId: receiverUser.id,
            amount: convertedAmount,
            date: parsedDate,
          },
        });

        await tx.importAnomaly.update({
          where: { id: anomalyId },
          data: { status: 'APPROVED' },
        });
      });

      return NextResponse.json({ success: true, status: 'APPROVED', type: 'SETTLEMENT' }, { status: 200 });
    } else {
      const splitNames = splitWithStr ? splitWithStr.split(';').map(n => n.trim()).filter(Boolean) : [];
      const splitUsers: { id: string; name: string }[] = [];

      for (const sName of splitNames) {
        const sUser = await findUserByName(sName);
        if (!sUser) {
          return NextResponse.json({ error: `Resolved split member "${sName}" not found` }, { status: 400 });
        }
        splitUsers.push({ id: sUser.id, name: sUser.name });
      }

      if (splitUsers.length === 0) {
        return NextResponse.json({ error: 'Split member list is empty' }, { status: 400 });
      }

      const parsedSplits: { userId: string; amount: number }[] = [];
      const splitDetailsStr = (finalRowData.split_details || '').trim();

      if (splitTypeStr === 'equal' || !splitTypeStr) {
        const splitShare = convertedAmount / splitUsers.length;
        splitUsers.forEach(u => {
          parsedSplits.push({ userId: u.id, amount: splitShare });
        });
      } else if (splitTypeStr === 'unequal') {
        const detailParts = splitDetailsStr.split(';').map(p => p.trim()).filter(Boolean);
        let sum = 0;
        for (const part of detailParts) {
          const lastSpace = part.lastIndexOf(' ');
          if (lastSpace === -1) {
            return NextResponse.json({ error: `Invalid split detail: "${part}"` }, { status: 400 });
          }
          const name = part.substring(0, lastSpace).trim();
          const val = parseFloat(part.substring(lastSpace + 1).trim());
          const u = splitUsers.find(su => su.name.toLowerCase() === name.toLowerCase());
          if (!u) {
            return NextResponse.json({ error: `User "${name}" in split details not in split list` }, { status: 400 });
          }
          parsedSplits.push({ userId: u.id, amount: val });
          sum += val;
        }
        if (Math.abs(sum - convertedAmount) > 0.05) {
          return NextResponse.json({ error: `Splits sum (₹${sum}) does not match total amount (₹${convertedAmount})` }, { status: 400 });
        }
      } else if (splitTypeStr === 'percentage') {
        const detailParts = splitDetailsStr.split(';').map(p => p.trim()).filter(Boolean);
        let sumPct = 0;
        for (const part of detailParts) {
          const lastSpace = part.lastIndexOf(' ');
          if (lastSpace === -1) {
            return NextResponse.json({ error: `Invalid split detail: "${part}"` }, { status: 400 });
          }
          const name = part.substring(0, lastSpace).trim();
          const pct = parseFloat(part.substring(lastSpace + 1).replace('%', '').trim());
          const u = splitUsers.find(su => su.name.toLowerCase() === name.toLowerCase());
          if (!u) {
            return NextResponse.json({ error: `User "${name}" in split details not in split list` }, { status: 400 });
          }
          const val = (pct / 100) * convertedAmount;
          parsedSplits.push({ userId: u.id, amount: val });
          sumPct += pct;
        }
        if (Math.abs(sumPct - 100) > 0.01) {
          return NextResponse.json({ error: `Percentages sum (${sumPct}%) does not equal 100%` }, { status: 400 });
        }
      } else if (splitTypeStr === 'share') {
        const detailParts = splitDetailsStr.split(';').map(p => p.trim()).filter(Boolean);
        let totalShares = 0;
        const sharesMap: { userId: string; shares: number }[] = [];
        for (const part of detailParts) {
          const lastSpace = part.lastIndexOf(' ');
          if (lastSpace === -1) {
            return NextResponse.json({ error: `Invalid split detail: "${part}"` }, { status: 400 });
          }
          const name = part.substring(0, lastSpace).trim();
          const val = parseFloat(part.substring(lastSpace + 1).trim());
          const u = splitUsers.find(su => su.name.toLowerCase() === name.toLowerCase());
          if (!u) {
            return NextResponse.json({ error: `User "${name}" in split details not in split list` }, { status: 400 });
          }
          sharesMap.push({ userId: u.id, shares: val });
          totalShares += val;
        }
        sharesMap.forEach(sm => {
          parsedSplits.push({ userId: sm.userId, amount: (sm.shares / totalShares) * convertedAmount });
        });
      } else {
        return NextResponse.json({ error: `Unsupported split type: "${splitTypeStr}"` }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const exp = await tx.expense.create({
          data: {
            groupId,
            payerId: payerUser.id,
            description: finalRowData.description.trim(),
            amount,
            currency,
            exchangeRate,
            convertedAmount,
            date: parsedDate,
            splitType: splitTypeStr.toUpperCase() || 'EQUAL',
          },
        });

        for (const ps of parsedSplits) {
          await tx.expenseSplit.create({
            data: {
              expenseId: exp.id,
              userId: ps.userId,
              amount: Math.round(ps.amount * 100) / 100,
            },
          });
        }

        await tx.importAnomaly.update({
          where: { id: anomalyId },
          data: { status: 'APPROVED' },
        });
      });

      return NextResponse.json({ success: true, status: 'APPROVED', type: 'EXPENSE' }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Resolve anomaly route error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
