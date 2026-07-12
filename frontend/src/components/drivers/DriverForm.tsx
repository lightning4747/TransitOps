import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zr } from '../../lib/form';
import type { Driver } from '../../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.string().min(1, 'License category is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Driver>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const LICENSE_CATEGORIES = ['LMV', 'HGV', 'MCWG', 'TRANS', 'PSV'];

export default function DriverForm({ defaultValues, onSubmit, onCancel, isEditing }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zr(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      licenseNumber: defaultValues?.licenseNumber ?? '',
      licenseCategory: defaultValues?.licenseCategory ?? '',
      licenseExpiry: defaultValues?.licenseExpiry?.slice(0, 10) ?? '',
      contactNumber: defaultValues?.contactNumber ?? '',
      safetyScore: defaultValues?.safetyScore ?? 100,
    },
  });

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>Full Name</label>
        <input id="name" {...register('name')} className={fieldClass} placeholder="Alex Kumar" />
        {errors.name && <p className={errorClass} role="alert">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="licenseNumber" className={labelClass}>License Number</label>
          <input id="licenseNumber" {...register('licenseNumber')} className={fieldClass} placeholder="TN-DL-001234" />
          {errors.licenseNumber && <p className={errorClass} role="alert">{errors.licenseNumber.message}</p>}
        </div>
        <div>
          <label htmlFor="licenseCategory" className={labelClass}>License Category</label>
          <select id="licenseCategory" {...register('licenseCategory')} className={fieldClass}>
            <option value="">Select…</option>
            {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.licenseCategory && <p className={errorClass} role="alert">{errors.licenseCategory.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="licenseExpiry" className={labelClass}>License Expiry</label>
          <input id="licenseExpiry" type="date" {...register('licenseExpiry')} className={fieldClass} />
          {errors.licenseExpiry && <p className={errorClass} role="alert">{errors.licenseExpiry.message}</p>}
        </div>
        <div>
          <label htmlFor="safetyScore" className={labelClass}>Safety Score (0–100)</label>
          <input id="safetyScore" type="number" min={0} max={100} {...register('safetyScore')} className={fieldClass} />
          {errors.safetyScore && <p className={errorClass} role="alert">{errors.safetyScore.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="contactNumber" className={labelClass}>Contact Number</label>
        <input id="contactNumber" {...register('contactNumber')} className={fieldClass} placeholder="+91-9876543210" />
        {errors.contactNumber && <p className={errorClass} role="alert">{errors.contactNumber.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? 'Saving…' : isEditing ? 'Update Driver' : 'Add Driver'}
        </button>
      </div>
    </form>
  );
}
