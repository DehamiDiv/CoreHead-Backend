const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'rashmishara399@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      ownedSites: {
        select: { id: true, name: true, slug: true, status: true }
      },
      siteMemberships: {
        include: {
          site: { select: { id: true, name: true, slug: true } }
        }
      }
    }
  });

  console.log('USER_DETAILS:', JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
