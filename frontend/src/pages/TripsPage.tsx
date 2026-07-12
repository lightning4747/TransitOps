import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/common/PageHeader';
import DataTable, { type Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import TripCreateForm from '../components/trips/TripCreateForm';
import TripDetailDrawer from '../components/trips/TripDetailDrawer';
import { useTrips, useCreateTrip } from '../hooks/useTrips';
import { useAuthStore } from '../store/authStore';
import { formatDate, getAxiosErrorMessage } from '../lib/utils';
import type { Trip } from '../types';
import type { CreateTripInput } from '../api/trips';

export default function TripsPage() {
  const { hasRole } = useAuthStore();
  const canCreate = hasRole('FLEET_MANAGER', 'DRIVER');

  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { data: trips = [], isLoading } = useTrips(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const createMutation = useCreateTrip();

  const handleCreate = async (data: CreateTripInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Trip created as Draft');
      setCreateOpen(false);
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, 'Failed to create trip'));
    }
  };

  const columns: Column<Trip>[] = [
    {
      key: 'route',
      header: 'Route',
      accessor: (t) => (
        <span className="font-medium">
          {t.source} <span className="text-slate-400">→</span> {t.destination}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      accessor: (t) => t.vehicle?.regNumber ?? t.vehicleId.slice(0, 8),
    },
    {
      key: 'driver',
      header: 'Driver',
      accessor: (t) => t.driver?.name ?? t.driverId.slice(0, 8),
    },
    {
      key: 'cargoWeight',
      header: 'Cargo',
      accessor: (t) => `${t.cargoWeight} kg`,
    },
    {
      key: 'plannedDistance',
      header: 'Distance',
      accessor: (t) => `${t.plannedDistance} km`,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (t) => formatDate(t.createdAt),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trips"
        subtitle="Create and manage dispatch operations"
        action={
          canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Trip
            </button>
          ) : undefined
        }
      />

      <div>
        <label htmlFor="trip-status" className="sr-only">Filter by status</label>
        <select
          id="trip-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={trips}
        keyExtractor={(t) => t.id}
        loading={isLoading}
        emptyMessage="No trips found. Create your first trip to get started."
        onRowClick={setSelectedTrip}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Trip">
        <TripCreateForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <TripDetailDrawer
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />
    </div>
  );
}
