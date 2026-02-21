'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Expo } from 'expo-server-sdk';
import {
  createServerSupabaseClient,
  createAlert,
  dispatchAlert,
  cancelAlert,
  createTemplate,
  updateTemplate,
} from '@rpral/api';
import { createTwilioClient } from '@rpral/api';
import type { AlertSeverity, AlertChannel, AlertLocale } from '@rpral/types';

function getServiceClients() {
  const client = createServerSupabaseClient();
  const expo = new Expo();
  const twilio = createTwilioClient();
  return { client, expo, twilio };
}

export async function createAndDispatchAlert(formData: FormData): Promise<void> {
  const { client, expo, twilio } = getServiceClients();

  const bodyEs     = (formData.get('body_es')     as string) || undefined;
  const targetArea = (formData.get('target_area') as string) || undefined;
  const templateId = (formData.get('template_id') as string) || undefined;

  const alert = await createAlert(client, {
    severity: formData.get('severity') as AlertSeverity,
    channel:  formData.get('channel')  as AlertChannel,
    title:    formData.get('title')    as string,
    body:     formData.get('body')     as string,
    ...(bodyEs     !== undefined && { bodyEs }),
    ...(targetArea !== undefined && { targetArea }),
    ...(templateId !== undefined && { templateId }),
  });

  // Retrieve the dispatching user's ID from the Supabase session
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await dispatchAlert(client, expo, twilio, alert.id, user.id);

  revalidatePath('/dashboard/alerts');
  redirect(`/dashboard/alerts/${alert.id}`);
}

export async function dispatchExistingAlert(alertId: string): Promise<void> {
  const { client, expo, twilio } = getServiceClients();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await dispatchAlert(client, expo, twilio, alertId, user.id);
  revalidatePath('/dashboard/alerts');
  revalidatePath(`/dashboard/alerts/${alertId}`);
}

export async function cancelExistingAlert(alertId: string): Promise<void> {
  const { client } = getServiceClients();
  await cancelAlert(client, alertId);
  revalidatePath('/dashboard/alerts');
  revalidatePath(`/dashboard/alerts/${alertId}`);
}

export async function upsertAlertTemplate(formData: FormData): Promise<void> {
  const { client } = getServiceClients();
  const id = formData.get('id') as string | null;

  const input = {
    name:     formData.get('name')     as string,
    severity: formData.get('severity') as AlertSeverity,
    locale:   (formData.get('locale')  as AlertLocale) ?? 'en',
    subject:  formData.get('subject')  as string,
    body:     formData.get('body')     as string,
    channel:  (formData.get('channel') as AlertChannel) ?? 'both',
  };

  if (id) {
    await updateTemplate(client, id, input);
  } else {
    await createTemplate(client, input);
  }

  revalidatePath('/dashboard/alerts/templates');
  redirect('/dashboard/alerts/templates');
}
