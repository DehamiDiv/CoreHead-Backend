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

const getTemplates = async () => {
    return await templateRepo.getAllTemplates();
};

const getTemplateById = async (id) => {
    return await templateRepo.getTemplateById(id);
};

const updateTemplate = async (id, templateData, userId) => {
    // 0. Validate incoming Layout changes
    if (templateData.layoutJson) {
        validateLayoutJson(templateData.layoutJson);
    }

    // 1. Fetch current template before updating
    const currentTemplate = await templateRepo.getTemplateById(id);
    if (!currentTemplate) {
        throw new Error("Template not found for versioning");
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
