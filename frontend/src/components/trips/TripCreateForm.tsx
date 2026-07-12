import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zr } from '../../lib/form';
import { useVehicles } from '../../hooks/useVehicles';
import { useDrivers } from '../../hooks/useDrivers';

const schema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  cargoWeight: z.coerce.number().positive('Cargo weight must be > 0'),
  plannedDistance: z.coerce.number().positive('Distance must be > 0'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function TripCreateForm({ onSubmit, onCancel }: Props) {
  const { data: vehicles = [] } = useVehicles({ dispatchable: true });
  const { data: drivers = [] } = useDrivers({ dispatchable: true });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zr(schema) });

  const selectedVehicleId = watch('vehicleId');
  const cargoWeight = watch('cargoWeight');
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const cargoExceedsCapacity =
    selectedVehicle && cargoWeight > 0 && cargoWeight > selectedVehicle.maxLoadKg;

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="source" className={labelClass}>Source</label>
          <input id="source" {...register('source')} className={fieldClass} placeholder="Chennai" />
          {errors.source && <p className={errorClass} role="alert">{errors.source.message}</p>}
        </div>
        <div>
          <label htmlFor="destination" className={labelClass}>Destination</label>
          <input id="destination" {...register('destination')} className={fieldClass} placeholder="Bangalore" />
          {errors.destination && <p className={errorClass} role="alert">{errors.destination.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="vehicleId" className={labelClass}>Vehicle</label>
        <select id="vehicleId" {...register('vehicleId')} className={fieldClass}>
          <option value="">Select available vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.regNumber} — {v.name} ({v.type}, max {v.maxLoadKg} kg)
            </option>
          ))}
        </select>
        {errors.vehicleId && <p className={errorClass} role="alert">{errors.vehicleId.message}</p>}
        {vehicles.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">No vehicles available for dispatch.</p>
        )}
      </div>

      <div>
        <label htmlFor="driverId" className={labelClass}>Driver</label>
        <select id="driverId" {...register('driverId')} className={fieldClass}>
          <option value="">Select eligible driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.licenseCategory}
            </option>
          ))}
        </select>
        {errors.driverId && <p className={errorClass} role="alert">{errors.driverId.message}</p>}
        {drivers.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">No drivers eligible for dispatch.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cargoWeight" className={labelClass}>Cargo Weight (kg)</label>
          <input id="cargoWeight" type="number" min={1} {...register('cargoWeight')} className={fieldClass} placeholder="500" />
          {errors.cargoWeight && <p className={errorClass} role="alert">{errors.cargoWeight.message}</p>}
          {cargoExceedsCapacity && (
            <p className={errorClass} role="alert">
              Cargo ({cargoWeight} kg) exceeds vehicle capacity ({selectedVehicle!.maxLoadKg} kg)
            </p>
          )}
          {selectedVehicle && !cargoExceedsCapacity && cargoWeight > 0 && (
            <p className="mt-1 text-xs text-emerald-600">
              Within capacity — {selectedVehicle.maxLoadKg - cargoWeight} kg remaining
            </p>
          )}
        </div>
        <div>
          <label htmlFor="plannedDistance" className={labelClass}>Planned Distance (km)</label>
          <input id="plannedDistance" type="number" min={1} {...register('plannedDistance')} className={fieldClass} placeholder="350" />
          {errors.plannedDistance && <p className={errorClass} role="alert">{errors.plannedDistance.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !!cargoExceedsCapacity}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating…' : 'Create Trip'}
        </button>
      </div>
    </form>
  );
}
