import type { RoiReport } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface Props {
  data: RoiReport;
}

export default function RoiTable({ data }: Props) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-slate-600">Acquisition Cost</span>
        <span className="font-semibold text-slate-800">{formatCurrency(data.acquisitionCost)}</span>
      </div>
      {data.revenueTracked && (
        <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-slate-600">Revenue</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(data.revenue)}</span>
        </div>
      )}
      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-slate-600">Fuel Cost</span>
        <span className="font-semibold text-blue-600">{formatCurrency(data.fuelCost)}</span>
      </div>
      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-slate-600">Maintenance Cost</span>
        <span className="font-semibold text-amber-600">{formatCurrency(data.maintenanceCost)}</span>
      </div>
      <div className="flex justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold">
        <span className="text-slate-700">ROI</span>
        <span>
          {!data.revenueTracked ? (
            <span className="text-xs text-slate-400 italic font-normal">N/A — revenue not configured</span>
          ) : data.roi !== null ? (
            <span className={data.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {data.roi.toFixed(2)}%
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
      </div>
    </div>
  );
}
