const prisma = require('../models/prismaClient');

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      where: { siteId: req.siteId },
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, parentId } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }

    const existingCat = await prisma.categories.findFirst({
      where: {
        siteId: req.siteId,
        OR: [{ slug }, { name }],
      },
    });

    if (existingCat) {
      return res.status(400).json({
        success: false,
        message: 'Category name or slug already exists on this site',
      });
    }

    const parsedParentId = parentId ? parseInt(parentId, 10) : null;

    const newCategory = await prisma.categories.create({
      data: {
        name,
        slug,
        description,
        parentId: Number.isFinite(parsedParentId) ? parsedParentId : null,
        siteId: req.siteId,
      },
    });

    return res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Category name or slug already exists on this site',
      });
    }
    res.status(500).json({ success: false, message: 'Server error creating category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId } = req.body;

    const existing = await prisma.categories.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const parsedParentId =
      parentId !== undefined
        ? parentId
          ? parseInt(parentId, 10)
          : null
        : undefined;

    const updatedCategory = await prisma.categories.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(parsedParentId !== undefined && { parentId: parsedParentId }),
      },
    });

    return res.status(200).json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error updating category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.categories.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await prisma.categories.delete({ where: { id: parseInt(id, 10) } });
    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
};
