const bindingRepository = require("../repositories/bindingRepository");

const saveBindings = async (mode, selected) => {
  return await bindingRepository.saveBinding(mode, selected);
};

const getBindings = async () => {
  return await bindingRepository.getBinding();
};

module.exports = {
  saveBindings,
  getBindings,
};