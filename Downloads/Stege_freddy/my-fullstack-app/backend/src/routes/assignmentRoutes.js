const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authMiddleware: protect } = require('../middleware/auth');

// Routes protégées - authentification requise
router.get('/', protect, assignmentController.getAssignments);
router.get('/:id', protect, assignmentController.getAssignmentDetails);
router.post('/:id/submit', protect, assignmentController.submitAssignment);

module.exports = router;