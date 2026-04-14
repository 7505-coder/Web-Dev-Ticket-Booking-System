const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
	createBooking,
	getMyBookings,
	getAllBookings,
	cancelBooking,
	downloadTicketPdf
} = require('../controllers/bookingController');
const { validateBookingPayload } = require('../middleware/validators');

const router = express.Router();

router.post('/', protect, validateBookingPayload, createBooking);
router.get('/me', protect, getMyBookings);
router.get('/all', protect, adminOnly, getAllBookings);
router.get('/:id/ticket', protect, downloadTicketPdf);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
