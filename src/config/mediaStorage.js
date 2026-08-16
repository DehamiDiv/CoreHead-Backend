const fs = require('fs');
const path = require('path');

const DEFAULT_UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

const getUploadsDir = () => {
  const configured = String(process.env.UPLOADS_DIR || '').trim();
  return path.resolve(configured || DEFAULT_UPLOADS_DIR);
};

const ensureUploadsDir = () => {
  const uploadsDir = getUploadsDir();
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
};

const createUploadFileName = (name, timestamp = Date.now()) => {
  const original = path.basename(String(name || 'file'));
  const safeName = original
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';
  return `${timestamp}-${safeName}`;
};

const getUploadFilePath = (urlOrName) => {
  const fileName = path.basename(String(urlOrName || ''));
  return path.join(getUploadsDir(), fileName);
};

module.exports = {
  createUploadFileName,
  ensureUploadsDir,
  getUploadFilePath,
  getUploadsDir,
};
