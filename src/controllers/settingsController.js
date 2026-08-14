const prisma = require('../models/prismaClient');
const {
  applyAppearanceDraft,
  saveAppearanceDraft,
} = require('../services/appearanceDraftService');

exports.saveAppearanceDraft = async (req, res) => {
  try {
    const draft = await saveAppearanceDraft(prisma, req.siteId, req.body);
    res.status(200).json({ success: true, draft });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.applyAppearanceDraft = async (req, res) => {
  try {
    const draft = await applyAppearanceDraft(prisma, req.siteId, req.body);
    res.status(200).json({ success: true, draft });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const { key } = req.query;
    if (key) {
      const setting = await prisma.setting.findFirst({
        where: { key, siteId: req.siteId },
      });
      return res.status(200).json({ success: true, setting });
    }
    const settings = await prisma.setting.findMany({
      where: { siteId: req.siteId },
    });
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

    if (!req.siteId) {
      return res.status(400).json({
        success: false,
        message: 'Site context required (X-Site-Id).',
      });
    }

    const existing = await prisma.setting.findFirst({
      where: { key, siteId: req.siteId },
    });

    let updatedSetting;
    if (existing) {
      updatedSetting = await prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      updatedSetting = await prisma.setting.create({
        data: {
          key,
          value,
          siteId: req.siteId,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      setting: updatedSetting,
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Server error updating setting' });
  }
};
