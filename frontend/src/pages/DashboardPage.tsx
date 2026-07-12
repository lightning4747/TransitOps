import { useState } from 'react';
import { Truck, CheckCircle, Wrench, MapPin, Clock, Users, Activity } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import FleetStatusChart from '../components/dashboard/FleetStatusChart';
import FilterBar from '../components/dashboard/FilterBar';
import { useDashboard } from '../hooks/useDashboard';
import { useUtilization } from '../hooks/useReports';
import type { DashboardFilters } from '../api/dashboard';

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data: stats, isLoading } = useDashboard(filters);
  const { data: utilization } = useUtilization();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Fleet operations overview</p>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          label="Active Vehicles"
          value={isLoading ? '—' : (stats?.activeVehicles ?? 0)}
          icon={Truck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard
          label="Available Vehicles"
          value={isLoading ? '—' : (stats?.availableVehicles ?? 0)}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="In Maintenance"
          value={isLoading ? '—' : (stats?.vehiclesInMaintenance ?? 0)}
          icon={Wrench}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Active Trips"
          value={isLoading ? '—' : (stats?.activeTrips ?? 0)}
          icon={MapPin}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <KpiCard
          label="Pending Trips"
          value={isLoading ? '—' : (stats?.pendingTrips ?? 0)}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <KpiCard
          label="Drivers on Duty"
          value={isLoading ? '—' : (stats?.driversOnDuty ?? 0)}
          icon={Users}
          iconColor="text-pink-600"
          iconBg="bg-pink-50"
        />
        <KpiCard
          label="Fleet Utilization"
          value={isLoading ? '—' : (stats?.fleetUtilization ?? 0)}
          suffix="%"
          icon={Activity}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Fleet Status Breakdown</h2>
          {utilization ? (
            <FleetStatusChart data={utilization} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Loading chart…
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Stats</h2>
          {stats && (
            <div className="space-y-3">
              {[
                { label: 'Fleet Utilization', value: `${stats.fleetUtilization}%`, color: 'bg-blue-600' },
                {
                  label: 'Availability Rate',
                  value: `${stats.activeVehicles > 0 ? Math.round((stats.availableVehicles / stats.activeVehicles) * 100) : 0}%`,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Maintenance Rate',
                  value: `${stats.activeVehicles > 0 ? Math.round((stats.vehiclesInMaintenance / stats.activeVehicles) * 100) : 0}%`,
                  color: 'bg-amber-500',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: item.value }}
                      role="progressbar"
                      aria-valuenow={parseInt(item.value)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
