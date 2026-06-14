const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.group.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  console.log("=== GROUPS IN DB ===");
  groups.forEach(g => {
    console.log(`Group: "${g.name}" (ID: ${g.id})`);
    console.log(`Members:`, g.members.map(m => `${m.user.name} (Joined: ${m.joinedAt.toISOString().slice(0, 10)}, Left: ${m.leftAt ? m.leftAt.toISOString().slice(0, 10) : 'Active'})`));
    console.log('---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
