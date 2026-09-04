// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const { getTeamsByEvent, registerTeam } = require('../controllers/teamController');

router.get('/:eventId', getTeamsByEvent);
router.post('/', registerTeam);

module.exports = router;