import React from 'react';
import { BookingStatus, Tier, ReturnCondition } from '../../domain/enums';

interface StatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }[size];

  // Colors per status enum
  const statusStyles: Record<BookingStatus, string> = {
    [BookingStatus.REQUESTED]: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    [BookingStatus.NEGOTIATING]: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    [BookingStatus.APPROVED]: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    [BookingStatus.PICKED_UP]: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    [BookingStatus.RETURNED]: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    [BookingStatus.COMPLETED]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    [BookingStatus.REJECTED]: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    [BookingStatus.CANCELLED]: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wider ${sizeClasses} ${statusStyles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const TierBadge: React.FC<{ tier: Tier }> = ({ tier }) => {
  const styles: Record<Tier, string> = {
    [Tier.PREMIUM]: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    [Tier.STANDARD]: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    [Tier.BUDGET]: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[tier]}`}
    >
      {tier}
    </span>
  );
};

export const ConditionBadge: React.FC<{ condition: ReturnCondition }> = ({ condition }) => {
  const styles: Record<ReturnCondition, string> = {
    [ReturnCondition.PRISTINE]: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    [ReturnCondition.GOOD]: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    [ReturnCondition.FAIR]: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    [ReturnCondition.DAMAGED]: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[condition]}`}
    >
      {condition}
    </span>
  );
};
