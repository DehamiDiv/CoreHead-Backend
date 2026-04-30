const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/', commentController.getComments);
router.post('/', commentController.createComment);
router.put('/:id', commentController.updateCommentStatus);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
