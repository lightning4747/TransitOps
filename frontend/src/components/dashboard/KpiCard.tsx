import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  suffix?: string;
}

export default function KpiCard({ label, value, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', suffix }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
            {suffix && <span className="ml-1 text-base font-semibold text-slate-500">{suffix}</span>}
          </p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
