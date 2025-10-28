const express = require('express');
const router = express.Router();
const icalController = require('../controllers/icalController');

// Routes pour télécharger les fichiers .ics
router.get('/session/:sessionId/ics', icalController.generateSessionICS);
router.get('/assignment/:assignmentId/ics', icalController.generateAssignmentICS);
router.get('/student/:studentId/ics', icalController.generateStudentCalendarICS);

module.exports = router;
