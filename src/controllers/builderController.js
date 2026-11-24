const prisma = require('../models/prismaClient');
const { isPlatformAdmin } = require('../utils/siteScope');

// Save a new layout
const saveLayout = async (req, res) => {
  try {
    const { name, layout_data, content_mode, grid_layout } = req.body;
    const userId = req.user.id;

    if (!name || !layout_data) {
      return res.status(400).json({ error: 'Name and layout_data are required' });
    }

    const layout = await prisma.builder_layouts.create({
      data: {
        name,
        layout_data,
        content_mode: content_mode || 'static',
        grid_layout: grid_layout || 'grid',
        user_id: userId,
        site_id: req.siteId,
      },
    });

    res.status(201).json(layout);
  } catch (error) {
    console.error('Save layout error:', error);
    res.status(500).json({ error: 'Failed to save layout', message: error.message });
  }
};

// Get all layouts for current site
const getLayouts = async (req, res) => {
  try {
    const layouts = await prisma.builder_layouts.findMany({
      where: { site_id: req.siteId },
      orderBy: { updated_at: 'desc' },
    });
    res.json({ layouts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layouts' });
  }
};

// Get layout by ID (same site)
const getLayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const layout = await prisma.builder_layouts.findFirst({
      where: {
        id: parseInt(id, 10),
        site_id: req.siteId,
      },
    });

    if (!layout) return res.status(404).json({ error: 'Layout not found' });

    if (!isPlatformAdmin(userRole) && layout.user_id !== userId) {
      // Site members can view site layouts
      if (!req.siteRole) {
        return res.status(403).json({ error: 'Access denied. This layout does not belong to you.' });
      }
    }

    res.json({ layout });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layout' });
  }
};

// Update layout
const updateLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, layout_data, content_mode, grid_layout } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingLayout = await prisma.builder_layouts.findFirst({
      where: {
        id: parseInt(id, 10),
        site_id: req.siteId,
      },
    });

    if (!existingLayout) return res.status(404).json({ error: 'Layout not found' });

    const siteRole = String(req.siteRole || '').toUpperCase();
    const canEdit =
      isPlatformAdmin(userRole) ||
      existingLayout.user_id === userId ||
      siteRole === 'OWNER' ||
      siteRole === 'EDITOR';

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied. You can only update your own layouts.' });
    }

    const layout = await prisma.builder_layouts.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        layout_data,
        content_mode,
        grid_layout,
        updated_at: new Date(),
      },
    });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update layout' });
  }
};

// Delete layout
const deleteLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingLayout = await prisma.builder_layouts.findFirst({
      where: {
        id: parseInt(id, 10),
        site_id: req.siteId,
      },
    });

    if (!existingLayout) return res.status(404).json({ error: 'Layout not found' });

    const siteRole = String(req.siteRole || '').toUpperCase();
    const canDelete =
      isPlatformAdmin(userRole) ||
      existingLayout.user_id === userId ||
      siteRole === 'OWNER';

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own layouts.' });
    }

    await prisma.builder_layouts.delete({
      where: { id: parseInt(id, 10) },
    });
    res.json({ message: 'Layout deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete layout' });
  }
};

// ── Reusable Saved Sections ──
const getSavedSections = async (req, res) => {
  try {
    const sections = await prisma.savedSection.findMany({
      where: { siteId: req.siteId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ sections });
  } catch (error) {
    console.error('Get saved sections error:', error);
    res.status(500).json({ error: 'Failed to load saved sections' });
  }
};

const createSavedSection = async (req, res) => {
  try {
    const { name, category, blocks } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Section name is required' });
    }
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return res.status(400).json({ error: 'Section blocks array is required' });
    }

    const section = await prisma.savedSection.create({
      data: {
        name: String(name).trim().slice(0, 255),
        category: category ? String(category).trim().slice(0, 80) : 'Custom',
        blocks,
        siteId: req.siteId,
        userId: req.user.id,
      },
    });
    res.status(201).json({ section });
  } catch (error) {
    console.error('Create saved section error:', error);
    res.status(500).json({ error: 'Failed to save section' });
  }
};

const deleteSavedSection = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.savedSection.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Saved section not found' });
    }

    const siteRole = String(req.siteRole || '').toUpperCase();
    const canDelete =
      isPlatformAdmin(req.user.role) ||
      existing.userId === req.user.id ||
      siteRole === 'OWNER' ||
      siteRole === 'EDITOR';
    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.savedSection.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete saved section error:', error);
    res.status(500).json({ error: 'Failed to delete saved section' });
  }
};

module.exports = {
  saveLayout,
  getLayouts,
  getLayoutById,
  updateLayout,
  deleteLayout,
  getSavedSections,
  createSavedSection,
  deleteSavedSection,
};
