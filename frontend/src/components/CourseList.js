import { COURSES } from '../utils/mockData';

const CourseList = ({ tasks = [] }) => {
  const courseTaskCounts = {};
  tasks.forEach((t) => {
    const course = t.title?.split(' - ')[0] || 'Other';
    if (!courseTaskCounts[course]) courseTaskCounts[course] = { total: 0, completed: 0 };
    courseTaskCounts[course].total++;
    if (t.status === 'completed') courseTaskCounts[course].completed++;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Courses</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{COURSES.length} enrolled</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSES.map((course) => (
          <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-2" style={{ backgroundColor: course.color }} />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{course.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.professor}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{course.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  {Math.floor(Math.random() * 5) + 2} tasks left
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;
