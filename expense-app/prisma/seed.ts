import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.expenseSplit.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.importAnomaly.deleteMany({});
  await prisma.importSession.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Users
  const aisha = await prisma.user.create({ data: { name: 'Aisha', passwordHash } });
  const rohan = await prisma.user.create({ data: { name: 'Rohan', passwordHash } });
  const priya = await prisma.user.create({ data: { name: 'Priya', passwordHash } });
  const meera = await prisma.user.create({ data: { name: 'Meera', passwordHash } });
  const sam = await prisma.user.create({ data: { name: 'Sam', passwordHash } });
  const dev = await prisma.user.create({ data: { name: 'Dev', passwordHash } });

  console.log('Users created.');

  // Create Group
  const group = await prisma.group.create({
    data: { name: 'Flatmates' },
  });

  console.log('Group created.');

  // Create Group Memberships (Time-travel boundaries)
  // Aisha, Rohan, Priya: joined Feb 1, 2026, still active (leftAt is null)
  // Meera: joined Feb 1, 2026, left March 31, 2026
  // Sam: joined April 15, 2026, still active (leftAt is null)
  // Dev: joined Feb 1, 2026, left March 31, 2026 (present for Marina Bites and Goa Trip)
  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: aisha.id, joinedAt: new Date('2026-02-01') },
      { groupId: group.id, userId: rohan.id, joinedAt: new Date('2026-02-01') },
      { groupId: group.id, userId: priya.id, joinedAt: new Date('2026-02-01') },
      { groupId: group.id, userId: meera.id, joinedAt: new Date('2026-02-01'), leftAt: new Date('2026-03-31') },
      { groupId: group.id, userId: sam.id, joinedAt: new Date('2026-04-15') },
      { groupId: group.id, userId: dev.id, joinedAt: new Date('2026-02-01'), leftAt: new Date('2026-03-31') },
    ],
  });

  console.log('Group memberships created.');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
