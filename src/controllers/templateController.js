const templateService = require('../services/templateService');

const createTemplate = async (req, res) => {
    try {
        // req.user is populated by authMiddleware
        const newTemplate = await templateService.createTemplate(req.user.id, req.body);
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAllTemplates = async (req, res) => {
    try {
        const templates = await templateService.getTemplates();
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTemplateById = async (req, res) => {
    try {
        const template = await templateService.getTemplateById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateTemplate = async (req, res) => {
    try {
        const updatedTemplate = await templateService.updateTemplate(
            req.params.id, 
            req.body, 
            req.user.id // Pass user ID for version history
        );
        res.status(200).json(updatedTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        await templateService.deleteTemplate(req.params.id);
        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};
