const Booking = require('../models/Booking');
const Room = require('../models/Room');

// GET /api/analytics/heatmap?room_id=&week=
// Returns a 7x20 grid (days × half-hour slots 8AM-6PM) with booking counts
const getHeatmap = async (req, res) => {
  try {
    const { room_id, week } = req.query;

    const weekStart = week ? new Date(week) : getMonday(new Date());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const query = {
      status: 'active',
      startTime: { $gte: weekStart },
      endTime: { $lte: weekEnd },
    };
    if (room_id) query.roomId = room_id;

    const bookings = await Booking.find(query).lean();

    // Build heatmap: 7 days × 20 half-hour slots (8:00 to 18:00)
    const SLOT_START = 8; // 8 AM
    const SLOT_COUNT = 20; // 8AM to 6PM in 30-min slots
    const heatmap = Array.from({ length: 7 }, () => Array(SLOT_COUNT).fill(0));

    bookings.forEach((b) => {
      const dayIndex = Math.floor((b.startTime - weekStart) / 86400000);
      if (dayIndex < 0 || dayIndex >= 7) return;

      const startHour = b.startTime.getUTCHours() + b.startTime.getUTCMinutes() / 60;
      const endHour = b.endTime.getUTCHours() + b.endTime.getUTCMinutes() / 60;

      for (let slot = 0; slot < SLOT_COUNT; slot++) {
        const slotHour = SLOT_START + slot * 0.5;
        if (slotHour >= startHour && slotHour < endHour) {
          heatmap[dayIndex][slot]++;
        }
      }
    });

    res.json({
      heatmap,
      weekStart: weekStart.toISOString(),
      slotStartHour: SLOT_START,
      slotCount: SLOT_COUNT,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to generate heatmap' });
  }
};

// GET /api/analytics/rooms — utilization stats for all rooms
const getRoomStats = async (req, res) => {
  try {
    const { building, days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const roomQuery = { isActive: true };
    if (building) roomQuery.building = building;
    const rooms = await Room.find(roomQuery).lean();

    const stats = await Promise.all(
      rooms.map(async (room) => {
        const bookings = await Booking.find({
          roomId: room._id,
          status: 'active',
          startTime: { $gte: since },
        }).lean();

        const totalSlots = parseInt(days) * 20; // 20 half-hour slots per day (8AM-6PM)
        let bookedSlots = 0;
        let totalDuration = 0;
        let cancellations = 0;

        bookings.forEach((b) => {
          const duration = (b.endTime - b.startTime) / 60000; // minutes
          totalDuration += duration;
          bookedSlots += duration / 30; // each slot = 30 min
        });

        const cancelledCount = await Booking.countDocuments({
          roomId: room._id,
          status: 'cancelled',
          startTime: { $gte: since },
        });

        // Peak hour calculation
        const hourCounts = {};
        bookings.forEach((b) => {
          const h = b.startTime.getUTCHours();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

        return {
          room,
          totalBookings: bookings.length,
          utilization: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
          avgDuration: bookings.length > 0 ? Math.round(totalDuration / bookings.length) : 0,
          peakHour: peakHour ? parseInt(peakHour[0]) : null,
          cancellationRate: (bookings.length + cancelledCount) > 0
            ? Math.round((cancelledCount / (bookings.length + cancelledCount)) * 100)
            : 0,
        };
      })
    );

    // Global aggregates
    const totalBookings = stats.reduce((s, r) => s + r.totalBookings, 0);
    const avgUtilization = stats.length > 0
      ? Math.round(stats.reduce((s, r) => s + r.utilization, 0) / stats.length)
      : 0;
    const mostPopular = [...stats].sort((a, b) => b.totalBookings - a.totalBookings)[0];
    const leastUsed = [...stats].sort((a, b) => a.totalBookings - b.totalBookings)[0];

    res.json({
      rooms: stats.sort((a, b) => b.utilization - a.utilization),
      global: {
        totalBookings,
        avgUtilization,
        mostPopularRoom: mostPopular?.room?.name || 'N/A',
        leastUsedRoom: leastUsed?.room?.name || 'N/A',
        avgCancellationRate: stats.length > 0
          ? Math.round(stats.reduce((s, r) => s + r.cancellationRate, 0) / stats.length)
          : 0,
      },
    });
  } catch (error) {
    console.error('Room stats error:', error);
    res.status(500).json({ error: 'Failed to fetch room stats' });
  }
};

// GET /api/analytics/best-times — suggest low-traffic booking times
const getBestTimes = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 14); // 2 weeks of data

    const bookings = await Booking.find({
      status: 'active',
      startTime: { $gte: since },
    }).lean();

    // Count bookings per day-of-week + hour
    const grid = {}; // "day-hour" -> count
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    bookings.forEach((b) => {
      const day = b.startTime.getUTCDay();
      const hour = b.startTime.getUTCHours();
      const key = `${day}-${hour}`;
      grid[key] = (grid[key] || 0) + 1;
    });

    // Find 5 least busy slots (weekdays 8AM-6PM only)
    const slots = [];
    for (let d = 1; d <= 5; d++) { // Mon-Fri
      for (let h = 8; h < 18; h++) {
        const key = `${d}-${h}`;
        slots.push({ day: DAYS[d], hour: h, count: grid[key] || 0 });
      }
    }
    slots.sort((a, b) => a.count - b.count);

    res.json({
      bestSlots: slots.slice(0, 5),
      busiestSlots: slots.slice(-3).reverse(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute best times' });
  }
};

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

module.exports = {
  getHeatmap,
  getRoomStats,
  getBestTimes,
};
