const bindingService = require("../services/bindingService");

const saveBindings = async (req, res) => {
  try {
    const { mode, selected } = req.body;

    const data = await bindingService.saveBindings(mode, selected);

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

const getBindings = async (req, res) => {
  try {
    const data = await bindingService.getBindings();

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  saveBindings,
  getBindings,
};