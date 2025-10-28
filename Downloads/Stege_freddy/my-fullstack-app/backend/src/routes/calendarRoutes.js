const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.get('/integrations/google/auth', calendarController.startAuth);
router.get('/integrations/google/callback', calendarController.handleCallback);
router.post('/integrations/google/event', calendarController.createEvent);

module.exports = router;
