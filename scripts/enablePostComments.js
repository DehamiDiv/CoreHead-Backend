/** Enable allowComments on all posts */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const r = await p.post.updateMany({
    data: { allowComments: true },
  });
  console.log(`Enabled comments on ${r.count} post(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
