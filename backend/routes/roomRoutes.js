const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getRooms,
  getAvailability,
  createBooking,
  getMyBookings,
  cancelBooking,
  seedRooms,
} = require('../controllers/roomController');

router.use(authenticate);

router.get('/', getRooms);
router.get('/my-bookings', getMyBookings);
router.get('/:id/availability', getAvailability);
router.post('/book', createBooking);
router.delete('/booking/:id', cancelBooking);
router.post('/seed', seedRooms);

module.exports = router;
