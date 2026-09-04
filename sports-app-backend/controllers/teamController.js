// controllers/teamController.js
const Team = require('../models/Team');

// Get all registered teams for a specific tournament event
const getTeamsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const teams = await Team.find({ eventId }).sort({ createdAt: -1 });
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register a new walk-in team for an event
const registerTeam = async (req, res) => {
  try {
    const { eventId, name, totalFee, paidFee } = req.body;

    if (!eventId || !name) {
      return res.status(400).json({ success: false, message: 'Event ID and Team Name are required.' });
    }

    const team = await Team.create({
      eventId,
      name: name.trim(),
      totalFee: totalFee !== undefined ? parseFloat(totalFee) : 0,
      paidFee: paidFee !== undefined ? parseFloat(paidFee) : 0,
    });

    if (req.io) {
      req.io.emit('team_registered', team);
    }

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamsByEvent,
  registerTeam,
};