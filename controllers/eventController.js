const Event = require('../models/Event');
const Booking = require('../models/Booking');

const buildEventQuery = (search) => {
  if (!search) {
    return {};
  }

  return {
    title: { $regex: search, $options: 'i' }
  };
};

const decorateEvent = (event) => {
  const totalSeats = event.totalSeats || 0;
  const availableSeats = event.availableSeats || 0;
  const bookedSeats = Math.max(totalSeats - availableSeats, 0);
  const occupancyPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return {
    ...event,
    bookedSeats,
    occupancyPercent
  };
};

const listEvents = async (req, res, next) => {
  try {
    const events = await Event.find(buildEventQuery(req.query.search)).sort({ date: 1 });
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

const getEventSummary = async (req, res, next) => {
  try {
    const events = await Event.find({}).sort({ date: 1 }).lean();
    const now = new Date();
    const decoratedEvents = events.map(decorateEvent);
    const totalEvents = decoratedEvents.length;
    const totalSeats = decoratedEvents.reduce((sum, event) => sum + (event.totalSeats || 0), 0);
    const availableSeats = decoratedEvents.reduce((sum, event) => sum + (event.availableSeats || 0), 0);
    const bookedSeats = decoratedEvents.reduce((sum, event) => sum + (event.bookedSeats || 0), 0);
    const upcomingEvents = decoratedEvents.filter((event) => new Date(event.date) >= now).length;
    const nextEvent = decoratedEvents.find((event) => new Date(event.date) >= now) || decoratedEvents[0] || null;
    const featuredEvents = decoratedEvents.filter((event) => new Date(event.date) >= now).slice(0, 4);

    res.json({
      summary: {
        totalEvents,
        totalSeats,
        availableSeats,
        bookedSeats,
        upcomingEvents,
        occupancyRate: totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0,
        nextEvent,
        featuredEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, totalSeats } = req.body;

    if (!title || !description || !date || !location || !totalSeats) {
      return res.status(400).json({ message: 'All event fields are required' });
    }

    const seatsValue = Number(totalSeats);
    if (Number.isNaN(seatsValue) || seatsValue < 1) {
      return res.status(400).json({ message: 'Total seats must be a positive number' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      totalSeats: seatsValue,
      availableSeats: seatsValue,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { title, description, date, location, totalSeats } = req.body;
    const updatedTotalSeats = totalSeats ? Number(totalSeats) : event.totalSeats;

    if (totalSeats && (Number.isNaN(updatedTotalSeats) || updatedTotalSeats < 1)) {
      return res.status(400).json({ message: 'Total seats must be a positive number' });
    }

    const bookedSeats = event.totalSeats - event.availableSeats;
    const recalculatedAvailableSeats = Math.max(updatedTotalSeats - bookedSeats, 0);

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.totalSeats = updatedTotalSeats;
    event.availableSeats = recalculatedAvailableSeats;

    if (req.file) {
      event.image = `/uploads/${req.file.filename}`;
    }

    const savedEvent = await event.save();
    res.json({ event: savedEvent });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Booking.deleteMany({ eventId: event._id });
    await event.deleteOne();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEvents,
  getEventSummary,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
