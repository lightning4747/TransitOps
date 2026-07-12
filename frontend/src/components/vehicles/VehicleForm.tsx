import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zr } from '../../lib/form';
import type { Vehicle } from '../../types';

const schema = z.object({
  regNumber: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Vehicle name is required'),
  type: z.string().min(1, 'Type is required'),
  maxLoadKg: z.coerce.number().positive('Max load must be greater than 0'),
  acquisitionCost: z.coerce.number().nonnegative('Cost must be 0 or greater'),
  region: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Vehicle>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const VEHICLE_TYPES = ['Van', 'Truck', 'Bike', 'Bus', 'SUV', 'Other'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

export default function VehicleForm({ defaultValues, onSubmit, onCancel, isEditing }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zr(schema),
    defaultValues: {
      regNumber: defaultValues?.regNumber ?? '',
      name: defaultValues?.name ?? '',
      type: defaultValues?.type ?? '',
      maxLoadKg: defaultValues?.maxLoadKg ?? undefined,
      acquisitionCost: defaultValues?.acquisitionCost ?? undefined,
      region: defaultValues?.region ?? '',
    },
  });

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="regNumber" className={labelClass}>Registration Number</label>
        <input id="regNumber" {...register('regNumber')} className={fieldClass} placeholder="TN-01-AB-1234" />
        {errors.regNumber && <p className={errorClass} role="alert">{errors.regNumber.message}</p>}
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>Vehicle Name / Model</label>
        <input id="name" {...register('name')} className={fieldClass} placeholder="Van-01" />
        {errors.name && <p className={errorClass} role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="type" className={labelClass}>Type</label>
        <select id="type" {...register('type')} className={fieldClass}>
          <option value="">Select type…</option>
          {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.type && <p className={errorClass} role="alert">{errors.type.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="maxLoadKg" className={labelClass}>Max Load (kg)</label>
          <input id="maxLoadKg" type="number" min={1} {...register('maxLoadKg')} className={fieldClass} placeholder="1000" />
          {errors.maxLoadKg && <p className={errorClass} role="alert">{errors.maxLoadKg.message}</p>}
        </div>
        <div>
          <label htmlFor="acquisitionCost" className={labelClass}>Acquisition Cost (₹)</label>
          <input id="acquisitionCost" type="number" min={0} {...register('acquisitionCost')} className={fieldClass} placeholder="850000" />
          {errors.acquisitionCost && <p className={errorClass} role="alert">{errors.acquisitionCost.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="region" className={labelClass}>Region <span className="text-slate-400">(optional)</span></label>
        <select id="region" {...register('region')} className={fieldClass}>
          <option value="">None</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? 'Saving…' : isEditing ? 'Update Vehicle' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}
