const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Save a new layout
const saveLayout = async (req, res) => {
  try {
    const { name, layout_data, content_mode, grid_layout } = req.body;
    
    if (!name || !layout_data) {
      return res.status(400).json({ error: 'Name and layout_data are required' });
    }

    const layout = await prisma.builder_layouts.create({
      data: {
        name,
        layout_data,
        content_mode: content_mode || 'static',
        grid_layout: grid_layout || 'grid',
        user_id: 1 // Hardcoded for now until auth is fully integrated
      }
    });

    res.status(201).json(layout);
  } catch (error) {
    console.error('Save layout error:', error);
    res.status(500).json({ error: 'Failed to save layout', message: error.message });
  }
};

// Get all layouts
const getLayouts = async (req, res) => {
  try {
    const layouts = await prisma.builder_layouts.findMany({
      orderBy: { updated_at: 'desc' }
    });
    res.json({ layouts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layouts' });
  }
};

// Get layout by ID
const getLayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const layout = await prisma.builder_layouts.findUnique({
      where: { id: parseInt(id) }
    });
    if (!layout) return res.status(404).json({ error: 'Layout not found' });
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
