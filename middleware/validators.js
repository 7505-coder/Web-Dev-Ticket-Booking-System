const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
};

const validateRegisterPayload = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (String(name).trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  return next();
};

const validateLoginPayload = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  return next();
};

const validateEventPayload = (req, res, next) => {
  const { title, description, date, location, totalSeats } = req.body;

  if (!title || !description || !date || !location || totalSeats === undefined) {
    return res.status(400).json({ message: 'All event fields are required' });
  }

  if (String(title).trim().length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters long' });
  }

  if (String(description).trim().length < 10) {
    return res.status(400).json({ message: 'Description must be at least 10 characters long' });
  }

  if (Number.isNaN(new Date(date).getTime())) {
    return res.status(400).json({ message: 'Please provide a valid event date' });
  }

  const seats = Number(totalSeats);
  if (!Number.isInteger(seats) || seats < 1) {
    return res.status(400).json({ message: 'Total seats must be a positive integer' });
  }

  return next();
};

const validateBookingPayload = (req, res, next) => {
  const { eventId, seatsBooked } = req.body;
  const seats = Number(seatsBooked);

  if (!eventId || seatsBooked === undefined) {
    return res.status(400).json({ message: 'Event and seats are required' });
  }

  if (!Number.isInteger(seats) || seats < 1) {
    return res.status(400).json({ message: 'Seats must be a positive integer' });
  }

  return next();
};

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateEventPayload,
  validateBookingPayload
};
