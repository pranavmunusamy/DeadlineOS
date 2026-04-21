const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getSlots, addSlot, deleteSlot, bookSlot, cancelBooking, getMyBookings } = require('../controllers/officeHourController');

router.use(authenticate);

router.get('/', getSlots);
router.post('/', addSlot);
router.delete('/:id', deleteSlot);
router.post('/:id/book', bookSlot);
router.get('/my-bookings', getMyBookings);
router.delete('/booking/:id', cancelBooking);

module.exports = router;
