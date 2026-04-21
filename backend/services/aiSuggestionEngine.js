/**
 * DeadlineOS - AI Suggestion Engine
 * Generates context-aware suggestions by analyzing:
 * - Timetable (class schedule, free blocks)
 * - Tasks (deadlines, urgency, workload)
 * - Courses (workload distribution)
 * - Office hour bookings
 * - Room bookings
 */

const Task = require('../models/Task');
const TimetableEntry = require('../models/TimetableEntry');
const Course = require('../models/Course');
const OfficeHourBooking = require('../models/OfficeHourBooking');
const Booking = require('../models/Booking');

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function generateSuggestions(userId) {
  const suggestions = [];
  const now = new Date();

  // Fetch all user data in parallel
  const [tasks, timetable, courses, ohBookings, roomBookings] = await Promise.all([
    Task.find({ userId, status: 'pending' }).sort({ deadline: 1 }).lean(),
    TimetableEntry.find({ userId }).lean(),
    Course.find({ userId, status: 'active' }).lean(),
    OfficeHourBooking.find({ userId, status: 'confirmed', bookingDate: { $gte: now } }).populate('slotId').lean(),
    Booking.find({ userId, status: 'active', endTime: { $gt: now } }).lean(),
  ]);

  // ─── 1. DEADLINE CONFLICT DETECTION ───────────────────────────
  const deadlinesByDate = {};
  tasks.forEach((t) => {
    const key = new Date(t.deadline).toDateString();
    (deadlinesByDate[key] = deadlinesByDate[key] || []).push(t);
  });

  Object.entries(deadlinesByDate).forEach(([date, dateTasks]) => {
    if (dateTasks.length >= 2) {
      const names = dateTasks.slice(0, 3).map((t) => t.title.substring(0, 30)).join(', ');
      suggestions.push({
        type: 'warning',
        title: `${dateTasks.length} deadlines on ${new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
        reason: `Conflict: ${names}. Consider starting earlier.`,
        priority: 'high',
      });
    }
  });

  // ─── 2. URGENT TASK RECOMMENDATIONS ───────────────────────────
  const urgentTasks = tasks.filter((t) => {
    const hoursLeft = (new Date(t.deadline) - now) / 3600000;
    return hoursLeft > 0 && hoursLeft < 48;
  });

  urgentTasks.forEach((t) => {
    const hoursLeft = Math.round((new Date(t.deadline) - now) / 3600000);
    suggestions.push({
      type: 'study',
      title: `Start "${t.title.substring(0, 40)}" now`,
      reason: `Only ${hoursLeft}h remaining before deadline.`,
      priority: 'high',
    });
  });

  // ─── 3. FREE TIME BLOCK IDENTIFICATION ────────────────────────
  const todayDayName = DAYS_ORDER[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const todaySlots = timetable.filter((e) => e.day === todayDayName);

  if (todaySlots.length === 0 && tasks.length > 0) {
    suggestions.push({
      type: 'study',
      title: 'No classes today — deep work day',
      reason: 'Your timetable is clear. Perfect for tackling big assignments.',
      priority: 'medium',
    });
  } else if (todaySlots.length > 0) {
    // Find gaps between classes
    const sorted = [...todaySlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = sorted[i].endTime;
      const gapEnd = sorted[i + 1].startTime;
      const gapHours = (parseTime(gapEnd) - parseTime(gapStart)) / 60;
      if (gapHours >= 2) {
        suggestions.push({
          type: 'study',
          title: `${gapHours.toFixed(0)}h free block: ${gapStart}–${gapEnd}`,
          reason: `Between ${sorted[i].courseName} and ${sorted[i + 1].courseName}. Good for focused work.`,
          priority: 'low',
        });
      }
    }
  }

  // ─── 4. WORKLOAD ANALYSIS (next 7 days) ───────────────────────
  const next7Days = tasks.filter((t) => {
    const d = new Date(t.deadline);
    return d > now && d < new Date(now.getTime() + 7 * 86400000);
  });

  if (next7Days.length === 0) {
    suggestions.push({
      type: 'break',
      title: 'Light week ahead',
      reason: 'No deadlines in the next 7 days. Good time for review or self-study.',
      priority: 'low',
    });
  } else if (next7Days.length >= 5) {
    suggestions.push({
      type: 'warning',
      title: `Heavy week: ${next7Days.length} deadlines in 7 days`,
      reason: 'Consider prioritizing by urgency. Start with the earliest due dates.',
      priority: 'high',
    });
  }

  // ─── 5. COURSE WORKLOAD IMBALANCE ─────────────────────────────
  if (courses.length > 1) {
    const courseLoad = {};
    tasks.forEach((t) => {
      if (t.courseId) {
        const key = t.courseId.toString();
        courseLoad[key] = (courseLoad[key] || 0) + 1;
      }
    });

    const loads = Object.entries(courseLoad);
    if (loads.length > 1) {
      const maxLoad = loads.reduce((a, b) => a[1] > b[1] ? a : b);
      const minLoad = loads.reduce((a, b) => a[1] < b[1] ? a : b);
      if (maxLoad[1] > minLoad[1] * 3) {
        const heavyCourse = courses.find((c) => c._id.toString() === maxLoad[0]);
        if (heavyCourse) {
          suggestions.push({
            type: 'warning',
            title: `${heavyCourse.code} has ${maxLoad[1]} pending tasks`,
            reason: 'This course has significantly more tasks than others. Allocate more time.',
            priority: 'medium',
          });
        }
      }
    }
  }

  // ─── 6. OVERDUE TASK ALERTS ───────────────────────────────────
  const overdue = tasks.filter((t) => new Date(t.deadline) < now);
  if (overdue.length > 0) {
    suggestions.push({
      type: 'warning',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      reason: `"${overdue[0].title.substring(0, 40)}"${overdue.length > 1 ? ` and ${overdue.length - 1} more` : ''} past deadline. Complete or mark done.`,
      priority: 'high',
    });
  }

  // ─── 7. TOMORROW PREPARATION ──────────────────────────────────
  const tomorrowDayIndex = (now.getDay()) % 7; // getDay: 0=Sun
  const tomorrowDayName = DAYS_ORDER[tomorrowDayIndex === 0 ? 6 : tomorrowDayIndex - 1];
  // Actually calculate tomorrow correctly
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = DAYS_ORDER[tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1];

  const tomorrowClasses = timetable.filter((e) => e.day === tomorrowDay);
  if (tomorrowClasses.length > 0) {
    const classNames = tomorrowClasses.map((c) => c.courseName).join(', ');
    suggestions.push({
      type: 'study',
      title: `Tomorrow: ${tomorrowClasses.length} class${tomorrowClasses.length > 1 ? 'es' : ''}`,
      reason: `${classNames}. Review materials tonight.`,
      priority: 'low',
    });
  }

  // ─── 8. OFFICE HOUR REMINDER ──────────────────────────────────
  const upcomingOH = ohBookings.filter((b) => {
    const d = new Date(b.bookingDate);
    return d > now && d < new Date(now.getTime() + 2 * 86400000);
  });
  upcomingOH.forEach((b) => {
    if (b.slotId) {
      suggestions.push({
        type: 'study',
        title: `Office hours with ${b.slotId.professorName} soon`,
        reason: `${new Date(b.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — prepare your questions.`,
        priority: 'medium',
      });
    }
  });

  // Sort: high priority first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  // Cap at 8 suggestions max
  return suggestions.slice(0, 8);
}

// Parse "HH:MM" to minutes since midnight
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

module.exports = { generateSuggestions };
