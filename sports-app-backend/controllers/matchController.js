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

// 2. Schedule a Tournament Match (League 1, League 2, Finals)
const scheduleMatch = async (req, res) => {
  try {
    const { eventId, teamAName, teamBName, stage, matchDate, matchTime, totalOvers } = req.body;

    if (!eventId || !teamAName || !teamBName) {
      return res.status(400).json({ success: false, message: 'Please provide event ID and both team names.' });
    }

    const stageLabel = stage ? stage.replace('_', ' ') : 'League Match';

    const match = await Match.create({
      eventId,
      teamAName: teamAName.trim(),
      teamBName: teamBName.trim(),
      stage: stage || 'LEAGUE_1',
      matchDate: matchDate || '',
      matchTime: matchTime || '',
      totalOvers: totalOvers || '20',
      status: `Scheduled • ${stageLabel}`,
      isLive: false,
    });

    if (req.io) {
      req.io.emit('score_updated', match);
    }

    res.status(201).json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Live Update (Ball-by-ball scoring)
const updateMatchScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { 
      teamAName, 
      teamBName, 
      stage,
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
    if (stage !== undefined) match.stage = stage;
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
      // 👈 Emits the match payload directly for instant client-side patching
      req.io.emit('score_updated', match);
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Finalize & Save Completed Match (Preserves the Stage)
const createCompletedMatch = async (req, res) => {
  try {
    const { 
      eventId, 
      teamAName, 
      teamBName, 
      stage,
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

    let match = await Match.findOne({
      eventId,
      $or: [
        { isLive: true },
        { teamAName, teamBName },
        { teamAName: teamBName, teamBName: teamAName }
      ]
    }).sort({ createdAt: -1 });

    if (!match) {
      match = new Match({ eventId });
    }

    match.teamAName = teamAName;
    match.teamBName = teamBName;
    if (stage) match.stage = stage;
    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.wicketsA = wicketsA || '0';
    match.wicketsB = wicketsB || '0';
    match.overs = overs || '0.0';
    match.totalOvers = totalOvers || '20';
    match.status = status || 'Match Completed';
    match.isLive = false;
    match.ballHistory = ballHistory || [];
    match.inningsABalls = inningsABalls || [];
    match.inningsBBalls = inningsBBalls || [];

    await match.save();

    await Match.deleteMany({
      eventId,
      _id: { $ne: match._id },
      teamAName: match.teamAName,
      teamBName: match.teamBName
    });

    if (req.io) {
      req.io.emit('score_updated', match);
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMatches,
  scheduleMatch,
  updateMatchScore,
  createCompletedMatch,
};