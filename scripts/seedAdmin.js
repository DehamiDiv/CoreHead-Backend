const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readAdminConfig(env = process.env) {
  const email = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(env.ADMIN_PASSWORD || '');
  const name = String(env.ADMIN_NAME || 'CoreHead Administrator').trim();

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  if (password.length > 128 || !PASSWORD_REGEX.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD must be 8-128 characters and include uppercase, lowercase, number, and special characters.',
    );
  }

  return { email, password, name: name || 'CoreHead Administrator' };
}

async function seedAdminUser({ prisma, config, bcryptLib = bcrypt }) {
  const existing = await prisma.user.findUnique({
    where: { email: config.email },
  });

  if (!existing) {
    const password = await bcryptLib.hash(config.password, 10);
    const user = await prisma.user.create({
      data: {
        email: config.email,
        password,
        name: config.name,
        role: 'admin',
        status: 'active',
        provider: 'local',
        isEmailVerified: true,
      },
    });
    return { action: 'created', user };
  }

  const passwordMatches = existing.password
    ? await bcryptLib.compare(config.password, existing.password)
    : false;
  const data = {
    name: config.name || existing.name,
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
  };

  if (!passwordMatches) {
    data.password = await bcryptLib.hash(config.password, 10);
  }

  const user = await prisma.user.update({
    where: { email: config.email },
    data,
  });
  return { action: 'updated', user };
}

async function main() {
  require('dotenv').config();
  const prisma = new PrismaClient();
  try {
    const config = readAdminConfig();
    const result = await seedAdminUser({ prisma, config });
    console.log(`Admin ${result.action}: ${result.user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  readAdminConfig,
  seedAdminUser,
};
