import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from '../../types';

interface Props {
  data: DashboardStats;
}

const COLORS: Record<string, string> = {
  'On Trip': '#3b82f6',
  Available: '#10b981',
  'In Shop': '#f59e0b',
  Retired: '#94a3b8',
};

export default function FleetStatusChart({ data }: Props) {
  // Derive per-status counts from dashboard stats
  const retired = data.activeVehicles > 0
    ? 0  // activeVehicles excludes retired; retired count not directly in dashboard
    : 0;
  const onTrip = data.activeVehicles - data.availableVehicles - data.vehiclesInMaintenance;

  const chartData = [
    { name: 'On Trip', value: Math.max(0, onTrip) },
    { name: 'Available', value: data.availableVehicles },
    { name: 'In Shop', value: data.vehiclesInMaintenance },
    { name: 'Retired', value: retired },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No fleet data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const num = typeof value === 'number' ? value : 0;
            return [`${num} vehicle${num !== 1 ? 's' : ''}`, name as string] as [string, string];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
