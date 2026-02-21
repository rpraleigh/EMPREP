import type { SupabaseClient } from '@supabase/supabase-js';
import type { AlertLocale, AlertSeverity } from '@rpral/types';
import type { AlertTemplate, CreateTemplateInput, ResolvedTemplate } from '@rpral/types';

/** Replace {{key}} placeholders in a template string with values from the variables map. */
export function interpolateTemplate(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

/**
 * Resolve a named template for the given locale, substituting variables.
 * Falls back to 'en' if no template exists for the requested locale.
 */
export async function resolveTemplate(
  client: SupabaseClient,
  name: string,
  locale: AlertLocale,
  variables: Record<string, string> = {},
): Promise<ResolvedTemplate> {
  const { data, error } = await client
    .from('alert_templates')
    .select('*')
    .eq('name', name)
    .eq('locale', locale)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    if (locale !== 'en') {
      return resolveTemplate(client, name, 'en', variables);
    }
    throw new Error(`Alert template not found: "${name}" (${locale})`);
  }

  return {
    subject: interpolateTemplate(data.subject as string, variables),
    body: interpolateTemplate(data.body as string, variables),
    locale: data.locale as AlertLocale,
    severity: data.severity as AlertSeverity,
    channel: data.channel as AlertTemplate['channel'],
  };
}

export async function createTemplate(
  client: SupabaseClient,
  input: CreateTemplateInput,
): Promise<AlertTemplate> {
  const { data, error } = await client
    .from('alert_templates')
    .insert({
      name: input.name,
      severity: input.severity,
      locale: input.locale ?? 'en',
      subject: input.subject,
      body: input.body,
      channel: input.channel ?? 'both',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return toTemplate(data);
}

export async function listTemplates(
  client: SupabaseClient,
  filters?: { severity?: AlertSeverity; locale?: AlertLocale; isActive?: boolean },
): Promise<AlertTemplate[]> {
  let query = client.from('alert_templates').select('*').order('name');

  if (filters?.severity !== undefined) query = query.eq('severity', filters.severity);
  if (filters?.locale !== undefined) query = query.eq('locale', filters.locale);
  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list templates: ${error.message}`);
  return (data ?? []).map(toTemplate);
}

export async function updateTemplate(
  client: SupabaseClient,
  id: string,
  updates: Partial<CreateTemplateInput>,
): Promise<AlertTemplate> {
  const { data, error } = await client
    .from('alert_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update template: ${error.message}`);
  return toTemplate(data);
}

function toTemplate(row: Record<string, unknown>): AlertTemplate {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    severity: row['severity'] as AlertSeverity,
    locale: row['locale'] as AlertLocale,
    subject: row['subject'] as string,
    body: row['body'] as string,
    channel: row['channel'] as AlertTemplate['channel'],
    isActive: row['is_active'] as boolean,
    createdBy: (row['created_by'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}
