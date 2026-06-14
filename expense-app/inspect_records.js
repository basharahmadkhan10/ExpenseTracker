const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resolvedAnomalies = await prisma.importAnomaly.findMany({
    where: {
      status: {
        in: ['APPROVED', 'REJECTED']
      }
    }
  });

  const expenses = await prisma.expense.findMany({
    include: {
      payer: true,
      splits: {
        include: {
          user: true
        }
      }
    }
  });

  const settlements = await prisma.settlement.findMany({
    include: {
      payer: true,
      receiver: true
    }
  });

  console.log(JSON.stringify({
    resolvedAnomalies: resolvedAnomalies.map(a => ({
      rowNumber: a.rowNumber,
      anomalyType: a.anomalyType,
      description: a.description,
      status: a.status,
      rawRowData: a.rawRowData
    })),
    expensesCount: expenses.length,
    expenses: expenses.map(e => ({
      description: e.description,
      payer: e.payer.name,
      amount: e.amount,
      currency: e.currency,
      convertedAmount: e.convertedAmount,
      date: e.date.toISOString().slice(0, 10),
      splits: e.splits.map(s => `${s.user.name}: ₹${s.amount}`)
    })),
    settlementsCount: settlements.length,
    settlements: settlements.map(s => ({
      payer: s.payer.name,
      receiver: s.receiver.name,
      amount: s.amount,
      date: s.date.toISOString().slice(0, 10)
    }))
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
