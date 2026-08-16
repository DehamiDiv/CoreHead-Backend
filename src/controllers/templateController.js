const templateService = require('../services/templateService');
const { getSiteIdFromRequest } = require('../utils/siteScope');

const createTemplate = async (req, res) => {
  try {
    const newTemplate = await templateService.createTemplate(
      req.user.id,
      req.body,
      req.siteId
    );
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

const getAllTemplates = async (req, res) => {
  try {
    const templates = await templateService.getTemplates(
      req.user.id,
      req.user.role,
      req.siteId
    );
    res.status(200).json(templates);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const template = await templateService.getTemplateById(
      req.params.id,
      req.user.id,
      req.user.role,
      req.siteId
    );
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(200).json(template);
  } catch (error) {
    res.status(error.statusCode || 403).json({ error: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const updatedTemplate = await templateService.updateTemplate(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
      req.siteId
    );
    res.status(200).json(updatedTemplate);
  } catch (error) {
    res.status(error.statusCode || 403).json({ error: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    await templateService.deleteTemplate(
      req.params.id,
      req.user.id,
      req.user.role,
      req.siteId
    );
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 403).json({ error: error.message });
  }
};

const publishTemplate = async (req, res) => {
  try {
    const template = await templateService.publishTemplate(
      req.params.id,
      req.user.id,
      req.user.role,
      req.siteId
    );
    res.status(200).json({
      message: 'Template published successfully',
      template,
    });
  } catch (error) {
    res.status(error.statusCode || 403).json({ error: error.message });
  }
};

const assignTemplate = async (req, res) => {
  try {
    const template = await templateService.assignTemplate(
      req.params.id,
      req.body,
      req.user.role,
      req.siteId
    );
    res.status(200).json({
      message: 'Template assigned successfully',
      template,
    });
  } catch (error) {
    res.status(error.statusCode || 403).json({ error: error.message });
  }
};

const resolveActiveLayout = async (req, res) => {
  try {
    const { templateType, categoryId, templateId } = req.query;
    const siteId = getSiteIdFromRequest(req);
    const layout = await templateService.resolveActiveLayout(
      templateType,
      categoryId,
      siteId,
      templateId
    );
    res.status(200).json(layout);
  } catch (error) {
    const status = error.message.startsWith('No active layout') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  publishTemplate,
  assignTemplate,
  resolveActiveLayout,
};
