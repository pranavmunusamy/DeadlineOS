import { useState, useEffect } from 'react';
import api from '../services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOT_LABELS = Array.from({ length: 20 }, (_, i) => {
  const h = 8 + i * 0.5;
  const hour = Math.floor(h);
  const min = h % 1 === 0.5 ? '30' : '00';
  const ampm = hour >= 12 ? 'P' : 'A';
  const d = hour > 12 ? hour - 12 : hour;
  return i % 2 === 0 ? `${d}${ampm}` : '';
});

const RoomAnalytics = () => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [roomStats, setRoomStats] = useState(null);
  const [bestTimes, setBestTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const load = async () => {
      try {
        const [hm, rs, bt] = await Promise.all([
          api.get('/analytics/heatmap'),
          api.get('/analytics/rooms', { params: { days } }),
          api.get('/analytics/best-times'),
        ]);
        setHeatmapData(hm.data);
        setRoomStats(rs.data);
        setBestTimes(bt.data);
      } catch (err) {
        console.error('Analytics load error', err);
      }
      setLoading(false);
    };
    load();
  }, [days]);

  const formatHour = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-mono text-[var(--text-muted)]">Loading analytics...</p>
      </div>
    );
  }

  const maxHeat = heatmapData ? Math.max(...heatmapData.heatmap.flat(), 1) : 1;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Room Analytics</h2>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-1.5 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Global stats */}
      {roomStats?.global && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-up stagger-1">
          {[
            { label: 'Total Bookings', value: roomStats.global.totalBookings, color: 'var(--text-primary)' },
            { label: 'Avg Utilization', value: `${roomStats.global.avgUtilization}%`, color: 'var(--accent-blue)' },
            { label: 'Most Popular', value: roomStats.global.mostPopularRoom, color: 'var(--accent-green)' },
            { label: 'Least Used', value: roomStats.global.leastUsedRoom, color: 'var(--accent-amber)' },
            { label: 'Cancel Rate', value: `${roomStats.global.avgCancellationRate}%`, color: 'var(--accent-red)' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4">
              <span className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap */}
      {heatmapData && (
        <div className="glass rounded-xl p-5 animate-fade-up stagger-2">
          <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Booking Heatmap</h3>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Darker = more bookings per slot</p>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Slot labels (top) */}
              <div className="flex ml-10">
                {SLOT_LABELS.map((l, i) => (
                  <div key={i} className="flex-1 text-[8px] font-mono text-[var(--text-muted)] text-center">{l}</div>
                ))}
              </div>

              {/* Grid rows */}
              {heatmapData.heatmap.map((row, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-1 mt-0.5">
                  <span className="w-9 text-[10px] font-mono text-[var(--text-muted)] text-right">{DAYS[dayIdx]}</span>
                  <div className="flex flex-1 gap-px">
                    {row.map((val, slotIdx) => {
                      const intensity = val / maxHeat;
                      const alpha = val === 0 ? 0.04 : 0.15 + intensity * 0.75;
                      return (
                        <div key={slotIdx}
                          className="flex-1 rounded-sm transition-all hover:scale-150 hover:z-10 cursor-pointer"
                          style={{
                            height: '20px',
                            background: val === 0
                              ? 'var(--bg-tertiary)'
                              : `rgba(91, 138, 245, ${alpha})`,
                          }}
                          title={`${DAYS[dayIdx]} ${formatHour(8 + slotIdx * 0.5)}: ${val} booking${val !== 1 ? 's' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Color scale legend */}
              <div className="flex items-center gap-2 mt-3 ml-10">
                <span className="text-[9px] font-mono text-[var(--text-muted)]">Less</span>
                <div className="flex gap-px">
                  {[0.05, 0.2, 0.4, 0.6, 0.9].map((a) => (
                    <div key={a} className="w-4 h-3 rounded-sm" style={{ background: `rgba(91, 138, 245, ${a})` }} />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">More</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room utilization table */}
      {roomStats?.rooms && (
        <div className="glass rounded-xl p-5 animate-fade-up stagger-3">
          <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Room Utilization</h3>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Per-room breakdown</p>

          <div className="space-y-2">
            {roomStats.rooms.map((r) => (
              <div key={r.room._id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-[var(--text-primary)]">{r.room.name}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{r.room.building}</span>
                  </div>
                  <div className="progress-bar mt-1.5">
                    <div className="progress-bar-fill transition-all duration-700"
                      style={{
                        width: `${r.utilization}%`,
                        background: r.utilization > 70 ? 'var(--accent-red)' : r.utilization > 40 ? 'var(--accent-amber)' : 'var(--accent-blue)',
                      }} />
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-display font-bold" style={{
                    color: r.utilization > 70 ? 'var(--accent-red)' : r.utilization > 40 ? 'var(--accent-amber)' : 'var(--accent-blue)',
                  }}>
                    {r.utilization}%
                  </span>
                  <p className="text-[9px] font-mono text-[var(--text-muted)]">
                    {r.totalBookings} bookings · avg {r.avgDuration}min
                  </p>
                </div>

                {r.peakHour !== null && (
                  <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded flex-shrink-0">
                    peak {formatHour(r.peakHour)}
                  </span>
                )}
              </div>
            ))}

            {roomStats.rooms.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No booking data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Best times to book */}
      {bestTimes && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-5 animate-fade-up stagger-4">
            <h3 className="font-display font-bold text-[var(--accent-green)] mb-1">Best Times to Book</h3>
            <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3">Low-traffic windows</p>
            <div className="space-y-2">
              {bestTimes.bestSlots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{s.day} {formatHour(s.hour)}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">({s.count} bookings)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5 animate-fade-up stagger-5">
            <h3 className="font-display font-bold text-[var(--accent-red)] mb-1">Busiest Times</h3>
            <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3">Hardest to find a room</p>
            <div className="space-y-2">
              {bestTimes.busiestSlots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]" />
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{s.day} {formatHour(s.hour)}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">({s.count} bookings)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomAnalytics;
