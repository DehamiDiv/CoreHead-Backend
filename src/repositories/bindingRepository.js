const prisma = require("../models/prismaClient");

const saveBinding = async (mode, selected) => {
  return await prisma.binding.upsert({
    where: { id: "single-binding" }, // only one config
    update: {
      mode,
      selected
    },
    create: {
      id: "single-binding",
      mode,
      selected
    }
  });
};

const getBinding = async () => {
  return await prisma.binding.findFirst();
};

module.exports = {
  saveBinding,
  getBinding,
};