import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/common/PageHeader';
import DataTable, { type Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MaintenanceLogForm from '../components/maintenance/MaintenanceLogForm';
import { useMaintenanceLogs, useCreateMaintenanceLog, useCloseMaintenanceLog } from '../hooks/useMaintenance';
import { useAuthStore } from '../store/authStore';
import { formatDate, formatCurrency, getAxiosErrorMessage } from '../lib/utils';
import type { MaintenanceLog } from '../types';
import type { CreateMaintenanceInput } from '../api/maintenance';

export default function MaintenancePage() {
  const { hasRole } = useAuthStore();
  const canEdit = hasRole('FLEET_MANAGER');

  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [closingLog, setClosingLog] = useState<MaintenanceLog | null>(null);

  const { data: logs = [], isLoading } = useMaintenanceLogs(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const createMutation = useCreateMaintenanceLog();
  const closeMutation = useCloseMaintenanceLog();

  const handleCreate = async (data: CreateMaintenanceInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Maintenance log created — vehicle is now In Shop');
      setAddOpen(false);
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, 'Failed to create log'));
    }
  };

  const handleClose = async () => {
    if (!closingLog) return;
    try {
      await closeMutation.mutateAsync(closingLog.id);
      toast.success('Maintenance log closed — vehicle is now Available');
      setClosingLog(null);
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, 'Failed to close log'));
    }
  };

  const columns: Column<MaintenanceLog>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      accessor: (m) => (
        <div>
          <p className="font-medium">{m.vehicle?.name ?? m.vehicleId.slice(0, 8)}</p>
          <p className="text-xs text-slate-400">{m.vehicle?.regNumber}</p>
        </div>
      ),
    },
    { key: 'description', header: 'Description', accessor: (m) => <span className="max-w-xs truncate block">{m.description}</span> },
    { key: 'cost', header: 'Cost', accessor: (m) => formatCurrency(m.cost) },
    { key: 'status', header: 'Status', accessor: (m) => <StatusBadge status={m.status} /> },
    { key: 'createdAt', header: 'Created', accessor: (m) => formatDate(m.createdAt), sortable: true },
    { key: 'closedAt', header: 'Closed', accessor: (m) => formatDate(m.closedAt) },
    ...(canEdit
      ? [{
          key: 'actions',
          header: '',
          accessor: (m: MaintenanceLog) =>
            m.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setClosingLog(m); }}
                className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Close Log
              </button>
            ) : null,
        }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Maintenance"
        subtitle="Track vehicle service and repair logs"
        action={
          canEdit ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Log
            </button>
          ) : undefined
        }
      />

      <div>
        <label htmlFor="maint-status" className="sr-only">Filter by status</label>
        <select
          id="maint-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(m) => m.id}
        loading={isLoading}
        emptyMessage="No maintenance logs found."
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Maintenance Log">
        <MaintenanceLogForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!closingLog}
        title="Close this maintenance log?"
        description="This will restore the vehicle to Available status so it can be dispatched again."
        confirmLabel="Close Log"
        onConfirm={handleClose}
        onCancel={() => setClosingLog(null)}
        loading={closeMutation.isPending}
      />
    </div>
  );
}
