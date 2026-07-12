import { useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/common/PageHeader';
import DataTable, { type Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import DriverForm from '../components/drivers/DriverForm';
import LicenseExpiryBadge from '../components/drivers/LicenseExpiryBadge';
import { useDrivers, useCreateDriver, useUpdateDriver } from '../hooks/useDrivers';
import { useAuthStore } from '../store/authStore';
import type { Driver } from '../types';
import type { CreateDriverInput } from '../api/drivers';

export default function DriversPage() {
  const { hasRole } = useAuthStore();
  const canEdit = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const { data: drivers = [], isLoading } = useDrivers(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();

  const filtered = drivers.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (data: CreateDriverInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Driver added successfully');
      setAddOpen(false);
    } catch {
      toast.error('Failed to add driver');
    }
  };

  const handleUpdate = async (data: CreateDriverInput) => {
    if (!editDriver) return;
    try {
      await updateMutation.mutateAsync({ id: editDriver.id, input: data });
      toast.success('Driver updated');
      setEditDriver(null);
    } catch {
      toast.error('Failed to update driver');
    }
  };

  const columns: Column<Driver>[] = [
    { key: 'name', header: 'Name', accessor: (d) => <span className="font-medium">{d.name}</span>, sortable: true },
    { key: 'licenseNumber', header: 'License No.', accessor: (d) => <span className="font-mono text-xs">{d.licenseNumber}</span> },
    { key: 'licenseCategory', header: 'Category', accessor: (d) => d.licenseCategory },
    { key: 'licenseExpiry', header: 'Expiry', accessor: (d) => <LicenseExpiryBadge licenseExpiry={d.licenseExpiry} /> },
    { key: 'contactNumber', header: 'Contact', accessor: (d) => d.contactNumber },
    {
      key: 'safetyScore',
      header: 'Safety Score',
      accessor: (d) => (
        <span className={d.safetyScore >= 80 ? 'text-emerald-600 font-semibold' : d.safetyScore >= 50 ? 'text-amber-600 font-semibold' : 'text-red-600 font-semibold'}>
          {d.safetyScore}
        </span>
      ),
    },
    { key: 'status', header: 'Status', accessor: (d) => <StatusBadge status={d.status} /> },
    ...(canEdit
      ? [{
          key: 'actions',
          header: '',
          accessor: (d: Driver) => (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditDriver(d); }}
              aria-label={`Edit ${d.name}`}
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
        title="Drivers"
        subtitle="Manage driver profiles and compliance"
        action={
          canEdit ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search drivers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search drivers"
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(d) => d.id}
        loading={isLoading}
        emptyMessage="No drivers found."
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Driver">
        <DriverForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal open={!!editDriver} onClose={() => setEditDriver(null)} title="Edit Driver">
        {editDriver && (
          <DriverForm
            defaultValues={editDriver}
            onSubmit={handleUpdate}
            onCancel={() => setEditDriver(null)}
            isEditing
          />
        )}
      </Modal>
    </div>
  );
}
