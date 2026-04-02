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

module.exports = {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    saveTemplateHistory
};
