import type { AlertSeverity, AlertChannel, AlertLocale } from './alert';

export interface AlertTemplate {
  id: string;
  name: string;
  severity: AlertSeverity;
  locale: AlertLocale;
  subject: string;
  body: string;
  channel: AlertChannel;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  severity: AlertSeverity;
  locale?: AlertLocale;
  subject: string;
  body: string;
  channel?: AlertChannel;
}

export interface ResolvedTemplate {
  subject: string;
  body: string;
  locale: AlertLocale;
  severity: AlertSeverity;
  channel: AlertChannel;
}
