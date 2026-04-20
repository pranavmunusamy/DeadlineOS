export const COURSES = [
  { id: 'cs301', name: 'Data Structures', code: 'CS301', color: '#5b8af5', professor: 'Dr. Smith', progress: 72, credits: 4, schedule: 'Mon/Wed 9:00–10:30' },
  { id: 'eng201', name: 'Technical Writing', code: 'ENG201', color: '#a78bfa', professor: 'Dr. Jones', progress: 58, credits: 3, schedule: 'Mon/Fri 2:00–3:30' },
  { id: 'math205', name: 'Linear Algebra', code: 'MATH205', color: '#3dd68c', professor: 'Prof. Lee', progress: 85, credits: 4, schedule: 'Tue/Thu 10:00–11:30' },
  { id: 'phys101', name: 'Mechanics', code: 'PHYS101', color: '#f5a623', professor: 'Dr. Patel', progress: 44, credits: 3, schedule: 'Tue/Thu 1:00–2:30' },
  { id: 'hist110', name: 'World History', code: 'HIST110', color: '#f55b5b', professor: 'Prof. Garcia', progress: 91, credits: 3, schedule: 'Wed/Fri 9:00–10:30' },
];

export const OFFICE_HOURS = [
  { id: 1, professor: 'Dr. Smith', course: 'CS301', day: 'Monday', time: '2:00 – 4:00 PM', room: 'CS 302', rating: 4.5, slots: 3, available: true },
  { id: 2, professor: 'Dr. Jones', course: 'ENG201', day: 'Wednesday', time: '10:00 AM – 12:00', room: 'HUM 215', rating: 4.8, slots: 1, available: true },
  { id: 3, professor: 'Prof. Lee', course: 'MATH205', day: 'Tuesday', time: '3:00 – 5:00 PM', room: 'MATH 104', rating: 4.2, slots: 0, available: false },
  { id: 4, professor: 'Dr. Patel', course: 'PHYS101', day: 'Thursday', time: '1:00 – 3:00 PM', room: 'SCI 410', rating: 4.6, slots: 5, available: true },
];

export const BADGES = [
  { id: 1, name: 'Early Bird', icon: '🌅', desc: '5 tasks before deadline', earned: true },
  { id: 2, name: 'Streak Master', icon: '🔥', desc: '7-day streak', earned: true },
  { id: 3, name: 'Perfect Week', icon: '⭐', desc: 'All tasks in a week', earned: true },
  { id: 4, name: 'Study Warrior', icon: '⚔️', desc: '50 tasks total', earned: false, progress: 68 },
  { id: 5, name: 'Night Owl', icon: '🦉', desc: '3 midnight submits', earned: false, progress: 33 },
  { id: 6, name: 'Semester Hero', icon: '🏆', desc: 'All semester deadlines', earned: false, progress: 52 },
];

export const AI_SUGGESTIONS = [
  { id: 1, type: 'study', title: 'Start CS301 Assignment now', reason: 'Past patterns show ~4hrs needed. Due in 2 days.', urgency: 'high' },
  { id: 2, type: 'break', title: 'Light workload tomorrow', reason: 'No deadlines for 3 days. Good for review.', urgency: 'low' },
  { id: 3, type: 'warning', title: 'Deadline conflict detected', reason: 'ENG201 paper + MATH205 set due same day.', urgency: 'medium' },
];

export const WORKLOAD_DATA = [
  { week: 'W1', assignments: 3, quizzes: 1, projects: 0, papers: 0 },
  { week: 'W2', assignments: 2, quizzes: 2, projects: 1, papers: 0 },
  { week: 'W3', assignments: 4, quizzes: 0, projects: 1, papers: 1 },
  { week: 'W4', assignments: 1, quizzes: 3, projects: 0, papers: 0 },
  { week: 'W5', assignments: 5, quizzes: 1, projects: 2, papers: 1 },
  { week: 'W6', assignments: 2, quizzes: 2, projects: 1, papers: 0 },
  { week: 'W7', assignments: 3, quizzes: 0, projects: 0, papers: 2 },
  { week: 'W8', assignments: 4, quizzes: 2, projects: 1, papers: 1 },
];

export const TIMETABLE = [
  { id: 1, course: 'CS301', day: 'Mon', start: '09:00', end: '10:30', room: 'CS 201', color: '#5b8af5' },
  { id: 2, course: 'ENG201', day: 'Mon', start: '14:00', end: '15:30', room: 'HUM 102', color: '#a78bfa' },
  { id: 3, course: 'MATH205', day: 'Tue', start: '10:00', end: '11:30', room: 'MATH 301', color: '#3dd68c' },
  { id: 4, course: 'PHYS101', day: 'Tue', start: '13:00', end: '14:30', room: 'SCI 110', color: '#f5a623' },
  { id: 5, course: 'HIST110', day: 'Wed', start: '09:00', end: '10:30', room: 'LIB 205', color: '#f55b5b' },
  { id: 6, course: 'CS301', day: 'Wed', start: '14:00', end: '15:30', room: 'CS 201', color: '#5b8af5' },
  { id: 7, course: 'MATH205', day: 'Thu', start: '10:00', end: '11:30', room: 'MATH 301', color: '#3dd68c' },
  { id: 8, course: 'PHYS101', day: 'Thu', start: '15:00', end: '16:30', room: 'LAB 202', color: '#f5a623' },
  { id: 9, course: 'ENG201', day: 'Fri', start: '11:00', end: '12:30', room: 'HUM 102', color: '#a78bfa' },
  { id: 10, course: 'HIST110', day: 'Fri', start: '14:00', end: '15:30', room: 'LIB 205', color: '#f55b5b' },
];
