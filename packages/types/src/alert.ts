export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertChannel  = 'push' | 'sms' | 'both';
export type AlertStatus   = 'draft' | 'pending' | 'dispatching' | 'sent' | 'failed' | 'cancelled';
export type AlertLocale   = 'en' | 'es';

export interface Alert {
  id: string;
  templateId: string | null;
  severity: AlertSeverity;
  channel: AlertChannel;
  title: string;
  body: string;
  bodyEs: string | null;
  variables: Record<string, string>;
  targetArea: string | null;
  status: AlertStatus;
  dispatchedBy: string | null;
  dispatchedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertInput {
  templateId?: string;
  severity: AlertSeverity;
  channel: AlertChannel;
  title: string;
  body: string;
  bodyEs?: string;
  variables?: Record<string, string>;
  targetArea?: string;
}

export interface DispatchAlertInput {
  alertId: string;
  dispatchedBy: string;
}
