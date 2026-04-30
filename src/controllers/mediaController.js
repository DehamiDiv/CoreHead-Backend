const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

exports.getMedia = async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

exports.getTrash = async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: { isDeleted: true },
      orderBy: { updatedAt: 'desc' }
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

    // Extract base64 data
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const fileName = `${Date.now()}-${name.replace(/\s+/g, '-')}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${fileName}`;

    const media = await prisma.media.create({
      data: {
        name,
        type,
        size,
        url,
        isDeleted: false
      }
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload media', details: error.message });
  }
};

exports.moveToTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await prisma.media.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true }
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move to trash' });
  }
};

exports.restoreFromTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await prisma.media.update({
      where: { id: parseInt(id) },
      data: { isDeleted: false }
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore media' });
  }
};

exports.deletePermanently = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await prisma.media.findUnique({
      where: { id: parseInt(id) }
    });

    if (media) {
      const fileName = media.url.split('/').pop();
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.media.delete({
        where: { id: parseInt(id) }
      });
    }

    res.json({ message: 'Media deleted permanently' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media permanently' });
  }
};
