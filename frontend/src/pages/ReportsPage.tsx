import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ReportCard from '../components/reports/ReportCard';
import RoiTable from '../components/reports/RoiTable';
import { useFuelEfficiency, useUtilization, useOperationalCost, useRoi } from '../hooks/useReports';
import { exportCsv } from '../api/reports';
import { formatCurrency } from '../lib/utils';

export default function ReportsPage() {
  const fuelEff = useFuelEfficiency();
  const utilization = useUtilization();
  const opCost = useOperationalCost();
  const roi = useRoi();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational insights across your fleet"
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Fuel Efficiency */}
        <ReportCard
          title="Fuel Efficiency (km/L)"
          loading={fuelEff.isLoading}
          error={fuelEff.isError}
        >
          {fuelEff.data && fuelEff.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fuelEff.data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="regNumber" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => {
                    const num = typeof val === 'number' ? val : 0;
                    return [`${num.toFixed(2)} km/L`, 'Efficiency'] as [string, string];
                  }}
                />
                <Bar dataKey="efficiency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">No trip data available to calculate efficiency.</p>
          )}
        </ReportCard>

        {/* Fleet Utilization */}
        <ReportCard
          title="Fleet Utilization"
          loading={utilization.isLoading}
          error={utilization.isError}
        >
          {utilization.data && (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-4xl font-bold text-blue-600">
                  {utilization.data.fleetUtilization.toFixed(1)}%
                </span>
                <p className="text-sm text-slate-500">Overall utilization</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'On Trip', value: utilization.data.onTrip, color: 'text-blue-600' },
                  { label: 'Available', value: utilization.data.available, color: 'text-emerald-600' },
                  { label: 'In Shop', value: utilization.data.inShop, color: 'text-amber-600' },
                  { label: 'Retired', value: utilization.data.retired, color: 'text-slate-500' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center">
                Active fleet: {utilization.data.total} vehicles (excl. Retired)
              </p>
            </div>
          )}
        </ReportCard>

        {/* Operational Cost */}
        <ReportCard
          title="Operational Cost per Vehicle"
          loading={opCost.isLoading}
          error={opCost.isError}
        >
          {opCost.data && opCost.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-3">Vehicle</th>
                    <th className="pb-2 pr-3">Fuel</th>
                    <th className="pb-2 pr-3">Maint.</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opCost.data.map((row) => (
                    <tr key={row.vehicleId}>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-slate-800">{row.vehicleName}</p>
                        <p className="text-xs text-slate-400">{row.regNumber}</p>
                      </td>
                      <td className="py-2 pr-3 text-slate-700">{formatCurrency(row.fuelCost)}</td>
                      <td className="py-2 pr-3 text-slate-700">{formatCurrency(row.maintenanceCost)}</td>
                      <td className="py-2 font-semibold text-slate-900">{formatCurrency(row.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No cost data available.</p>
          )}
        </ReportCard>

        {/* ROI */}
        <ReportCard title="Vehicle ROI" loading={roi.isLoading} error={roi.isError}>
          {roi.data && <RoiTable data={roi.data} />}
          <p className="mt-3 text-xs text-slate-400">
            ROI = (Revenue − Fuel − Maintenance) ÷ Acquisition Cost. Revenue tracking is not yet configured.
          </p>
        </ReportCard>
      </div>
    </div>
  );
}
