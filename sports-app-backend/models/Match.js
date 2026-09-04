const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    teamAName: { type: String, required: true, default: 'TEAM A' },
    teamBName: { type: String, required: true, default: 'TEAM B' },
    stage: {
      type: String,
      enum: ['LEAGUE_1', 'LEAGUE_2', 'LEAGUE_STAGE', 'SEMI_FINAL', 'FINAL', 'GENERAL'],
      default: 'LEAGUE_1',
    },
    matchDate: { type: String, default: '' },
    matchTime: { type: String, default: '' },
    scoreA: { type: String, default: '0' },
    scoreB: { type: String, default: '0' },
    wicketsA: { type: String, default: '0' },
    wicketsB: { type: String, default: '0' },
    overs: { type: String, default: '0.0' },
    totalOvers: { type: String, default: '20' },
    status: { type: String, default: 'Match Scheduled' },
    isLive: { type: Boolean, default: false },
    activeBattingTeam: { type: String, enum: ['A', 'B'], default: 'A' },
    ballHistory: [{ type: String }],
    inningsABalls: [{ type: String }],
    inningsBBalls: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);