const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createPage = async (req, res) => {
  try {
    const { name, slug, htmlContent, status } = req.body;
    
    // Check if slug exists
    const existingPage = await prisma.page.findUnique({ where: { slug } });
    if (existingPage) {
      return res.status(400).json({ success: false, message: 'Slug already in use' });
    }

    const newPage = await prisma.page.create({
      data: {
        name,
        slug,
        htmlContent,
        status: status || 'Draft'
      }
    });

    return res.status(201).json({ success: true, page: newPage });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ success: false, message: 'Server error creating page' });
  }
};

exports.getPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, pages });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pages' });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.page.delete({ where: { id: parseInt(id) } });
    return res.status(200).json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting page' });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, htmlContent, status } = req.body;
    
    const updatedPage = await prisma.page.update({
      where: { id: parseInt(id) },
      data: { name, slug, htmlContent, status }
    });

    return res.status(200).json({ success: true, page: updatedPage });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ success: false, message: 'Server error updating page' });
  }
};
