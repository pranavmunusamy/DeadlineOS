// Mock data for features that need placeholder content

export const COURSES = [
  { id: 'cs301', name: 'CS301 - Data Structures', color: '#3b82f6', professor: 'Dr. Smith', progress: 72 },
  { id: 'eng201', name: 'ENG201 - Technical Writing', color: '#8b5cf6', professor: 'Dr. Jones', progress: 58 },
  { id: 'math205', name: 'MATH205 - Linear Algebra', color: '#10b981', professor: 'Prof. Lee', progress: 85 },
  { id: 'phys101', name: 'PHYS101 - Mechanics', color: '#f59e0b', professor: 'Dr. Patel', progress: 44 },
  { id: 'hist110', name: 'HIST110 - World History', color: '#ef4444', professor: 'Prof. Garcia', progress: 91 },
];

export const OFFICE_HOURS = [
  { id: 1, professor: 'Dr. Smith', course: 'CS301', day: 'Monday', time: '2:00 PM - 4:00 PM', room: 'CS Building 302', rating: 4.5, available: true },
  { id: 2, professor: 'Dr. Jones', course: 'ENG201', day: 'Wednesday', time: '10:00 AM - 12:00 PM', room: 'Humanities 215', rating: 4.8, available: true },
  { id: 3, professor: 'Prof. Lee', course: 'MATH205', day: 'Tuesday', time: '3:00 PM - 5:00 PM', room: 'Math Center 104', rating: 4.2, available: false },
  { id: 4, professor: 'Dr. Patel', course: 'PHYS101', day: 'Thursday', time: '1:00 PM - 3:00 PM', room: 'Science Hall 410', rating: 4.6, available: true },
];

export const BADGES = [
  { id: 1, name: 'Early Bird', icon: '🌅', desc: 'Completed 5 tasks before deadline', earned: true },
  { id: 2, name: 'Streak Master', icon: '🔥', desc: '7-day completion streak', earned: true },
  { id: 3, name: 'Perfect Week', icon: '⭐', desc: 'All tasks completed in a week', earned: true },
  { id: 4, name: 'Study Warrior', icon: '⚔️', desc: 'Completed 50 tasks total', earned: false, progress: 68 },
  { id: 5, name: 'Night Owl', icon: '🦉', desc: 'Submitted 3 tasks after midnight', earned: false, progress: 33 },
  { id: 6, name: 'Semester Hero', icon: '🏆', desc: 'Complete all semester deadlines', earned: false, progress: 52 },
];

export const AI_SUGGESTIONS = [
  { id: 1, type: 'study', title: 'Start CS301 Assignment now', reason: 'Based on past patterns, this assignment takes ~4 hours. Deadline is in 2 days.', urgency: 'high' },
  { id: 2, type: 'break', title: 'Light workload tomorrow', reason: 'No deadlines for 3 days. Good time for review or office hours.', urgency: 'low' },
  { id: 3, type: 'warning', title: 'Deadline conflict detected', reason: 'ENG201 paper and MATH205 problem set due same day. Plan ahead.', urgency: 'medium' },
];

export const WORKLOAD_DATA = [
  { week: 'Week 1', assignments: 3, quizzes: 1, projects: 0, papers: 0 },
  { week: 'Week 2', assignments: 2, quizzes: 2, projects: 1, papers: 0 },
  { week: 'Week 3', assignments: 4, quizzes: 0, projects: 1, papers: 1 },
  { week: 'Week 4', assignments: 1, quizzes: 3, projects: 0, papers: 0 },
  { week: 'Week 5', assignments: 5, quizzes: 1, projects: 2, papers: 1 },
  { week: 'Week 6', assignments: 2, quizzes: 2, projects: 1, papers: 0 },
  { week: 'Week 7', assignments: 3, quizzes: 0, projects: 0, papers: 2 },
  { week: 'Week 8', assignments: 4, quizzes: 2, projects: 1, papers: 1 },
];
