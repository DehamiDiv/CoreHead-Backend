const assert = require('node:assert/strict');
const path = require('path');
const test = require('node:test');

const {
  createUploadFileName,
  getUploadFilePath,
  getUploadsDir,
} = require('../src/config/mediaStorage');

const originalUploadsDir = process.env.UPLOADS_DIR;

test.afterEach(() => {
  if (originalUploadsDir === undefined) delete process.env.UPLOADS_DIR;
  else process.env.UPLOADS_DIR = originalUploadsDir;
});

test('media storage uses the configured persistent directory', () => {
  process.env.UPLOADS_DIR = path.join('test-data', 'uploads');

  assert.equal(getUploadsDir(), path.resolve('test-data', 'uploads'));
});

test('upload filenames cannot escape the configured storage directory', () => {
  process.env.UPLOADS_DIR = path.join('test-data', 'uploads');
  const fileName = createUploadFileName('../../unsafe image.png', 1234);
  const filePath = getUploadFilePath(`/uploads/${fileName}`);

  assert.equal(fileName, '1234-unsafe-image.png');
  assert.equal(path.dirname(filePath), getUploadsDir());
});
