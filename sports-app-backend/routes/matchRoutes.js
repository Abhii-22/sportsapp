const express = require('express');
const router = express.Router();
const { getMatches, updateMatchScore, createCompletedMatch } = require('../controllers/matchController');

// GET /api/matches
router.get('/', getMatches);

// POST /api/matches (Save new completed match)
router.post('/', createCompletedMatch);

// PUT /api/matches/:matchId (Live update)
router.put('/:matchId', updateMatchScore);

module.exports = router;