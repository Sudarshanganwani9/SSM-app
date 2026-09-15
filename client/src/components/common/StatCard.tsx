import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'plum' | 'brass';
  hint?: string;
}

const accentMap: Record<string, string> = {
  navy: 'bg-navy-50 text-navy-700',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
  plum: 'bg-plum-light text-plum',
  brass: 'bg-brass-50 text-brass-600',
};

export default function StatCard({ label, value, icon: Icon, accent = 'navy', hint }: StatCardProps) {
  return (
    <div className="card flex items-start justify-between gap-3 p-5">
      <div>
        <p className="text-sm text-navy-500">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
      </div>
      <span className={`rounded-md p-2.5 ${accentMap[accent]}`}>
        <Icon size={20} strokeWidth={2} />
      </span>
    </div>
  );
}
