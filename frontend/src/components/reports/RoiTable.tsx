import type { RoiReport } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface Props {
  data: RoiReport[];
}

export default function RoiTable({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No vehicle data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="pb-2 pr-4">Vehicle</th>
            <th className="pb-2 pr-4">Acq. Cost</th>
            <th className="pb-2 pr-4">Fuel + Maint.</th>
            <th className="pb-2">ROI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr key={row.vehicleId}>
              <td className="py-2 pr-4">
                <p className="font-medium text-slate-800">{row.vehicleName}</p>
                <p className="text-xs text-slate-400">{row.regNumber}</p>
              </td>
              <td className="py-2 pr-4 text-slate-700">{formatCurrency(row.acquisitionCost)}</td>
              <td className="py-2 pr-4 text-slate-700">
                {formatCurrency(row.fuelCost + row.maintenanceCost)}
              </td>
              <td className="py-2">
                {!row.revenueTracked ? (
                  <span className="text-xs text-slate-400 italic">N/A — revenue not configured</span>
                ) : row.roi !== null ? (
                  <span className={row.roi >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                    {(row.roi * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
