const OfficeHourSlot = require('../models/OfficeHourSlot');
const OfficeHourBooking = require('../models/OfficeHourBooking');
const { google } = require('googleapis');
const { createAuthenticatedClient } = require('../config/google');

// GET /api/office-hours — user's office hour slots
const getSlots = async (req, res) => {
  try {
    const slots = await OfficeHourSlot.find({ userId: req.user._id })
      .populate('courseId', 'name code color')
      .sort({ day: 1, startTime: 1 })
      .lean();

    // Attach booking counts for upcoming dates
    const enriched = await Promise.all(
      slots.map(async (slot) => {
        const bookingCount = await OfficeHourBooking.countDocuments({
          slotId: slot._id,
          status: 'confirmed',
          bookingDate: { $gte: new Date() },
        });
        return {
          ...slot,
          bookedCount: bookingCount,
          available: bookingCount < slot.capacity,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch office hours' });
  }
};

// POST /api/office-hours — add a slot
const addSlot = async (req, res) => {
  try {
    const { professorName, professorEmail, courseName, courseId, day, startTime, endTime, location, capacity } = req.body;

    if (!professorName || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Professor name, day, start time, and end time are required' });
    }

    const slot = await OfficeHourSlot.create({
      userId: req.user._id,
      courseId: courseId || null,
      professorName,
      professorEmail: professorEmail || '',
      courseName: courseName || '',
      day,
      startTime,
      endTime,
      location: location || '',
      capacity: capacity || 1,
    });

    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add office hour slot' });
  }
};

// DELETE /api/office-hours/:id
const deleteSlot = async (req, res) => {
  try {
    const slot = await OfficeHourSlot.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    // Cancel all future bookings for this slot
    await OfficeHourBooking.updateMany(
      { slotId: slot._id, status: 'confirmed', bookingDate: { $gte: new Date() } },
      { status: 'cancelled' }
    );

    res.json({ message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};

// POST /api/office-hours/:id/book — book a specific date for a slot
const bookSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingDate, message } = req.body;

    const slot = await OfficeHourSlot.findOne({ _id: id, userId: req.user._id });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const date = new Date(bookingDate);
    if (date < new Date()) {
      return res.status(400).json({ error: 'Cannot book in the past' });
    }

    // Check capacity for that date
    const existingCount = await OfficeHourBooking.countDocuments({
      slotId: id,
      bookingDate: date,
      status: 'confirmed',
    });
    if (existingCount >= slot.capacity) {
      return res.status(409).json({ error: 'This slot is full for the selected date' });
    }

    // Check if user already booked this slot on this date
    const alreadyBooked = await OfficeHourBooking.findOne({
      userId: req.user._id,
      slotId: id,
      bookingDate: date,
      status: 'confirmed',
    });
    if (alreadyBooked) {
      return res.status(409).json({ error: 'You already booked this slot for this date' });
    }

    const booking = await OfficeHourBooking.create({
      userId: req.user._id,
      slotId: id,
      bookingDate: date,
      message: message || '',
    });

    // Send email to professor if email is provided and user has Gmail tokens
    let emailSent = false;
    if (slot.professorEmail && req.user.googleTokens?.access_token) {
      try {
        emailSent = await sendBookingEmail(req.user, slot, date, message || '');
        if (emailSent) {
          booking.emailSent = true;
          booking.emailSentAt = new Date();
          await booking.save();
        }
      } catch (emailError) {
        console.error('Email send failed (non-blocking):', emailError.message);
        // Don't fail the booking just because email failed
      }
    }

    res.status(201).json({
      booking,
      emailSent,
      message: emailSent
        ? `Booked! Confirmation email sent to ${slot.professorEmail}`
        : 'Booked! (No email sent — professor email not set or Gmail not connected)',
    });
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({ error: 'Failed to book slot' });
  }
};

// DELETE /api/office-hours/booking/:id — cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await OfficeHourBooking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'confirmed' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// GET /api/office-hours/my-bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await OfficeHourBooking.find({
      userId: req.user._id,
      status: 'confirmed',
      bookingDate: { $gte: new Date() },
    })
      .populate({
        path: 'slotId',
        populate: { path: 'courseId', select: 'name code' },
      })
      .sort({ bookingDate: 1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * Send a booking confirmation email to the professor via Gmail API.
 * Uses the student's Gmail credentials (send scope required).
 */
async function sendBookingEmail(user, slot, bookingDate, message) {
  const authClient = createAuthenticatedClient(user.googleTokens);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const dateStr = new Date(bookingDate).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeStr = `${formatTimeDisplay(slot.startTime)} – ${formatTimeDisplay(slot.endTime)}`;

  const subject = `Office Hours Booking – ${slot.courseName || 'Meeting'} (${dateStr})`;
  const body = [
    `Dear ${slot.professorName},`,
    '',
    `I would like to confirm my office hours booking:`,
    '',
    `Student: ${user.name} (${user.email})`,
    `Course: ${slot.courseName || 'N/A'}`,
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
    `Location: ${slot.location || 'TBD'}`,
    message ? `\nReason/Notes: ${message}` : '',
    '',
    'Thank you,',
    user.name,
    '',
    '— Sent via DeadlineOS',
  ].join('\n');

  const raw = createRawEmail(user.email, slot.professorEmail, subject, body);

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return true;
}

function createRawEmail(from, to, subject, body) {
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function formatTimeDisplay(time) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

module.exports = { getSlots, addSlot, deleteSlot, bookSlot, cancelBooking, getMyBookings };
