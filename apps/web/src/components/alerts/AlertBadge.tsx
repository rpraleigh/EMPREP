import type { AlertSeverity } from '@rpral/types';

const STYLES: Record<AlertSeverity, string> = {
  info:     'bg-blue-50 text-blue-700 border-blue-200',
  warning:  'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
};

const LABELS: Record<AlertSeverity, string> = {
  info:     'Info',
  warning:  'Warning',
  critical: 'Critical',
};

interface AlertBadgeProps {
  severity: AlertSeverity;
  size?: 'sm' | 'md';
}

export default function AlertBadge({ severity, size = 'sm' }: AlertBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${STYLES[severity]}`}>
      {LABELS[severity]}
    </span>
  );
}
