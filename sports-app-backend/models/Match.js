const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    teamAName: { type: String, required: true, default: 'TEAM A' },
    teamBName: { type: String, required: true, default: 'TEAM B' },
    scoreA: { type: String, default: '0' },
    scoreB: { type: String, default: '0' },
    wicketsA: { type: String, default: '0' },
    wicketsB: { type: String, default: '0' },
    overs: { type: String, default: '0.0' },
    totalOvers: { type: String, default: '20' },
    status: { type: String, default: 'Match Scheduled' },
    isLive: { type: Boolean, default: true },
    activeBattingTeam: { type: String, enum: ['A', 'B'], default: 'A' },
    ballHistory: [{ type: String }],
    inningsABalls: [{ type: String }], // ⚡ Track Team A balls
    inningsBBalls: [{ type: String }], // ⚡ Track Team B balls
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);