import { cn } from '../../lib/utils';
import type { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '../../types';

type AnyStatus = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus;

const statusConfig: Record<AnyStatus, { label: string; className: string }> = {
  // Vehicle
  AVAILABLE: { label: 'Available', className: 'bg-emerald-100 text-emerald-800' },
  ON_TRIP: { label: 'On Trip', className: 'bg-blue-100 text-blue-800' },
  IN_SHOP: { label: 'In Shop', className: 'bg-amber-100 text-amber-800' },
  RETIRED: { label: 'Retired', className: 'bg-slate-100 text-slate-600' },
  // Driver extras
  OFF_DUTY: { label: 'Off Duty', className: 'bg-slate-100 text-slate-600' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-800' },
  // Trip
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
  DISPATCHED: { label: 'Dispatched', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  // Maintenance
  ACTIVE: { label: 'Active', className: 'bg-amber-100 text-amber-800' },
  CLOSED: { label: 'Closed', className: 'bg-emerald-100 text-emerald-800' },
};

interface Props {
  status: AnyStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
