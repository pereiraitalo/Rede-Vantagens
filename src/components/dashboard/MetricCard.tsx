import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'indigo';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50/70',
      iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
      border: 'border-blue-200/80',
      text: 'text-blue-900',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
      border: 'border-emerald-200/80',
      text: 'text-emerald-900',
    },
    amber: {
      bg: 'bg-amber-50/70',
      iconBg: 'bg-amber-600 text-white shadow-amber-500/20',
      border: 'border-amber-200/80',
      text: 'text-amber-900',
    },
    purple: {
      bg: 'bg-purple-50/70',
      iconBg: 'bg-purple-600 text-white shadow-purple-500/20',
      border: 'border-purple-200/80',
      text: 'text-purple-900',
    },
    rose: {
      bg: 'bg-rose-50/70',
      iconBg: 'bg-rose-600 text-white shadow-rose-500/20',
      border: 'border-rose-200/80',
      text: 'text-rose-900',
    },
    slate: {
      bg: 'bg-slate-50/70',
      iconBg: 'bg-slate-700 text-white shadow-slate-500/20',
      border: 'border-slate-200/80',
      text: 'text-slate-900',
    },
    indigo: {
      bg: 'bg-indigo-50/70',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
      border: 'border-indigo-200/80',
      text: 'text-indigo-900',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border ${colorStyles.border} bg-white shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">{subtitle}</p>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-2xl ${colorStyles.iconBg} flex items-center justify-center shadow-md flex-shrink-0`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
