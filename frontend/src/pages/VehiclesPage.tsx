import { useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/common/PageHeader';
import DataTable, { type Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import VehicleForm from '../components/vehicles/VehicleForm';
import { useVehicles, useCreateVehicle, useUpdateVehicle } from '../hooks/useVehicles';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../lib/utils';
import type { Vehicle } from '../types';
import type { CreateVehicleInput } from '../api/vehicles';

export default function VehiclesPage() {
  const { hasRole } = useAuthStore();
  const canEdit = hasRole('FLEET_MANAGER');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading } = useVehicles(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();

  const filtered = vehicles.filter((v) => {
    const matchSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.regNumber.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || v.type === typeFilter;
    return matchSearch && matchType;
  });

  const vehicleTypes = [...new Set(vehicles.map((v) => v.type))].sort();

  const handleCreate = async (data: CreateVehicleInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Vehicle added successfully');
      setAddOpen(false);
    } catch (e) {
      toast.error('Failed to add vehicle');
    }
  };

  const handleUpdate = async (data: CreateVehicleInput) => {
    if (!editVehicle) return;
    try {
      await updateMutation.mutateAsync({ id: editVehicle.id, input: data });
      toast.success('Vehicle updated');
      setEditVehicle(null);
    } catch (e) {
      toast.error('Failed to update vehicle');
    }
  };

  const columns: Column<Vehicle>[] = [
    { key: 'regNumber', header: 'Reg Number', accessor: (v) => <span className="font-mono text-xs font-semibold">{v.regNumber}</span>, sortable: true },
    { key: 'name', header: 'Name', accessor: (v) => v.name, sortable: true },
    { key: 'type', header: 'Type', accessor: (v) => v.type },
    { key: 'maxLoadKg', header: 'Max Load', accessor: (v) => `${v.maxLoadKg.toLocaleString()} kg` },
    { key: 'odometer', header: 'Odometer', accessor: (v) => `${v.odometer.toLocaleString()} km` },
    { key: 'acquisitionCost', header: 'Acq. Cost', accessor: (v) => formatCurrency(v.acquisitionCost) },
    { key: 'region', header: 'Region', accessor: (v) => v.region ?? '—' },
    { key: 'status', header: 'Status', accessor: (v) => <StatusBadge status={v.status} /> },
    ...(canEdit
      ? [{
          key: 'actions',
          header: '',
          accessor: (v: Vehicle) => (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditVehicle(v); }}
              aria-label={`Edit ${v.name}`}
              className="rounded p-1 text-slate-400 hover:text-blue-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vehicles"
        subtitle="Manage your fleet registry"
        action={
          canEdit ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search vehicles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search vehicles"
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by type"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All types</option>
          {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(v) => v.id}
        loading={isLoading}
        emptyMessage="No vehicles found. Add your first vehicle to get started."
      />

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Vehicle">
        <VehicleForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle">
        {editVehicle && (
          <VehicleForm
            defaultValues={editVehicle}
            onSubmit={handleUpdate}
            onCancel={() => setEditVehicle(null)}
            isEditing
          />
        )}
      </Modal>
    </div>
  );
}
