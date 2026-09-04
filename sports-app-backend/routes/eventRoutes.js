const express = require('express');
const router = express.Router();
const { 
  getEvents, 
  getMyEvents, 
  createEvent, 
  updateTournamentStatus 
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/my-events', protect, getMyEvents);
router.post('/', protect, createEvent);
router.put('/:eventId/status', updateTournamentStatus);

module.exports = router;