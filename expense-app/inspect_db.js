const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const anomalies = await prisma.importAnomaly.findMany({
    include: {
      session: {
        select: {
          fileName: true,
          groupId: true
        }
      }
    }
  });
  
  console.log(JSON.stringify({
    anomalies: anomalies.map(a => ({
      id: a.id,
      rowNumber: a.rowNumber,
      anomalyType: a.anomalyType,
      description: a.description,
      status: a.status,
      rawRowData: a.rawRowData
    }))
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
