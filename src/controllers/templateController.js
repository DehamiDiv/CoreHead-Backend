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

// ─── MY CONTRIBUTION: Publish / Assign / Resolve ─────────────────────────────

/**
 * PATCH /api/templates/:id/publish
 * Publish a template (protected route).
 */
const publishTemplate = async (req, res) => {
    try {
        const template = await templateService.publishTemplate(req.params.id);
        res.status(200).json({
            message: 'Template published successfully',
            template
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * POST /api/templates/:id/assign
 * Assign a template to a category or set it as the global default (protected route).
 * Body: { categoryId?: string, isGlobalDefault?: boolean }
 */
const assignTemplate = async (req, res) => {
    try {
        const template = await templateService.assignTemplate(
            req.params.id,
            req.body
        );
        res.status(200).json({
            message: 'Template assigned successfully',
            template
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * GET /api/templates/resolve?templateType=blog&categoryId=tech
 * Resolve the active layout for the given type + category (public route – no auth).
 */
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
    // My contribution
    publishTemplate,
    assignTemplate,
    resolveActiveLayout
};
