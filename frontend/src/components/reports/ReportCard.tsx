import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: boolean;
}

export default function ReportCard({ title, children, loading, error }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">Failed to load data.</p>
      ) : (
        children
      )}
    </div>
  );
}
