const express = require("express");
const router = express.Router();
const bindingController = require("../controllers/bindingController");

router.post("/bindings", bindingController.saveBindings);
router.get("/bindings", bindingController.getBindings);

module.exports = router;