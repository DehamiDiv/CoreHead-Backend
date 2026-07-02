const templateRepo = require('../repositories/templateRepository');
const { validateLayoutJson } = require('../utils/layoutValidator');

const createTemplate = async (authorId, templateData) => {
    const { name, type, layoutJson, category, status } = templateData;

    // 1. Basic validation (Ensure required fields)
    if (!name || !type || !layoutJson) {
        throw new Error("Missing required template fields (name, type, layoutJson)");
    }

    // 2. Validate Layout specific structures (e.g., Blog Loop safety)
    validateLayoutJson(layoutJson);

    // 3. Pass data to Repository
    return await templateRepo.createTemplate({
        name,
        type,
        layoutJson,
        category,
        status: status || 'draft', // Default to draft if not provided
        authorId
    });
};

const getTemplates = async (userId, userRole) => {
    // If Admin, show all. If regular User, only show their own.
    if (userRole?.toLowerCase() === 'admin') {
        return await templateRepo.getAllTemplates();
    } else {
        // We need a way to filter in repo, or filter here. 
        // For simplicity, let's filter here but ideally it should be in the repository.
        const allTemplates = await templateRepo.getAllTemplates();
        return allTemplates.filter(t => t.authorId === userId);
    }
};

const getTemplateById = async (id, userId, userRole) => {
    const template = await templateRepo.getTemplateById(id);
    if (!template) return null;

    // Check ownership if not admin
    if (userRole?.toLowerCase() !== 'admin' && template.authorId !== userId) {
        throw new Error("Access denied. This template does not belong to you.");
    }

    return template;
};

const updateTemplate = async (id, templateData, userId, userRole) => {
    // 1. Fetch current template before updating
    const currentTemplate = await templateRepo.getTemplateById(id);
    if (!currentTemplate) {
        throw new Error("Template not found");
    }

    // Check ownership if not admin
    if (userRole?.toLowerCase() !== 'admin' && currentTemplate.authorId !== userId) {
        throw new Error("Access denied. You can only update your own templates.");
    }

    // 0. Validate incoming Layout changes
    if (templateData.layoutJson) {
        validateLayoutJson(templateData.layoutJson);
    }

    // 2. Save current state to history
    await templateRepo.saveTemplateHistory(
        currentTemplate.id,
        currentTemplate.version,
        currentTemplate.layoutJson,
        userId
    );

    // 3. Increment version and save new updates
    const nextVersion = currentTemplate.version + 1;
    return await templateRepo.updateTemplate(id, templateData, nextVersion);
};

const deleteTemplate = async (id, userId, userRole) => {
    const currentTemplate = await templateRepo.getTemplateById(id);
    if (!currentTemplate) {
        throw new Error("Template not found");
    }

    // Check ownership if not admin
    if (userRole?.toLowerCase() !== 'admin' && currentTemplate.authorId !== userId) {
        throw new Error("Access denied. You can only delete your own templates.");
    }

    return await templateRepo.deleteTemplate(id);
};

// ─── MY CONTRIBUTION: Publish / Assign / Resolve ─────────────────────────────

/**
 * Publish a template.
 */
const publishTemplate = async (id, userId, userRole) => {
    const template = await templateRepo.getTemplateById(id);
    if (!template) {
        throw new Error('Template not found');
    }

    // Check ownership if not admin
    if (userRole?.toLowerCase() !== 'admin' && template.authorId !== userId) {
        throw new Error("Access denied. You can only publish your own templates.");
    }

    if (!template.layoutJson) {
        throw new Error('Cannot publish a template without a layoutJson');
    }
    return await templateRepo.publishTemplate(id);
};

/**
 * Assign a template to a category.
 * Only Admins should be able to assign global/category templates for the whole site.
 */
const assignTemplate = async (id, assignData, userRole) => {
    if (userRole?.toLowerCase() !== 'admin') {
        throw new Error("Access denied. Only admins can assign templates to categories or site-wide defaults.");
    }

    const { categoryId, isGlobalDefault } = assignData;

    const template = await templateRepo.getTemplateById(id);
    if (!template) {
        throw new Error('Template not found');
    }
    if (template.status !== 'published') {
        throw new Error('Only published templates can be assigned');
    }

    return await templateRepo.assignTemplate(id, categoryId, isGlobalDefault);
};

/**
 * Resolve the active layout (Public)
 */
const resolveActiveLayout = async (templateType, categoryId) => {
    if (!templateType) {
        throw new Error('templateType query parameter is required');
    }

    const layout = await templateRepo.resolveActiveLayout(templateType, categoryId);

    if (!layout) {
        throw new Error(
            `No active layout found for type "${templateType}"` +
            (categoryId ? ` and category "${categoryId}"` : '')
        );
    }

    return layout;
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    publishTemplate,
    assignTemplate,
    resolveActiveLayout
};
