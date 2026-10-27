import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-[#EDF4FF] text-[#2166F3] border-[#D0E2FF]';
  let label = status;

  if (norm === 'AVAILABLE') {
    styles = 'bg-[#EAF7F0] text-[#20A875] border-[#B7E7D1]';
    label = 'Available';
  } else if (norm === 'OCCUPIED') {
    styles = 'bg-[#FDEEF0] text-[#E65363] border-[#F9C9CF]';
    label = 'Occupied';
  } else if (norm === 'RESERVED') {
    styles = 'bg-[#FEF7EC] text-[#E09214] border-[#FCE1B6]';
    label = 'Reserved';
  } else if (norm === 'PENDING') {
    styles = 'bg-[#FEF7EC] text-[#E09214] border-[#FCE1B6]';
    label = 'Pending';
  } else if (norm === 'APPROVED') {
    styles = 'bg-[#EAF7F0] text-[#20A875] border-[#B7E7D1]';
    label = 'Approved';
  } else if (norm === 'REJECTED') {
    styles = 'bg-[#FDEEF0] text-[#E65363] border-[#F9C9CF]';
    label = 'Rejected';
  } else if (norm === 'CANCELLED') {
    styles = 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]';
    label = 'Cancelled';
  } else if (norm === 'MAINTENANCE') {
    styles = 'bg-[#FFF8E6] text-[#D97706] border-[#FDE68A]';
    label = 'Maintenance';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${styles} ${className}`}
    >
      {label}
    </span>
  );
};
