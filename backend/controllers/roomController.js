const Room = require('../models/Room');
const Booking = require('../models/Booking');

// GET /api/rooms — list all active rooms
const getRooms = async (req, res) => {
  try {
    const { building } = req.query;
    const query = { isActive: true };
    if (building) query.building = building;

    const rooms = await Room.find(query).sort({ building: 1, name: 1 }).lean();
    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// GET /api/rooms/:id/availability?week=2026-04-20
// Returns booked slots for a given room in a 7-day window
const getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { week } = req.query; // ISO date string for the Monday of the week

    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Calculate week range (Mon-Sun)
    const weekStart = week ? new Date(week) : getMonday(new Date());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const bookings = await Booking.find({
      roomId: id,
      status: 'active',
      startTime: { $gte: weekStart },
      endTime: { $lte: weekEnd },
    })
      .populate('userId', 'name picture')
      .sort({ startTime: 1 })
      .lean();

    // Mark which bookings belong to the requesting user
    const enriched = bookings.map((b) => ({
      ...b,
      isMine: b.userId._id.toString() === req.user._id.toString(),
    }));

    res.json({ room, bookings: enriched, weekStart: weekStart.toISOString() });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

// POST /api/rooms/book — create a booking with overlap prevention
const createBooking = async (req, res) => {
  try {
    const { roomId, startTime, endTime } = req.body;

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Prevent past bookings
    if (start < new Date()) {
      return res.status(400).json({ error: 'Cannot book in the past' });
    }

    // Check max active bookings per user (limit: 5)
    const activeCount = await Booking.countDocuments({
      userId: req.user._id,
      status: 'active',
      endTime: { $gt: new Date() },
    });
    if (activeCount >= 5) {
      return res.status(400).json({ error: 'Maximum 5 active bookings allowed' });
    }

    // *** CRITICAL: Overlap detection with atomic check ***
    // Find any active booking for this room that overlaps the requested time
    const overlap = await Booking.findOne({
      roomId,
      status: 'active',
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlap) {
      return res.status(409).json({ error: 'Time slot already booked' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      roomId,
      startTime: start,
      endTime: end,
    });

    const populated = await Booking.findById(booking._id)
      .populate('roomId', 'name building capacity')
      .populate('userId', 'name picture')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    // Mongoose validation errors (duration limits)
    if (error.message?.includes('duration') || error.message?.includes('End time')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// GET /api/rooms/my-bookings — user's bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      status: 'active',
      endTime: { $gt: new Date() },
    })
      .populate('roomId', 'name building capacity features')
      .sort({ startTime: 1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// DELETE /api/rooms/booking/:id — cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({
      _id: id,
      userId: req.user._id,
      status: 'active',
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Must cancel at least 15 minutes before start
    const cutoff = new Date(booking.startTime);
    cutoff.setMinutes(cutoff.getMinutes() - 15);
    if (new Date() > cutoff) {
      return res.status(400).json({ error: 'Cannot cancel within 15 minutes of start time' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Cascade: cancel any associated session
    const Session = require('../models/Session');
    const SessionParticipant = require('../models/SessionParticipant');
    await Session.updateMany({ bookingId: id }, { status: 'cancelled' });

    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// POST /api/rooms/seed — seed demo rooms (dev utility)
const seedRooms = async (req, res) => {
  try {
    const count = await Room.countDocuments();
    if (count > 0) return res.json({ message: `${count} rooms already exist` });

    const rooms = [
      { name: 'A101', capacity: 6, building: 'Library', floor: 1, features: ['whiteboard', 'power_outlets'] },
      { name: 'A102', capacity: 4, building: 'Library', floor: 1, features: ['quiet_zone', 'power_outlets'] },
      { name: 'A201', capacity: 8, building: 'Library', floor: 2, features: ['whiteboard', 'projector', 'power_outlets'] },
      { name: 'B101', capacity: 10, building: 'Science Center', floor: 1, features: ['projector', 'monitor', 'video_conf'] },
      { name: 'B102', capacity: 4, building: 'Science Center', floor: 1, features: ['whiteboard'] },
      { name: 'B201', capacity: 6, building: 'Science Center', floor: 2, features: ['monitor', 'power_outlets'] },
      { name: 'C101', capacity: 12, building: 'Student Union', floor: 1, features: ['projector', 'video_conf', 'whiteboard'] },
      { name: 'C102', capacity: 3, building: 'Student Union', floor: 1, features: ['quiet_zone'] },
      { name: 'D101', capacity: 8, building: 'Engineering Hall', floor: 1, features: ['monitor', 'whiteboard', 'power_outlets'] },
      { name: 'D201', capacity: 5, building: 'Engineering Hall', floor: 2, features: ['whiteboard', 'quiet_zone'] },
    ];

    await Room.insertMany(rooms);
    res.json({ message: `Seeded ${rooms.length} rooms` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed rooms' });
  }
};

// Helper
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

module.exports = {
  getRooms,
  getAvailability,
  createBooking,
  getMyBookings,
  cancelBooking,
  seedRooms,
};
