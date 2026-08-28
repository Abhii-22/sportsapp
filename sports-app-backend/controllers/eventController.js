const Event = require('../models/Event');
const Match = require('../models/Match');

// Fetch Public Tournaments with Organizer Info
const getEvents = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.sportCategory = category;
    }

    const events = await Event.find(filter)
      .populate('organizer', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const eventsWithMatches = await Promise.all(
      events.map(async (event) => {
        const matches = await Match.find({ eventId: event._id }).sort({ createdAt: -1 });
        return { ...event, matches };
      })
    );

    res.json({ success: true, count: eventsWithMatches.length, data: eventsWithMatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Tournaments for Current User
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const eventsWithMatches = await Promise.all(
      events.map(async (event) => {
        const matches = await Match.find({ eventId: event._id }).sort({ createdAt: -1 });
        return { ...event, matches };
      })
    );

    res.json({ success: true, count: eventsWithMatches.length, data: eventsWithMatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Event
const createEvent = async (req, res) => {
  try {
    const { name, sportCategory, sportType, date, location, poster } = req.body;

    if (!name || !date || !location || !poster) {
      return res.status(400).json({ success: false, message: 'Please fill in all tournament details' });
    }

    let event = await Event.create({
      name,
      sportCategory: sportCategory || 'Others',
      sportType: sportType || 'OTHER',
      date,
      location,
      poster,
      organizer: req.user.id,
      isVerifiedOrganizer: true,
    });

    event = await event.populate('organizer', 'fullName email phone');

    res.status(201).json({ success: true, data: { ...event.toObject(), matches: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEvents, getMyEvents, createEvent };