import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zr } from '../../lib/form';
import { useVehicles } from '../../hooks/useVehicles';

const schema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.coerce.number().nonnegative('Cost must be 0 or more'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function MaintenanceLogForm({ onSubmit, onCancel }: Props) {
  const { data: allVehicles = [] } = useVehicles();
  const vehicles = allVehicles.filter((v) => v.status !== 'ON_TRIP' && v.status !== 'RETIRED');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zr(schema) });

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="vehicleId" className={labelClass}>Vehicle</label>
        <select id="vehicleId" {...register('vehicleId')} className={fieldClass}>
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.regNumber} — {v.name} ({v.status.replace('_', ' ')})
            </option>
          ))}
        </select>
        {errors.vehicleId && <p className={errorClass} role="alert">{errors.vehicleId.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className={fieldClass}
          placeholder="Engine overhaul, tyre replacement, brake service…"
        />
        {errors.description && <p className={errorClass} role="alert">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="cost" className={labelClass}>Estimated Cost (₹)</label>
        <input id="cost" type="number" min={0} {...register('cost')} className={fieldClass} placeholder="0" />
        {errors.cost && <p className={errorClass} role="alert">{errors.cost.message}</p>}
      </div>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Creating this log will automatically set the vehicle status to <strong>In Shop</strong>.
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? 'Creating…' : 'Create Log'}
        </button>
      </div>
    </form>
  );
}
