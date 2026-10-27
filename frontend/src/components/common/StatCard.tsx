import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-[#EDF4FF]',
  iconTextColor = 'text-[#2166F3]',
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#E1E8F0] p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-lg ${iconBgColor} ${iconTextColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#718096] truncate">{title}</p>
        <p className="text-[22px] font-bold text-[#17243B] leading-tight tracking-tight">{value}</p>
      </div>
    </div>
  );
};
