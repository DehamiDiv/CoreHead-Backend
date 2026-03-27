const templateRepo = require('../repositories/templateRepository');

const createTemplate = async (authorId, templateData) => {
    const { name, type, layoutJson, category, status } = templateData;

    // 1. Basic validation (Ensure required fields)
    if (!name || !type || !layoutJson) {
        throw new Error("Missing required template fields (name, type, layoutJson)");
    }

    // 2. Pass data to Repository
    return await templateRepo.createTemplate({
        name,
        type,
        layoutJson,
        category,
        status: status || 'draft', // Default to draft if not provided
        authorId
    });
};

const getTemplates = async () => {
    return await templateRepo.getAllTemplates();
};

const getTemplateById = async (id) => {
    return await templateRepo.getTemplateById(id);
};

const updateTemplate = async (id, templateData) => {
    return await templateRepo.updateTemplate(id, templateData);
};

const deleteTemplate = async (id) => {
    return await templateRepo.deleteTemplate(id);
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};
