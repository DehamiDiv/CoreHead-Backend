const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("Restoring Media from uploads folder...");
  const UPLOADS_DIR = path.join(__dirname, '../public/uploads'); // Fixed path!
  let mediaRestored = 0;

  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      if (file === 'dummy.txt') continue;
      
      const url = `/uploads/${file}`;
      
      const existing = await prisma.$queryRaw`SELECT * FROM media WHERE url = ${url}`;
      if (existing.length === 0) {
        let type = 'image/jpeg';
        if (file.endsWith('.png')) type = 'image/png';
        else if (file.endsWith('.gif')) type = 'image/gif';
        else if (file.endsWith('.webp')) type = 'image/webp';
        else if (file.endsWith('.avif')) type = 'image/avif';
        
        await prisma.$executeRaw`INSERT INTO media (name, type, size, url, "isDeleted", "createdAt", "updatedAt") VALUES (${file}, ${type}, 'Unknown', ${url}, false, NOW(), NOW())`;
        mediaRestored++;
      }
    }
  } else {
    console.log("Directory not found:", UPLOADS_DIR);
  }
  console.log(`Restored ${mediaRestored} media files.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
