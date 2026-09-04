const Event = require('../models/Event');
const Match = require('../models/Match');
const User = require('../models/User');

// Fetch Public Tournaments with Organizer Info & Matches in a single optimized pass
const getEvents = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.sportCategory = category;
    }

    // 1. Fetch events and populate organizer efficiently
    const events = await Event.find(filter)
      .populate('organizer', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch all related matches for these events in ONE single query instead of N individual queries
    const eventIds = events.map(e => e._id);
    const allMatches = await Match.find({ eventId: { $in: eventIds } }).sort({ createdAt: -1 }).lean();

    // 3. Group matches by eventId in-memory for instant mapping
    const matchMap = {};
    allMatches.forEach(match => {
      const eIdStr = match.eventId.toString();
      if (!matchMap[eIdStr]) matchMap[eIdStr] = [];
      matchMap[eIdStr].push(match);
    });

    const eventsWithMatches = events.map((event) => {
      const matches = matchMap[event._id.toString()] || [];
      const hostName = event.organizerName || (event.organizer && event.organizer.fullName) || 'Abhishek';
      return { ...event, organizerName: hostName, matches };
    });

    res.json({ success: true, count: eventsWithMatches.length, data: eventsWithMatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Tournaments for Current User (Optimized similarly)
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.mainFind ? await Event.find({ organizer: req.user.id }) : await Event.find({ organizer: req.user.id })
      .populate('organizer', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const eventIds = events.map(e => e._id);
    const allMatches = await Match.find({ eventId: { $in: eventIds } }).sort({ createdAt: -1 }).lean();

    const matchMap = {};
    allMatches.forEach(match => {
      const eIdStr = match.eventId.toString();
      if (!matchMap[eIdStr]) matchMap[eIdStr] = [];
      matchMap[eIdStr].push(match);
    });

    const eventsWithMatches = events.map((event) => {
      const matches = matchMap[event._id.toString()] || [];
      const hostName = event.organizerName || (event.organizer && event.organizer.fullName) || 'Abhishek';
      return { ...event, organizerName: hostName, matches };
    });

    res.json({ success: true, count: eventsWithMatches.length, data: eventsWithMatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Event
const createEvent = async (req, res) => {
  try {
    const { name, sportCategory, sportType, date, location, poster, organizerName } = req.body;

    if (!name || !date || !location || !poster) {
      return res.status(400).json({ success: false, message: 'Please fill in all tournament details' });
    }

    let realFullName = organizerName;
    if (!realFullName) {
      const dbUser = await User.findById(req.user.id).select('fullName');
      realFullName = dbUser ? dbUser.fullName : 'Abhishek';
    }

    let event = await Event.create({
      name,
      sportCategory: sportCategory || 'Others',
      sportType: sportType || 'OTHER',
      date,
      location,
      poster,
      organizer: req.user.id,
      organizerName: realFullName,
      isVerifiedOrganizer: true,
      isLive: false,
      isCompleted: false,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'fullName email phone')
      .lean();

    res.status(201).json({ 
      success: true, 
      data: { ...populatedEvent, organizerName: realFullName, matches: [] } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Tournament Status (Live / Completed)
const updateTournamentStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { isLive, isCompleted } = req.body;

    if (!eventId || eventId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID provided.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (isLive !== undefined) event.isLive = isLive;
    if (isCompleted !== undefined) {
      event.isCompleted = isCompleted;
      if (isCompleted) event.isLive = false;
    }

    await event.save();

    if (req.io) {
      req.io.emit('score_updated', event);
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEvents, getMyEvents, createEvent, updateTournamentStatus };