const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware: protect } = require('../middleware/auth');

// Routes protégées - authentification requise
router.get('/', protect, courseController.getCourses);
router.get('/progress', protect, courseController.getCourseProgress);
router.get('/:id', protect, courseController.getCourseDetails);

module.exports = router;