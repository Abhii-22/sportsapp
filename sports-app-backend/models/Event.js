const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sportCategory: { type: String, required: true },
    sportType: { type: String, enum: ['CRICKET', 'OTHER'], default: 'OTHER' },
    date: { type: String, required: true },
    location: { type: String, required: true },
    poster: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organizerName: { type: String, default: '' }, // Stores registered full name directly
    isVerifiedOrganizer: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);