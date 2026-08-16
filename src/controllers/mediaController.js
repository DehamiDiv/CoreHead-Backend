const prisma = require('../models/prismaClient');
const fs = require('fs');
const {
  createUploadFileName,
  ensureUploadsDir,
  getUploadFilePath,
} = require('../config/mediaStorage');

exports.getMedia = async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: {
        isDeleted: false,
        siteId: req.siteId,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

exports.getTrash = async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: {
        isDeleted: true,
        siteId: req.siteId,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trash' });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const { name, type, size, base64Data } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    if (!req.siteId) {
      return res.status(400).json({ error: 'Site context required (X-Site-Id).' });
    }

    // Extract base64 data
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const fileName = createUploadFileName(name);
    const filePath = getUploadFilePath(fileName);

    ensureUploadsDir();
    fs.writeFileSync(filePath, buffer);

    // Always store relative path; frontend resolveMediaUrl → backend origin
    const url = `/uploads/${fileName}`;

    const media = await prisma.media.create({
      data: {
        name: name || fileName,
        type: type || 'application/octet-stream',
        size: size || String(buffer.length),
        url,
        isDeleted: false,
        siteId: req.siteId,
      },
    });

    // Return both shapes for older clients (uploaded.media.url / uploaded.url)
    res.status(201).json({
      ...media,
      url: media.url,
      media,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload media', details: error.message });
  }
};

exports.moveToTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.media.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });
    if (!existing) return res.status(404).json({ error: 'Media not found' });

    const media = await prisma.media.update({
      where: { id: parseInt(id, 10) },
      data: { isDeleted: true },
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move to trash' });
  }
};

exports.restoreFromTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.media.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });
    if (!existing) return res.status(404).json({ error: 'Media not found' });

    const media = await prisma.media.update({
      where: { id: parseInt(id, 10) },
      data: { isDeleted: false },
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore media' });
  }
};

exports.deletePermanently = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await prisma.media.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });

    if (media) {
      const filePath = getUploadFilePath(media.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.media.delete({ where: { id: parseInt(id, 10) } });
    }

    res.json({ message: 'Media deleted permanently' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media permanently' });
  }
};
