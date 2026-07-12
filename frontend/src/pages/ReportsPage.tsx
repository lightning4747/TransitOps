import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ReportCard from '../components/reports/ReportCard';
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
          {fuelEff.data ? (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-4xl font-bold text-blue-600">
                  {fuelEff.data.fuelEfficiency.toFixed(2)}
                </span>
                <span className="ml-1 text-lg text-slate-500">km/L</span>
                <p className="mt-1 text-sm text-slate-500">Fleet-wide average</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Total Distance</span>
                  <span className="font-semibold text-slate-800">{fuelEff.data.totalDistance.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Total Fuel</span>
                  <span className="font-semibold text-slate-800">{fuelEff.data.totalLiters.toLocaleString()} L</span>
                </div>
              </div>
              {fuelEff.data.totalLiters === 0 && (
                <p className="text-sm text-slate-400 text-center">No fuel logs recorded yet.</p>
              )}
            </div>
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
                  {utilization.data.utilization.toFixed(1)}%
                </span>
                <p className="text-sm text-slate-500">Vehicles currently on trip</p>
              </div>
              {/* Simple utilization bar */}
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(utilization.data.utilization, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                (Vehicles ON_TRIP ÷ Active fleet) × 100
              </p>
            </div>
          )}
        </ReportCard>

        {/* Operational Cost */}
        <ReportCard
          title="Fleet Operational Cost"
          loading={opCost.isLoading}
          error={opCost.isError}
        >
          {opCost.data ? (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-3xl font-bold text-slate-800">
                  {formatCurrency(opCost.data.totalCost)}
                </span>
                <p className="text-sm text-slate-500">Total operational cost</p>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Fuel Cost', value: opCost.data.fuelCost, color: 'text-blue-600' },
                  { label: 'Maintenance Cost', value: opCost.data.maintenanceCost, color: 'text-amber-600' },
                  { label: 'Misc. Expenses', value: opCost.data.expenseCost, color: 'text-purple-600' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
              {/* Stacked bar chart */}
              {opCost.data.totalCost > 0 && (
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart
                    layout="vertical"
                    data={[{
                      name: 'Costs',
                      Fuel: opCost.data.fuelCost,
                      Maintenance: opCost.data.maintenanceCost,
                      Expenses: opCost.data.expenseCost,
                    }]}
                  >
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip formatter={(v: unknown) => formatCurrency(typeof v === 'number' ? v : 0)} />
                    <Bar dataKey="Fuel" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Maintenance" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Expenses" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No cost data available.</p>
          )}
        </ReportCard>

        {/* ROI */}
        <ReportCard title="Vehicle ROI" loading={roi.isLoading} error={roi.isError}>
          {roi.data && (
            <div className="space-y-3">
              <div className="text-center">
                {!roi.data.revenueTracked ? (
                  <>
                    <span className="text-2xl font-semibold text-slate-400">N/A</span>
                    <p className="text-sm text-slate-500 mt-1">Revenue not configured</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add expenses of type "Revenue" to enable ROI tracking.
                    </p>
                  </>
                ) : roi.data.roi !== null ? (
                  <>
                    <span className={`text-4xl font-bold ${roi.data.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {roi.data.roi.toFixed(2)}%
                    </span>
                    <p className="text-sm text-slate-500">Fleet ROI</p>
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Acquisition Cost</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(roi.data.acquisitionCost)}</span>
                </div>
                {roi.data.revenueTracked && (
                  <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Revenue</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(roi.data.revenue)}</span>
                  </div>
                )}
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Fuel + Maintenance</span>
                  <span className="font-semibold text-amber-600">
                    {formatCurrency(roi.data.fuelCost + roi.data.maintenanceCost)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">
                ROI = (Revenue − Fuel − Maintenance) ÷ Acquisition Cost
              </p>
            </div>
          )}
        </ReportCard>
      </div>
    </div>
  );
}
