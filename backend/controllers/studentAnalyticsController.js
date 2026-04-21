/**
 * DeadlineOS - Student Analytics Controller
 * All metrics derived from real user data. Zero mock values.
 */

const Task = require('../models/Task');
const Course = require('../models/Course');
const TimetableEntry = require('../models/TimetableEntry');

// GET /api/student-analytics — full analytics dashboard data
const getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [allTasks, courses, timetable] = await Promise.all([
      Task.find({ userId }).lean(),
      Course.find({ userId, status: 'active' }).lean(),
      TimetableEntry.find({ userId }).lean(),
    ]);

    const pending = allTasks.filter((t) => t.status === 'pending');
    const completed = allTasks.filter((t) => t.status === 'completed');
    const overdue = pending.filter((t) => new Date(t.deadline) < now);

    // ─── WORKLOAD CHART (real weekly data, last 8 weeks) ────────
    const workload = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w * 7) - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekTasks = allTasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= weekStart && d < weekEnd;
      });

      // Categorize by title keywords
      let assignments = 0, quizzes = 0, projects = 0, papers = 0;
      weekTasks.forEach((t) => {
        const lower = t.title.toLowerCase();
        if (/quiz|test|exam|midterm|final/.test(lower)) quizzes++;
        else if (/project|presentation/.test(lower)) projects++;
        else if (/paper|essay|report|thesis/.test(lower)) papers++;
        else assignments++;
      });

      workload.push({
        week: `W${8 - w}`,
        weekStart: weekStart.toISOString(),
        assignments, quizzes, projects, papers,
        total: weekTasks.length,
      });
    }

    // ─── COURSE PERFORMANCE (real completion rates) ─────────────
    const coursePerformance = await Promise.all(
      courses.map(async (course) => {
        const courseTasks = allTasks.filter((t) =>
          t.courseId && t.courseId.toString() === course._id.toString()
        );
        const total = courseTasks.length;
        const done = courseTasks.filter((t) => t.status === 'completed').length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        // Simple grade estimate based on completion rate
        let grade;
        if (pct >= 90) grade = 'A';
        else if (pct >= 80) grade = 'A-';
        else if (pct >= 70) grade = 'B+';
        else if (pct >= 60) grade = 'B';
        else if (pct >= 50) grade = 'B-';
        else if (pct >= 40) grade = 'C+';
        else grade = 'C';

        return {
          code: course.code,
          name: course.name,
          color: course.color,
          total, done, pct, grade,
        };
      })
    );

    // ─── STRESS / PRESSURE INDICATOR ────────────────────────────
    // Based on: upcoming deadline density + overdue count + high priority count
    const next3Days = pending.filter((t) => {
      const d = new Date(t.deadline);
      return d > now && d < new Date(now.getTime() + 3 * 86400000);
    });
    const highPriority = pending.filter((t) => t.priority === 'HIGH');

    const stressScore = Math.min(100,
      (overdue.length * 20) +
      (highPriority.length * 15) +
      (next3Days.length * 10) +
      (pending.length * 2)
    );
    const stressLabel = stressScore > 70 ? 'High' : stressScore > 40 ? 'Moderate' : 'Low';

    // ─── ACHIEVEMENTS (real milestone tracking) ─────────────────
    const achievements = [];

    // Early Bird: tasks completed before deadline
    const earlyCompletions = completed.filter((t) => {
      // Can't perfectly track completion time without a completedAt field,
      // but if it's completed and deadline is in the future, it was early
      return new Date(t.deadline) > now;
    });
    achievements.push({
      id: 'early_bird',
      name: 'Early Bird',
      icon: '🌅',
      desc: 'Complete 5 tasks before deadline',
      target: 5,
      current: Math.min(earlyCompletions.length, 5),
      earned: earlyCompletions.length >= 5,
    });

    // Task Master: complete 10 total tasks
    achievements.push({
      id: 'task_master',
      name: 'Task Master',
      icon: '⭐',
      desc: 'Complete 10 tasks total',
      target: 10,
      current: Math.min(completed.length, 10),
      earned: completed.length >= 10,
    });

    // Study Warrior: complete 25 total tasks
    achievements.push({
      id: 'study_warrior',
      name: 'Study Warrior',
      icon: '⚔️',
      desc: 'Complete 25 tasks total',
      target: 25,
      current: Math.min(completed.length, 25),
      earned: completed.length >= 25,
    });

    // Course Hero: 100% completion in any course
    const perfectCourse = coursePerformance.some((c) => c.total >= 3 && c.pct === 100);
    achievements.push({
      id: 'course_hero',
      name: 'Course Hero',
      icon: '🏆',
      desc: '100% completion in a course (min 3 tasks)',
      target: 1,
      current: perfectCourse ? 1 : 0,
      earned: perfectCourse,
    });

    // Multi-tasker: have tasks in 3+ courses
    const coursesWithTasks = new Set(allTasks.filter((t) => t.courseId).map((t) => t.courseId.toString()));
    achievements.push({
      id: 'multi_tasker',
      name: 'Multi-Tasker',
      icon: '🎯',
      desc: 'Track tasks in 3+ courses',
      target: 3,
      current: Math.min(coursesWithTasks.size, 3),
      earned: coursesWithTasks.size >= 3,
    });

    // Zero Overdue: no overdue tasks (only earned if you have tasks)
    achievements.push({
      id: 'zero_overdue',
      name: 'Clean Slate',
      icon: '✨',
      desc: 'Zero overdue tasks (min 5 total)',
      target: 1,
      current: (allTasks.length >= 5 && overdue.length === 0) ? 1 : 0,
      earned: allTasks.length >= 5 && overdue.length === 0,
    });

    // ─── DAILY DENSITY (tasks per day, next 14 days) ────────────
    const dailyDensity = [];
    for (let d = 0; d < 14; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTasks = pending.filter((t) => {
        const dl = new Date(t.deadline);
        return dl >= date && dl < nextDate;
      });

      dailyDensity.push({
        date: date.toISOString(),
        label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        count: dayTasks.length,
      });
    }

    res.json({
      workload,
      coursePerformance,
      stress: { score: stressScore, label: stressLabel, overdue: overdue.length, highPriority: highPriority.length, next3Days: next3Days.length },
      achievements,
      dailyDensity,
      summary: {
        totalTasks: allTasks.length,
        completed: completed.length,
        pending: pending.length,
        overdue: overdue.length,
        completionRate: allTasks.length > 0 ? Math.round((completed.length / allTasks.length) * 100) : 0,
        classesPerWeek: timetable.length,
        activeCourses: courses.length,
      },
    });
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
};

module.exports = { getStudentAnalytics };
