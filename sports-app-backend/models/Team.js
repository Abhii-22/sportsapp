// models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true },
    totalFee: { type: Number, default: 0 },
    paidFee: { type: Number, default: 0 },
    isScheduled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);