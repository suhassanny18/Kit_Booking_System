import React from 'react';

interface MoneyDisplayProps {
  paise: number;
  className?: string;
  showSign?: boolean;
}

export const formatRupees = (paise: number, showSign = false): string => {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = (absPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (showSign) {
    return isNegative ? `-₹${rupees}` : `+₹${rupees}`;
  }
  return isNegative ? `-₹${rupees}` : `₹${rupees}`;
};

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ paise, className = '', showSign = false }) => {
  const isNegative = paise < 0;
  const textClass = isNegative ? 'text-rose-400' : 'text-emerald-400';

  return (
    <span className={`font-mono font-semibold tracking-tight ${className || textClass}`}>
      {formatRupees(paise, showSign)}
    </span>
  );
};
