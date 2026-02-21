import { NextResponse, type NextRequest } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { createServerSupabaseClient, createTwilioClient, dispatchAlert, getAlert } from '@rpral/api';

interface Params { params: Promise<{ alertId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { alertId } = await params;
  try {
    const client = createServerSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alert = await getAlert(client, alertId);
    if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const expo   = new Expo();
    const twilio = createTwilioClient();
    const dispatched = await dispatchAlert(client, expo, twilio, alertId, user.id);

    return NextResponse.json(dispatched);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
