const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.post('/', pageController.createPage);
router.get('/', pageController.getPages);
router.put('/:id', pageController.updatePage);
router.delete('/:id', pageController.deletePage);

module.exports = router;
