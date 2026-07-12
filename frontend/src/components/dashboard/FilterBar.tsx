import type { DashboardFilters } from '../../api/dashboard';

interface Props {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const vehicleTypes = ['', 'Van', 'Truck', 'Bike'];
const statuses = ['', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const regions = ['', 'North', 'South', 'East', 'West'];

export default function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Dashboard filters">
      <div>
        <label htmlFor="filter-type" className="sr-only">Vehicle Type</label>
        <select
          id="filter-type"
          value={filters.vehicleType ?? ''}
          onChange={(e) => onChange({ ...filters, vehicleType: e.target.value || undefined })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All types</option>
          {vehicleTypes.slice(1).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-status" className="sr-only">Status</label>
        <select
          id="filter-status"
          value={filters.status ?? ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All statuses</option>
          {statuses.slice(1).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-region" className="sr-only">Region</label>
        <select
          id="filter-region"
          value={filters.region ?? ''}
          onChange={(e) => onChange({ ...filters, region: e.target.value || undefined })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All regions</option>
          {regions.slice(1).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
