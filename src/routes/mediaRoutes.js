const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.get('/', mediaController.getMedia);
router.get('/trash', mediaController.getTrash);
router.post('/upload', mediaController.uploadMedia);
router.patch('/:id/trash', mediaController.moveToTrash);
router.patch('/:id/restore', mediaController.restoreFromTrash);
router.delete('/:id', mediaController.deletePermanently);

module.exports = router;
