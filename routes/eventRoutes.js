const express = require('express');
const {
  listEvents,
  getEventSummary,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateEventPayload } = require('../middleware/validators');

const router = express.Router();

router.get('/', listEvents);
router.get('/summary', getEventSummary);
router.get('/:id', getEventById);
router.post('/', protect, adminOnly, upload.single('image'), validateEventPayload, createEvent);
router.put('/:id', protect, adminOnly, upload.single('image'), updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

module.exports = router;
