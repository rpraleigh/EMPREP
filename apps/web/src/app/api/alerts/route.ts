import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient, createAlert, listAlerts } from '@rpral/api';
import type { CreateAlertInput } from '@rpral/types';

export async function GET(request: NextRequest) {
  try {
    const client = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? '1');
    const alerts = await listAlerts(client, { page, pageSize: 20 });
    return NextResponse.json(alerts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = createServerSupabaseClient();
    const body = (await request.json()) as CreateAlertInput;
    const alert = await createAlert(client, body);
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
