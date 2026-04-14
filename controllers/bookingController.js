const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendBookingConfirmation } = require('../services/emailService');
const { generateTicketPdfBuffer } = require('../services/ticketPdfService');

const generateTicketId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TKT-${timestamp}-${randomPart}`;
};

const createBooking = async (req, res, next) => {
  try {
    const { eventId, seatsBooked } = req.body;
    const seats = Number(seatsBooked);

    if (!eventId || !seatsBooked) {
      return res.status(400).json({ message: 'Event and seats are required' });
    }

    if (!Number.isInteger(seats) || seats < 1) {
      return res.status(400).json({ message: 'Seats must be at least 1' });
    }

    const event = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: seats } },
      { $inc: { availableSeats: -seats } },
      { new: true }
    );

    if (!event) {
      return res.status(400).json({ message: 'Not enough available seats for this event' });
    }

    let ticketId = '';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidateTicketId = generateTicketId();
      const existingBooking = await Booking.findOne({ ticketId: candidateTicketId }).select('_id');

      if (!existingBooking) {
        ticketId = candidateTicketId;
        break;
      }
    }

    if (!ticketId) {
      await Event.updateOne({ _id: eventId }, { $inc: { availableSeats: seats } });
      return res.status(500).json({ message: 'Unable to generate a unique ticket ID' });
    }

    let booking;

    try {
      booking = await Booking.create({
        userId: req.user._id,
        eventId,
        seatsBooked: seats,
        bookingDate: new Date(),
        ticketId
      });
    } catch (bookingError) {
      await Event.updateOne({ _id: eventId }, { $inc: { availableSeats: seats } });
      throw bookingError;
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email')
      .populate('eventId', 'title date location image totalSeats availableSeats');

    try {
      await sendBookingConfirmation({
        to: req.user.email,
        name: req.user.name,
        booking: populatedBooking,
        event: populatedBooking.eventId
      });
    } catch (emailError) {
      console.error(`Booking confirmation email failed: ${emailError.message}`);
    }

    res.status(201).json({ booking: populatedBooking });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('eventId')
      .sort({ bookingDate: -1 });

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('eventId', 'title date location image totalSeats availableSeats')
      .sort({ bookingDate: -1 });

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only cancel your own booking' });
    }

    const event = await Event.findById(booking.eventId);
    if (event) {
      event.availableSeats = Math.min(event.availableSeats + booking.seatsBooked, event.totalSeats);
      await event.save();
    }

    await booking.deleteOne();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

const downloadTicketPdf = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('eventId', 'title date location');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only download your own ticket' });
    }

    const pdfBuffer = await generateTicketPdfBuffer(booking);
    const fileName = `ticket-${booking.ticketId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  downloadTicketPdf
};
