import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zr } from '../lib/form';
import PageHeader from '../components/common/PageHeader';
import DataTable, { type Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useFuelLogs, useCreateFuelLog, useExpenses, useCreateExpense } from '../hooks/useFuelExpenses';
import { useVehicles } from '../hooks/useVehicles';
import { formatDate, formatCurrency } from '../lib/utils';
import type { FuelLog, Expense } from '../types';

// ─── Fuel Log Form ────────────────────────────────────────────────────────────
const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  liters: z.coerce.number().positive('Must be > 0'),
  cost: z.coerce.number().nonnegative('Must be >= 0'),
  date: z.string().min(1, 'Date is required'),
});

type FuelFormData = z.infer<typeof fuelSchema>;

interface VehicleOption { id: string; regNumber: string; name: string; }

function FuelLogForm({ vehicles, onSubmit, onCancel }: { vehicles: VehicleOption[]; onSubmit: (d: FuelFormData) => Promise<void>; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FuelFormData>({
    resolver: zr(fuelSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });
  const f = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const l = 'mb-1 block text-sm font-medium text-slate-700';
  const e = 'mt-1 text-xs text-red-600';
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="fl-vehicle" className={l}>Vehicle</label>
        <select id="fl-vehicle" {...register('vehicleId')} className={f}>
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
        </select>
        {errors.vehicleId && <p className={e} role="alert">{errors.vehicleId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fl-liters" className={l}>Liters</label>
          <input id="fl-liters" type="number" step="0.1" {...register('liters')} className={f} />
          {errors.liters && <p className={e} role="alert">{errors.liters.message}</p>}
        </div>
        <div>
          <label htmlFor="fl-cost" className={l}>Total Cost (₹)</label>
          <input id="fl-cost" type="number" {...register('cost')} className={f} />
          {errors.cost && <p className={e} role="alert">{errors.cost.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="fl-date" className={l}>Date</label>
        <input id="fl-date" type="date" {...register('date')} className={f} />
        {errors.date && <p className={e} role="alert">{errors.date.message}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? 'Saving…' : 'Add Fuel Log'}</button>
      </div>
    </form>
  );
}

// ─── Expense Form ─────────────────────────────────────────────────────────────
const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.string().min(1, 'Type is required'),
  amount: z.coerce.number().nonnegative('Must be >= 0'),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const EXPENSE_TYPES = ['Toll', 'Parking', 'Fine', 'Cleaning', 'Other'];

function ExpenseForm({ vehicles, onSubmit, onCancel }: { vehicles: VehicleOption[]; onSubmit: (d: ExpenseFormData) => Promise<void>; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpenseFormData>({
    resolver: zr(expenseSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });
  const f = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const l = 'mb-1 block text-sm font-medium text-slate-700';
  const e = 'mt-1 text-xs text-red-600';
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="ex-vehicle" className={l}>Vehicle</label>
        <select id="ex-vehicle" {...register('vehicleId')} className={f}>
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
        </select>
        {errors.vehicleId && <p className={e} role="alert">{errors.vehicleId.message}</p>}
      </div>
      <div>
        <label htmlFor="ex-type" className={l}>Expense Type</label>
        <select id="ex-type" {...register('type')} className={f}>
          <option value="">Select type…</option>
          {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.type && <p className={e} role="alert">{errors.type.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ex-amount" className={l}>Amount (₹)</label>
          <input id="ex-amount" type="number" {...register('amount')} className={f} />
          {errors.amount && <p className={e} role="alert">{errors.amount.message}</p>}
        </div>
        <div>
          <label htmlFor="ex-date" className={l}>Date</label>
          <input id="ex-date" type="date" {...register('date')} className={f} />
          {errors.date && <p className={e} role="alert">{errors.date.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? 'Saving…' : 'Add Expense'}</button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FuelExpensesPage() {
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const { data: vehicles = [] } = useVehicles();
  const { data: fuelLogs = [], isLoading: fuelLoading } = useFuelLogs();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();

  const createFuelMutation = useCreateFuelLog();
  const createExpenseMutation = useCreateExpense();

  const vehicleOptions: VehicleOption[] = vehicles.map((v) => ({
    id: v.id,
    regNumber: v.regNumber,
    name: v.name,
  }));

  const handleFuel = async (data: FuelFormData) => {
    await createFuelMutation.mutateAsync(data);
    toast.success('Fuel log added');
    setFuelOpen(false);
  };

  const handleExpense = async (data: ExpenseFormData) => {
    await createExpenseMutation.mutateAsync(data);
    toast.success('Expense added');
    setExpenseOpen(false);
  };

  const fuelColumns: Column<FuelLog>[] = [
    { key: 'vehicle', header: 'Vehicle', accessor: (fl) => fl.vehicle?.regNumber ?? fl.vehicleId.slice(0, 8) },
    { key: 'liters', header: 'Liters', accessor: (fl) => `${fl.liters} L` },
    { key: 'cost', header: 'Cost', accessor: (fl) => formatCurrency(fl.cost) },
    { key: 'costPerLiter', header: '₹/L', accessor: (fl) => (fl.liters > 0 ? `₹${(fl.cost / fl.liters).toFixed(2)}` : '—') },
    { key: 'date', header: 'Date', accessor: (fl) => formatDate(fl.date), sortable: true },
  ];

  const expenseColumns: Column<Expense>[] = [
    { key: 'vehicle', header: 'Vehicle', accessor: (ex) => ex.vehicle?.regNumber ?? ex.vehicleId.slice(0, 8) },
    { key: 'type', header: 'Type', accessor: (ex) => ex.type },
    { key: 'amount', header: 'Amount', accessor: (ex) => formatCurrency(ex.amount) },
    { key: 'date', header: 'Date', accessor: (ex) => formatDate(ex.date), sortable: true },
  ];

  const totalFuel = fuelLogs.reduce((s, fl) => s + fl.cost, 0);
  const totalExpenses = expenses.reduce((s, ex) => s + ex.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fuel & Expenses"
        subtitle="Track operational costs per vehicle"
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => setFuelOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Fuel Log
            </button>
            <button type="button" onClick={() => setExpenseOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Expense
            </button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Fuel Cost</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalFuel)}</p>
          <p className="text-xs text-slate-400">{fuelLogs.length} entries</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Expenses</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-slate-400">{expenses.length} entries</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {(['fuel', 'expenses'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'fuel' ? 'Fuel Logs' : 'Expenses'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'fuel' ? (
        <DataTable columns={fuelColumns} data={fuelLogs} keyExtractor={(fl) => fl.id} loading={fuelLoading} emptyMessage="No fuel logs yet." />
      ) : (
        <DataTable columns={expenseColumns} data={expenses} keyExtractor={(ex) => ex.id} loading={expensesLoading} emptyMessage="No expenses yet." />
      )}

      <Modal open={fuelOpen} onClose={() => setFuelOpen(false)} title="Add Fuel Log">
        <FuelLogForm vehicles={vehicleOptions} onSubmit={handleFuel} onCancel={() => setFuelOpen(false)} />
      </Modal>

      <Modal open={expenseOpen} onClose={() => setExpenseOpen(false)} title="Add Expense">
        <ExpenseForm vehicles={vehicleOptions} onSubmit={handleExpense} onCancel={() => setExpenseOpen(false)} />
      </Modal>
    </div>
  );
}
