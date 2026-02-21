import { NextResponse, type NextRequest } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { createServerSupabaseClient, pollExpoReceipts } from '@rpral/api';

/**
 * POST /api/alerts/receipts
 * Protected cron endpoint — must include X-Cron-Secret header.
 * Call every 60 seconds via Supabase Edge Function cron or Vercel Cron.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env['CRON_SECRET']) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = createServerSupabaseClient();
    const expo   = new Expo();
    const result = await pollExpoReceipts(client, expo);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
