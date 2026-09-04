const express = require('express');
const router = express.Router();
const { 
  getMatches, 
  scheduleMatch, 
  updateMatchScore, 
  createCompletedMatch 
} = require('../controllers/matchController');

// GET /api/matches (Fetch all matches)
router.get('/', getMatches);

// POST /api/matches/schedule (Schedule League 1, League 2, Finals fixtures)
router.post('/schedule', scheduleMatch);

// POST /api/matches (Finalize match)
router.post('/', createCompletedMatch);

// PUT /api/matches/:matchId (Live scorecard update)
router.put('/:matchId', updateMatchScore);

module.exports = router;