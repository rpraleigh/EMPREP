import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient, getAlert } from '@rpral/api';

interface Params { params: Promise<{ alertId: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { alertId } = await params;
  try {
    const client = createServerSupabaseClient();
    const alert = await getAlert(client, alertId);
    if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(alert);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
