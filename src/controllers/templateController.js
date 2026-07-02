const templateService = require('../services/templateService');

const createTemplate = async (req, res) => {
    try {
        const newTemplate = await templateService.createTemplate(req.user.id, req.body);
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAllTemplates = async (req, res) => {
    try {
        const templates = await templateService.getTemplates(req.user.id, req.user.role);
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTemplateById = async (req, res) => {
    try {
        const template = await templateService.getTemplateById(req.params.id, req.user.id, req.user.role);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.status(200).json(template);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

const updateTemplate = async (req, res) => {
    try {
        const updatedTemplate = await templateService.updateTemplate(
            req.params.id,
            req.body,
            req.user.id,
            req.user.role
        );
        res.status(200).json(updatedTemplate);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        await templateService.deleteTemplate(req.params.id, req.user.id, req.user.role);
        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

const publishTemplate = async (req, res) => {
    try {
        const template = await templateService.publishTemplate(req.params.id, req.user.id, req.user.role);
        res.status(200).json({
            message: 'Template published successfully',
            template
        });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

const assignTemplate = async (req, res) => {
    try {
        const template = await templateService.assignTemplate(
            req.params.id,
            req.body,
            req.user.role
        );
        res.status(200).json({
            message: 'Template assigned successfully',
            template
        });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

const resolveActiveLayout = async (req, res) => {
    try {
        const { templateType, categoryId } = req.query;
        const layout = await templateService.resolveActiveLayout(templateType, categoryId);
        res.status(200).json(layout);
    } catch (error) {
        res.status(404).json({ error: error.message });
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
    resolveActiveLayout
};
