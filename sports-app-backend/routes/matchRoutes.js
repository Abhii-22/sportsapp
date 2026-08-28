const express = require('express');
const router = express.Router();
const { getMatches, updateMatchScore, createCompletedMatch } = require('../controllers/matchController');

// GET /api/matches
router.get('/', getMatches);

// POST /api/matches (Finalize match)
router.post('/', createCompletedMatch);

// PUT /api/matches/:matchId (Live scorecard update)
router.put('/:matchId', updateMatchScore);

module.exports = router;