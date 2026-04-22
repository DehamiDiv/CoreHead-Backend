const prisma = require('../models/prismaClient');

const createTemplate = async (data) => {
    return await prisma.template.create({ data });
};

const getAllTemplates = async () => {
    return await prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { email: true } } } // Include author email for the dashboard
    });
};

const getTemplateById = async (id) => {
    return await prisma.template.findUnique({
        where: { id: parseInt(id) }
    });
};

const updateTemplate = async (id, data, newVersion) => {
    return await prisma.template.update({
        where: { id: parseInt(id) },
        data: {
            ...data,
            version: newVersion,
        }
    });
};

const saveTemplateHistory = async (templateId, version, layoutJson, updatedBy) => {
    return await prisma.templateHistory.create({
        data: {
            templateId: parseInt(templateId),
            version,
            layoutJson,
            updatedBy
        }
    });
};

const deleteTemplate = async (id) => {
    return await prisma.template.delete({
        where: { id: parseInt(id) }
    });
};

// ─── MY CONTRIBUTION: Publish / Assign / Resolve ─────────────────────────────

/**
 * Publish a template by setting its status to 'published'.
 */
const publishTemplate = async (id) => {
    return await prisma.template.update({
        where: { id: parseInt(id) },
        data: { status: 'published' }
    });
};

/**
 * Assign a template to a category or mark it as the global default.
 * When isGlobalDefault is true, any previously global-default template of the
 * same type is cleared first to enforce a single global default per type.
 */
const assignTemplate = async (id, categoryId, isGlobalDefault) => {
    const templateId = parseInt(id);

    if (isGlobalDefault) {
        // Fetch the type of the template being promoted so we only clear
        // global defaults that share the same type.
        const target = await prisma.template.findUnique({
            where: { id: templateId },
            select: { type: true }
        });

        // Clear any existing global_default for this type
        await prisma.template.updateMany({
            where: {
                type: target.type,
                category: 'global_default'
            },
            data: { category: null }
        });

        return await prisma.template.update({
            where: { id: templateId },
            data: { category: 'global_default' }
        });
    }

    // Category-specific assignment
    return await prisma.template.update({
        where: { id: templateId },
        data: { category: categoryId }
    });
};

/**
 * Resolve the active layout for a given type + category.
 * Priority 1 – published template matching type AND categoryId.
 * Priority 2 – published template of the same type marked as global_default.
 * Returns null if neither is found.
 */
const resolveActiveLayout = async (templateType, categoryId) => {
    // Priority 1: category-specific published template
    const specific = await prisma.template.findFirst({
        where: {
            type: templateType,
            category: categoryId,
            status: 'published'
        }
    });

    if (specific) return specific;

    // Priority 2: global default published template
    const globalDefault = await prisma.template.findFirst({
        where: {
            type: templateType,
            category: 'global_default',
            status: 'published'
        }
    });

    return globalDefault || null;
};

module.exports = {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    saveTemplateHistory,
    // My contribution
    publishTemplate,
    assignTemplate,
    resolveActiveLayout
};
