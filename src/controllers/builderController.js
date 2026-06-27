const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Save a new layout
const saveLayout = async (req, res) => {
  try {
    const { name, layout_data, content_mode, grid_layout } = req.body;
    const userId = req.user.id; // From authMiddleware
    
    if (!name || !layout_data) {
      return res.status(400).json({ error: 'Name and layout_data are required' });
    }

    const layout = await prisma.builder_layouts.create({
      data: {
        name,
        layout_data,
        content_mode: content_mode || 'static',
        grid_layout: grid_layout || 'grid',
        user_id: userId
      }
    });

    res.status(201).json(layout);
  } catch (error) {
    console.error('Save layout error:', error);
    res.status(500).json({ error: 'Failed to save layout', message: error.message });
  }
};

// Get all layouts (filtered by user unless admin)
const getLayouts = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {
      orderBy: { updated_at: 'desc' }
    };

    // If not admin, only show user's own layouts
    if (userRole !== 'admin') {
      query.where = { user_id: userId };
    }

    const layouts = await prisma.builder_layouts.findMany(query);
    res.json({ layouts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layouts' });
  }
};

// Get layout by ID
const getLayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const layout = await prisma.builder_layouts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!layout) return res.status(404).json({ error: 'Layout not found' });

    // Check ownership
    if (userRole !== 'admin' && layout.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied. This layout does not belong to you.' });
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

    // First check if layout exists and belongs to user
    const existingLayout = await prisma.builder_layouts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLayout) return res.status(404).json({ error: 'Layout not found' });

    if (userRole !== 'admin' && existingLayout.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only update your own layouts.' });
    }

    const layout = await prisma.builder_layouts.update({
      where: { id: parseInt(id) },
      data: {
        name,
        layout_data,
        content_mode,
        grid_layout,
        updated_at: new Date()
      }
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

    const existingLayout = await prisma.builder_layouts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLayout) return res.status(404).json({ error: 'Layout not found' });

    if (userRole !== 'admin' && existingLayout.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own layouts.' });
    }

    await prisma.builder_layouts.delete({
      where: { id: parseInt(id) }
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
  deleteLayout
};
