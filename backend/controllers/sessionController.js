const Session = require('../models/Session');
const SessionParticipant = require('../models/SessionParticipant');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// POST /api/sessions — create a study session from a booking
const createSession = async (req, res) => {
  try {
    const { bookingId, title, description, type, courseTag, topicTags, maxParticipants } = req.body;

    // Validate booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user._id,
      status: 'active',
    }).populate('roomId');

    if (!booking) return res.status(404).json({ error: 'Booking not found or not yours' });

    // Check no session already exists for this booking
    const existing = await Session.findOne({ bookingId, status: 'active' });
    if (existing) return res.status(409).json({ error: 'Session already exists for this booking' });

    // maxParticipants cannot exceed room capacity
    const cap = Math.min(maxParticipants || booking.roomId.capacity, booking.roomId.capacity);

    const session = await Session.create({
      bookingId,
      hostUserId: req.user._id,
      title: title || 'Study Session',
      description: description || '',
      type: type || 'OPEN',
      courseTag: courseTag || '',
      topicTags: topicTags || [],
      maxParticipants: cap,
    });

    // Host auto-joins as participant
    await SessionParticipant.create({
      sessionId: session._id,
      userId: req.user._id,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

// GET /api/sessions — discover open sessions
const discoverSessions = async (req, res) => {
  try {
    const { courseTag, building } = req.query;

    // Get active sessions whose bookings haven't ended
    const query = { status: 'active', type: 'OPEN' };
    if (courseTag) query.courseTag = courseTag;

    const sessions = await Session.find(query)
      .populate({
        path: 'bookingId',
        match: { status: 'active', endTime: { $gt: new Date() } },
        populate: { path: 'roomId', select: 'name building capacity' },
      })
      .populate('hostUserId', 'name picture')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out sessions whose bookings have been cancelled or ended
    const valid = sessions.filter((s) => s.bookingId !== null);

    // Optionally filter by building
    const filtered = building
      ? valid.filter((s) => s.bookingId.roomId?.building === building)
      : valid;

    // Attach participant counts
    const enriched = await Promise.all(
      filtered.map(async (s) => {
        const participantCount = await SessionParticipant.countDocuments({
          sessionId: s._id,
          status: 'joined',
        });
        const isJoined = await SessionParticipant.findOne({
          sessionId: s._id,
          userId: req.user._id,
          status: 'joined',
        });
        return {
          ...s,
          participantCount,
          isFull: participantCount >= s.maxParticipants,
          isJoined: !!isJoined,
          isHost: s.hostUserId._id.toString() === req.user._id.toString(),
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Discover sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// GET /api/sessions/:id — session detail
const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({
        path: 'bookingId',
        populate: { path: 'roomId', select: 'name building capacity features' },
      })
      .populate('hostUserId', 'name picture email')
      .lean();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const participants = await SessionParticipant.find({
      sessionId: session._id,
      status: 'joined',
    })
      .populate('userId', 'name picture')
      .lean();

    res.json({ ...session, participants });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// POST /api/sessions/:id/join
const joinSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      status: 'active',
    }).populate('bookingId');

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.type === 'PRIVATE') {
      return res.status(403).json({ error: 'This is a private session' });
    }

    // Check capacity
    const count = await SessionParticipant.countDocuments({
      sessionId: session._id,
      status: 'joined',
    });
    if (count >= session.maxParticipants) {
      return res.status(409).json({ error: 'Session is full' });
    }

    // Check user doesn't have overlapping sessions
    const booking = session.bookingId;
    const userSessions = await SessionParticipant.find({
      userId: req.user._id,
      status: 'joined',
    }).populate({
      path: 'sessionId',
      match: { status: 'active' },
      populate: { path: 'bookingId' },
    });

    const hasOverlap = userSessions.some((sp) => {
      if (!sp.sessionId?.bookingId) return false;
      const b = sp.sessionId.bookingId;
      return b.startTime < booking.endTime && b.endTime > booking.startTime;
    });

    if (hasOverlap) {
      return res.status(409).json({ error: 'You have an overlapping session at this time' });
    }

    // Upsert: if previously left, rejoin
    await SessionParticipant.findOneAndUpdate(
      { sessionId: session._id, userId: req.user._id },
      { status: 'joined', joinedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: 'Joined session' });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
};

// POST /api/sessions/:id/leave
const leaveSession = async (req, res) => {
  try {
    const result = await SessionParticipant.findOneAndUpdate(
      { sessionId: req.params.id, userId: req.user._id, status: 'joined' },
      { status: 'left' },
      { new: true }
    );

    if (!result) return res.status(404).json({ error: 'Not a participant' });
    res.json({ message: 'Left session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave session' });
  }
};

// GET /api/sessions/my — user's sessions (hosting + joined)
const getMySessions = async (req, res) => {
  try {
    // Sessions I'm participating in
    const participations = await SessionParticipant.find({
      userId: req.user._id,
      status: 'joined',
    })
      .populate({
        path: 'sessionId',
        match: { status: 'active' },
        populate: [
          { path: 'bookingId', populate: { path: 'roomId', select: 'name building' } },
          { path: 'hostUserId', select: 'name picture' },
        ],
      })
      .lean();

    const sessions = participations
      .filter((p) => p.sessionId && p.sessionId.bookingId)
      .map((p) => ({
        ...p.sessionId,
        isHost: p.sessionId.hostUserId._id.toString() === req.user._id.toString(),
      }));

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

module.exports = {
  createSession,
  discoverSessions,
  getSession,
  joinSession,
  leaveSession,
  getMySessions,
};
