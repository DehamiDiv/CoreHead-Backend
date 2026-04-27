const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    
    // Check if slug exists
    const existingCat = await prisma.categories.findUnique({ where: { slug } });
    if (existingCat) {
      return res.status(400).json({ success: false, message: 'Category slug already exists' });
    }

    const newCategory = await prisma.categories.create({
      data: {
        name,
        slug,
        description
      }
    });

    return res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error creating category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const updatedCategory = await prisma.categories.update({
      where: { id: parseInt(id) },
      data: { name, slug, description }
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
    await prisma.categories.delete({ where: { id: parseInt(id) } });
    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
};
