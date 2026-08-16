const prisma = require('../src/models/prismaClient');
const { auditAndMigrateTemplates } = require('../src/services/layoutMigrationService');

function parseArguments(argv) {
  const apply = argv.includes('--apply');
  const siteFlag = argv.find((arg) => arg.startsWith('--site-id='));
  const siteId = siteFlag ? Number(siteFlag.split('=')[1]) : null;
  if (siteFlag && (!Number.isInteger(siteId) || siteId <= 0)) {
    throw new Error('--site-id must be a positive integer.');
  }
  return { apply, siteId };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options.apply) {
    console.log('Running LayoutDocument migration in dry-run mode. Add --apply to persist valid migrations.');
  }
  const report = await auditAndMigrateTemplates({ prisma, ...options });
  console.log(JSON.stringify(report, null, 2));
  if (report.invalid > 0) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
