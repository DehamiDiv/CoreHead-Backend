const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite } = require('../middlewares/siteMiddleware');

// Public endpoint for visitors submitting a Contact Form block
router.post('/submit', formController.submitForm);

// Admin endpoints for reviewing submissions
router.get('/submissions', authMiddleware, requireSite, formController.getSubmissions);
router.patch('/submissions/:id', authMiddleware, requireSite, formController.updateSubmissionStatus);
router.delete('/submissions/:id', authMiddleware, requireSite, formController.deleteSubmission);

module.exports = router;
