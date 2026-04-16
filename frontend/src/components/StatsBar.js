const StatsBar = ({ stats }) => {
  if (!stats) return null;

  const items = [
    { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-800' },
    { label: 'Pending', value: stats.pending, color: 'bg-blue-100 text-blue-800' },
    { label: 'High', value: stats.highPriority, color: 'bg-red-100 text-red-800' },
    { label: 'Medium', value: stats.mediumPriority, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Done', value: stats.completed, color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-4">
      {items.map((item) => (
        <div key={item.label} className={`${item.color} rounded-xl p-3 text-center`}>
          <p className="text-2xl font-bold">{item.value}</p>
          <p className="text-xs font-medium mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
