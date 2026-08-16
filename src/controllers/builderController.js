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

module.exports = {
  saveLayout,
  getLayouts,
  getLayoutById,
  updateLayout,
  deleteLayout,
};
