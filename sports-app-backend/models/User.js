const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ORGANIZER', 'PLAYER', 'SPECTATOR'], default: 'SPECTATOR' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);