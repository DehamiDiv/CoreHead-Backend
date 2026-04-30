const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSettings = async (req, res) => {
  try {
    const { key } = req.query;
    if (key) {
      const setting = await prisma.setting.findUnique({ where: { key } });
      return res.status(200).json({ success: true, setting });
    }
    const settings = await prisma.setting.findMany();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and value are required' });
    }

    const updatedSetting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return res.status(200).json({ success: true, message: 'Setting updated successfully', setting: updatedSetting });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Server error updating setting' });
  }
};
