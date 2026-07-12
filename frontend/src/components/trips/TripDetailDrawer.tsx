import { useState } from 'react';
import { X, Navigation, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zr } from '../../lib/form';
import { toast } from 'sonner';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import { useDispatchTrip, useCompleteTrip, useCancelTrip } from '../../hooks/useTrips';
import { formatDate, formatNumber, getAxiosErrorMessage } from '../../lib/utils';
import type { Trip } from '../../types';

const completeSchema = z.object({
  endOdometer: z.coerce.number().positive('End odometer is required'),
  fuelConsumed: z.coerce.number().nonnegative('Fuel consumed is required'),
});

type CompleteFormData = z.infer<typeof completeSchema>;

interface Props {
  trip: Trip | null;
  onClose: () => void;
}

export default function TripDetailDrawer({ trip, onClose }: Props) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const dispatchMutation = useDispatchTrip();
  const completeMutation = useCompleteTrip();
  const cancelMutation = useCancelTrip();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompleteFormData>({ resolver: zr(completeSchema) });

  if (!trip) return null;

  const handleDispatch = async () => {
    try {
      await dispatchMutation.mutateAsync(trip.id);
      toast.success('Trip dispatched — vehicle and driver are now On Trip');
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, 'Failed to dispatch trip'));
    }
  };

  const handleComplete = async (data: CompleteFormData) => {
    try {
      await completeMutation.mutateAsync({ id: trip.id, input: data });
      toast.success('Trip completed — vehicle and driver are now Available');
      setShowCompleteForm(false);
      reset();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, 'Failed to complete trip'));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(trip.id);
      toast.success('Trip cancelled');
      setShowCancelConfirm(false);
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, 'Failed to cancel trip'));
    }
  };

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        aria-label="Trip details"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {trip.source} → {trip.destination}
            </h2>
            <p className="text-xs text-slate-500">Trip ID: {trip.id.slice(0, 8)}…</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={trip.status} />
            <button type="button" onClick={onClose} aria-label="Close drawer" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Trip info */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Route</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Pair label="Source" value={trip.source} />
              <Pair label="Destination" value={trip.destination} />
              <Pair label="Cargo Weight" value={`${trip.cargoWeight} kg`} />
              <Pair label="Planned Distance" value={`${trip.plannedDistance} km`} />
              <Pair label="Created" value={formatDate(trip.createdAt)} />
              {trip.dispatchedAt && <Pair label="Dispatched" value={formatDate(trip.dispatchedAt)} />}
              {trip.completedAt && <Pair label="Completed" value={formatDate(trip.completedAt)} />}
              {trip.cancelledAt && <Pair label="Cancelled" value={formatDate(trip.cancelledAt)} />}
            </dl>
          </section>

          {/* Assignments */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assignments</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Pair label="Vehicle" value={trip.vehicle ? `${trip.vehicle.regNumber} — ${trip.vehicle.name}` : trip.vehicleId} />
              <Pair label="Driver" value={trip.driver?.name ?? trip.driverId} />
            </dl>
          </section>

          {/* Completion data */}
          {trip.status === 'COMPLETED' && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Trip Outcome</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <Pair label="Start Odometer" value={trip.startOdometer != null ? `${trip.startOdometer.toLocaleString()} km` : '—'} />
                <Pair label="End Odometer" value={trip.endOdometer != null ? `${trip.endOdometer.toLocaleString()} km` : '—'} />
                <Pair label="Fuel Consumed" value={trip.fuelConsumed != null ? `${formatNumber(trip.fuelConsumed)} L` : '—'} />
                {trip.endOdometer && trip.startOdometer && trip.fuelConsumed && (
                  <Pair
                    label="Actual Efficiency"
                    value={`${formatNumber((trip.endOdometer - trip.startOdometer) / trip.fuelConsumed)} km/L`}
                  />
                )}
              </dl>
            </section>
          )}

          {/* Complete form */}
          {showCompleteForm && (
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Complete Trip</h3>
              <form onSubmit={handleSubmit(handleComplete)} className="space-y-3">
                <div>
                  <label htmlFor="endOdometer" className={labelClass}>End Odometer (km)</label>
                  <input id="endOdometer" type="number" {...register('endOdometer')} className={fieldClass} />
                  {errors.endOdometer && <p className={errorClass} role="alert">{errors.endOdometer.message}</p>}
                </div>
                <div>
                  <label htmlFor="fuelConsumed" className={labelClass}>Fuel Consumed (L)</label>
                  <input id="fuelConsumed" type="number" step="0.1" {...register('fuelConsumed')} className={fieldClass} />
                  {errors.fuelConsumed && <p className={errorClass} role="alert">{errors.fuelConsumed.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCompleteForm(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                    {isSubmitting ? 'Completing…' : 'Confirm Complete'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Action buttons */}
        <div className="border-t border-slate-200 p-4">
          {trip.status === 'DRAFT' && (
            <button
              type="button"
              onClick={handleDispatch}
              disabled={dispatchMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Navigation className="h-4 w-4" />
              {dispatchMutation.isPending ? 'Dispatching…' : 'Dispatch Trip'}
            </button>
          )}

          {trip.status === 'DISPATCHED' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCompleteForm(true)}
                disabled={showCompleteForm}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                Complete
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel Trip
              </button>
            </div>
          )}

          {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
            <p className="text-center text-sm text-slate-400">This trip is {trip.status.toLowerCase()}.</p>
          )}
        </div>
      </aside>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel this trip?"
        description="This will restore the vehicle and driver to Available status. This action cannot be undone."
        confirmLabel="Cancel Trip"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
        loading={cancelMutation.isPending}
      />
    </>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
