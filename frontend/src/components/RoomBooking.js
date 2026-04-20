import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const HOURS = Array.from({ length: 20 }, (_, i) => 8 + i * 0.5); // 8:00 to 17:30
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatHour = (h) => {
  const hour = Math.floor(h);
  const min = h % 1 === 0.5 ? '30' : '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${min} ${ampm}`;
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const RoomBooking = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [bookings, setBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { dayIndex, hour }
  const [bookingEnd, setBookingEnd] = useState('');
  const [toast, setToast] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Fetch rooms
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/rooms');
        setRooms(data);
        if (data.length > 0) setSelectedRoom(data[0]);
      } catch { /* rooms may not be seeded yet */ }
      setLoading(false);
    };
    load();
  }, []);

  // Fetch availability when room or week changes
  const fetchAvailability = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const { data } = await api.get(`/rooms/${selectedRoom._id}/availability`, {
        params: { week: weekStart.toISOString() },
      });
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch availability', err);
    }
  }, [selectedRoom, weekStart]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // Fetch my bookings
  const fetchMyBookings = useCallback(async () => {
    try {
      const { data } = await api.get('/rooms/my-bookings');
      setMyBookings(data);
    } catch { /* ok */ }
  }, []);

  useEffect(() => { fetchMyBookings(); }, [fetchMyBookings]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const seedRooms = async () => {
    setSeeding(true);
    try {
      const { data } = await api.post('/rooms/seed');
      showToast(data.message);
      const { data: r } = await api.get('/rooms');
      setRooms(r);
      if (r.length > 0) setSelectedRoom(r[0]);
    } catch { showToast('Failed to seed rooms'); }
    setSeeding(false);
  };

  // Get slot status
  const getSlotStatus = (dayIndex, hour) => {
    const slotStart = new Date(weekStart);
    slotStart.setDate(slotStart.getDate() + dayIndex);
    slotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    for (const b of bookings) {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      if (slotStart >= bStart && slotStart < bEnd) {
        return b.isMine ? 'mine' : 'booked';
      }
    }
    // Past slot
    if (slotStart < new Date()) return 'past';
    return 'free';
  };

  // Handle slot click → open booking modal
  const handleSlotClick = (dayIndex, hour) => {
    const status = getSlotStatus(dayIndex, hour);
    if (status !== 'free') return;

    const maxEnd = Math.min(hour + 2, 18); // Max 2 hours, cap at 6PM
    setBookingEnd(formatHour(hour + 0.5));
    setModal({ dayIndex, hour, maxEnd });
  };

  // Create booking
  const handleBook = async () => {
    if (!modal || !selectedRoom) return;

    const start = new Date(weekStart);
    start.setDate(start.getDate() + modal.dayIndex);
    start.setHours(Math.floor(modal.hour), (modal.hour % 1) * 60, 0, 0);

    // Parse end time
    const endParts = bookingEnd.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!endParts) return showToast('Invalid end time');
    let endHour = parseInt(endParts[1]);
    const endMin = parseInt(endParts[2]);
    if (endParts[3].toUpperCase() === 'PM' && endHour < 12) endHour += 12;
    if (endParts[3].toUpperCase() === 'AM' && endHour === 12) endHour = 0;

    const end = new Date(start);
    end.setHours(endHour, endMin, 0, 0);

    try {
      await api.post('/rooms/book', {
        roomId: selectedRoom._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      showToast('Room booked!');
      setModal(null);
      fetchAvailability();
      fetchMyBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Booking failed');
    }
  };

  // Cancel booking
  const handleCancel = async (id) => {
    try {
      await api.delete(`/rooms/booking/${id}`);
      showToast('Booking cancelled');
      fetchAvailability();
      fetchMyBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Cancel failed');
    }
  };

  // Week navigation
  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const opts = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
  })();

  // Generate end time options for modal
  const getEndOptions = () => {
    if (!modal) return [];
    const opts = [];
    for (let h = modal.hour + 0.5; h <= modal.maxEnd; h += 0.5) {
      opts.push(formatHour(h));
    }
    return opts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-mono text-[var(--text-muted)]">Loading rooms...</p>
      </div>
    );
  }

  // No rooms seeded yet
  if (rooms.length === 0) {
    return (
      <div className="animate-fade-up">
        <div className="glass rounded-xl p-8 text-center">
          <span className="text-3xl block mb-3">&#9881;</span>
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">No Rooms Yet</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Seed the database with demo breakout rooms to get started.</p>
          <button onClick={seedRooms} disabled={seeding}
            className="px-5 py-2 bg-[var(--accent-blue)] text-white text-sm font-mono font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40">
            {seeding ? 'Seeding...' : 'Seed Demo Rooms'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      {/* Header: Room selector + week nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Room Booking</h2>
          <select value={selectedRoom?._id || ''} onChange={(e) => setSelectedRoom(rooms.find((r) => r._id === e.target.value))}
            className="px-3 py-1.5 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none">
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>{r.name} · {r.building} (cap {r.capacity})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-xs font-mono text-[var(--text-secondary)] min-w-[140px] text-center">{weekLabel}</span>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Room features */}
      {selectedRoom?.features?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selectedRoom.features.map((f) => (
            <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]">
              {f.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4">
        {[
          { label: 'Available', color: 'bg-[var(--accent-green)]' },
          { label: 'Booked', color: 'bg-[var(--accent-red)]' },
          { label: 'My Booking', color: 'bg-[var(--accent-blue)]' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.color} opacity-70`} />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Weekly calendar grid */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border)]">
              <div className="p-2" />
              {DAYS.map((d, i) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div key={d} className={`p-2 text-center border-l border-[var(--border)] ${isToday ? 'bg-[var(--accent-blue-dim)]' : ''}`}>
                    <span className="text-[10px] font-mono font-semibold text-[var(--text-secondary)] block">{d}</span>
                    <span className={`text-[10px] font-mono ${isToday ? 'text-[var(--accent-blue)] font-bold' : 'text-[var(--text-muted)]'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border)] last:border-0">
                <div className="p-1.5 text-[9px] font-mono text-[var(--text-muted)] text-right pr-2 pt-2">
                  {hour % 1 === 0 ? formatHour(hour) : ''}
                </div>
                {DAYS.map((_, dayIndex) => {
                  const status = getSlotStatus(dayIndex, hour);
                  const bg = {
                    free: 'hover:bg-[rgba(61,214,140,0.08)] cursor-pointer',
                    booked: 'bg-[rgba(245,91,91,0.12)]',
                    mine: 'bg-[rgba(91,138,245,0.15)]',
                    past: 'opacity-30',
                  }[status];

                  return (
                    <div key={dayIndex}
                      onClick={() => handleSlotClick(dayIndex, hour)}
                      className={`border-l border-[var(--border)] min-h-[24px] transition-all ${bg}`}
                      title={status === 'free' ? `Book ${formatHour(hour)}` : status === 'mine' ? 'Your booking' : status === 'booked' ? 'Booked' : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Bookings list */}
      {myBookings.length > 0 && (
        <div className="glass rounded-xl p-4 animate-fade-up">
          <h3 className="text-xs font-mono font-semibold text-[var(--text-muted)] mb-3">MY BOOKINGS</h3>
          <div className="space-y-2">
            {myBookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{b.roomId?.name} · {b.roomId?.building}</p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)]">
                      {new Date(b.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '}{formatHour(new Date(b.startTime).getHours() + new Date(b.startTime).getMinutes() / 60)}
                      {' – '}{formatHour(new Date(b.endTime).getHours() + new Date(b.endTime).getMinutes() / 60)}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleCancel(b._id)}
                  className="text-[10px] font-mono text-[var(--accent-red)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                  cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {modal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div className="glass rounded-2xl w-full max-w-sm p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1">Book Room</h2>
            <p className="text-xs font-mono text-[var(--text-muted)] mb-4">
              {selectedRoom?.name} · {DAYS[modal.dayIndex]}, {formatHour(modal.hour)} start
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">END TIME</label>
                <select value={bookingEnd} onChange={(e) => setBookingEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none">
                  {getEndOptions().map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                  Cancel
                </button>
                <button onClick={handleBook}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity">
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono font-bold z-50 animate-fade-up glass text-[var(--text-primary)]"
          style={{ boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default RoomBooking;
