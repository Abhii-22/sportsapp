const Match = require('../models/Match');

// 1. Fetch All Matches
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().populate('eventId', 'name sportCategory poster').sort({ updatedAt: -1 });
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Live Update (Ball-by-ball scoring)
const updateMatchScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { 
      teamAName, 
      teamBName, 
      scoreA, 
      scoreB, 
      wicketsA, 
      wicketsB, 
      overs, 
      totalOvers, 
      status, 
      activeBattingTeam, 
      ballHistory, 
      inningsABalls, 
      inningsBBalls, 
      isLive 
    } = req.body;

    let match = await Match.findById(matchId);
    if (!match) {
      match = await Match.findOne({ eventId: matchId, isLive: true }).sort({ createdAt: -1 });
    }

    if (!match) {
      match = new Match({ eventId: matchId });
    }

    match.teamAName = teamAName !== undefined ? teamAName : match.teamAName;
    match.teamBName = teamBName !== undefined ? teamBName : match.teamBName;
    match.scoreA = scoreA !== undefined ? scoreA : match.scoreA;
    match.scoreB = scoreB !== undefined ? scoreB : match.scoreB;
    match.wicketsA = wicketsA !== undefined ? wicketsA : match.wicketsA;
    match.wicketsB = wicketsB !== undefined ? wicketsB : match.wicketsB;
    match.overs = overs !== undefined ? overs : match.overs;
    match.totalOvers = totalOvers !== undefined ? totalOvers : match.totalOvers;
    match.status = status !== undefined ? status : match.status;
    match.activeBattingTeam = activeBattingTeam !== undefined ? activeBattingTeam : match.activeBattingTeam;

    if (ballHistory !== undefined) match.ballHistory = ballHistory;
    if (inningsABalls !== undefined) match.inningsABalls = inningsABalls;
    if (inningsBBalls !== undefined) match.inningsBBalls = inningsBBalls;

    // ⚡ Automatic deactivation when finished
    if (
      isLive === false ||
      status === 'Match Completed' ||
      (status && status.includes('won by')) ||
      (status && status.includes('Tied')) ||
      (status && status.includes('Drawn'))
    ) {
      match.isLive = false;
    } else {
      match.isLive = true;
    }

    await match.save();

    if (req.io) {
      req.io.emit('score_updated', match);
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. PERMANENT SAVE: Creates finished match AND turns off active live status for previous matches in the same event
const createCompletedMatch = async (req, res) => {
  try {
    const { 
      eventId, 
      teamAName, 
      teamBName, 
      scoreA, 
      scoreB, 
      wicketsA, 
      wicketsB, 
      overs, 
      totalOvers, 
      status, 
      ballHistory, 
      inningsABalls, 
      inningsBBalls 
    } = req.body;

    // ⚡ Step 1: Ensure all existing live match rows for this event are marked as finished
    await Match.updateMany({ eventId, isLive: true }, { isLive: false });

    // ⚡ Step 2: Save the final finished match
    const newMatch = new Match({
      eventId,
      teamAName,
      teamBName,
      scoreA,
      scoreB,
      wicketsA,
      wicketsB,
      overs,
      totalOvers,
      status,
      isLive: false, // ⚡ Strictly false
      ballHistory: ballHistory || [],
      inningsABalls: inningsABalls || [],
      inningsBBalls: inningsBBalls || [],
    });

    await newMatch.save();

    if (req.io) {
      req.io.emit('score_updated', newMatch);
    }

    res.json({ success: true, data: newMatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMatches,
  updateMatchScore,
  createCompletedMatch,
};