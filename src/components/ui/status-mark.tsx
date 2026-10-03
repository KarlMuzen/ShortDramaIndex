import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { VerificationStatus } from '@/src/data/types';

export interface StatusMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: VerificationStatus;
  size?: 'sm' | 'md';
  customLabel?: string;
  showIcon?: boolean;
}

export function StatusMark({
  status,
  size = 'md',
  customLabel,
  showIcon = true,
  className,
  ...props
}: StatusMarkProps) {
  let label = customLabel;
  let icon = null;
  let styleClasses = '';

  if (status === 'verified') {
    label = label || 'Verified';
    icon = <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />;
    styleClasses = 'bg-[var(--status-verified-bg)] text-[var(--status-verified)] border border-[var(--status-verified)]/20';
  } else if (status === 'pending') {
    label = label || 'Pending review';
    icon = <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />;
    styleClasses = 'bg-[var(--status-pending-bg)] text-[var(--status-pending)] border border-[var(--status-pending)]/20';
  } else {
    // Disputed
    label = label || 'Disputed';
    icon = <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />;
    styleClasses = 'bg-[var(--status-disputed-bg)] text-[var(--crimson)] border border-[var(--crimson)]';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[12px] px-2 py-0.5 gap-1.5'
      : 'text-[13px] px-2.5 py-1 gap-2';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[8px] font-normal leading-none select-none shrink-0',
        sizeClasses,
        styleClasses,
        className
      )}
      role="status"
      {...props}
    >
      {showIcon && icon}
      <span className="font-medium">{label}</span>
    </span>
  );
}
