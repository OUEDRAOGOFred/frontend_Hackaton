const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const projectController = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const projectValidation = [
    check('title', 'Title is required').not().isEmpty(),
    check('description').optional(),
    check('deadline').optional().isISO8601().toDate(),
    check('status').optional().isIn(['pending', 'active', 'completed']),
    check('isArchived').optional().isBoolean()
];

// Routes
router.post('/', [
    protect, 
    authorize('admin', 'teacher'), 
    projectValidation
], projectController.createProject);

router.get('/', protect, projectController.getProjects);
router.get('/:id', protect, projectController.getProjectById);

router.put('/:id', [
    protect,
    projectValidation
], projectController.updateProject);

router.delete('/:id', protect, projectController.deleteProject);
router.put('/:id/archive', protect, projectController.archiveProject);

module.exports = router;