const express = require('express');
const router = express.Router();
const { getEvents, getMyEvents, createEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/my-events', protect, getMyEvents);
router.post('/', protect, createEvent);

module.exports = router;