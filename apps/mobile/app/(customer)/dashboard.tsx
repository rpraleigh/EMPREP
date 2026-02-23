import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

interface SupplyRow {
  id: string;
  quantity: number;
  expires_at: string | null;
  supply_items: { name: string; sku: string } | null;
}

interface AppointmentRow {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  customer_notes: string | null;
}

function expiryStatus(expiresAt: string | null): 'expired' | 'soon' | 'ok' | 'none' {
  if (!expiresAt) return 'none';
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return 'expired';
  if (days < 90) return 'soon';
  return 'ok';
}

function fmtDate(iso: string | null) {
  if (!iso) return 'Unscheduled';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtType(t: string) {
  return { evaluation: 'Evaluation', delivery: 'Delivery', follow_up: 'Follow-up' }[t] ?? t;
}

function fmtStatus(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

const STATUS_COLOR: Record<string, string> = {
  requested: '#D97706', confirmed: '#2563EB',
  in_progress: '#059669', completed: '#6B7280', cancelled: '#DC2626',
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [supplies, setSupplies]       = useState<SupplyRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profResp, suppliesResp, apptResp] = await Promise.all([
      supabase.from('customer_profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('customer_supplies')
        .select('id, quantity, expires_at, supply_items(name, sku)')
        .eq('customer_id', user.id)
        .order('expires_at', { ascending: true, nullsFirst: false })
        .limit(5),
      supabase
        .from('appointments')
        .select('id, type, status, scheduled_at, customer_notes')
        .eq('customer_id', user.id)
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'cancelled')
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(3),
    ]);

    setProfileName((profResp.data as { full_name: string } | null)?.full_name ?? null);
    setSupplies((suppliesResp.data ?? []) as SupplyRow[]);
    setAppointments((apptResp.data ?? []) as AppointmentRow[]);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const expiredCount = supplies.filter((s) => expiryStatus(s.expires_at) === 'expired').length;
  const soonCount    = supplies.filter((s) => expiryStatus(s.expires_at) === 'soon').length;

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#DC2626" size="large" /></View>;
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.brand}>EMPREP</Text>
          <Text style={s.welcome}>Hello{profileName ? `, ${profileName.split(' ')[0]}` : ''}!</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={s.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Supply summary */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Your Supplies</Text>
        {supplies.length === 0 ? (
          <Text style={s.empty}>No supplies tracked yet. Book an evaluation to get started.</Text>
        ) : (
          <>
            {(expiredCount > 0 || soonCount > 0) && (
              <View style={s.alertBox}>
                <Text style={s.alertText}>
                  {expiredCount > 0 && `${expiredCount} item${expiredCount > 1 ? 's' : ''} expired. `}
                  {soonCount > 0 && `${soonCount} item${soonCount > 1 ? 's' : ''} expiring within 90 days.`}
                </Text>
              </View>
            )}
            {supplies.map((sup) => {
              const status = expiryStatus(sup.expires_at);
              const dotColor = status === 'expired' ? '#DC2626' : status === 'soon' ? '#D97706' : '#059669';
              return (
                <View key={sup.id} style={s.row}>
                  <View style={[s.dot, { backgroundColor: dotColor }]} />
                  <Text style={s.rowName} numberOfLines={1}>{sup.supply_items?.name ?? 'Unknown item'}</Text>
                  <Text style={s.rowQty}>×{sup.quantity}</Text>
                </View>
              );
            })}
          </>
        )}
      </View>

      {/* Upcoming appointments */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Upcoming Appointments</Text>
        {appointments.length === 0 ? (
          <Text style={s.empty}>No upcoming appointments.</Text>
        ) : (
          appointments.map((appt) => (
            <TouchableOpacity
              key={appt.id}
              style={s.apptRow}
              onPress={() => router.push(`/(customer)/appointments/${appt.id}`)}
            >
              <View style={s.apptInfo}>
                <Text style={s.apptType}>{fmtType(appt.type)}</Text>
                <Text style={s.apptDate}>{fmtDate(appt.scheduled_at)}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: (STATUS_COLOR[appt.status] ?? '#6B7280') + '20' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[appt.status] ?? '#6B7280' }]}>
                  {fmtStatus(appt.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={s.outlineBtn} onPress={() => router.push('/(customer)/appointments')}>
          <Text style={s.outlineBtnText}>View all appointments</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: '#F9FAFB' },
  content:     { padding: 20, paddingBottom: 40 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  brand:       { fontSize: 20, fontWeight: '800', color: '#DC2626' },
  welcome:     { fontSize: 15, color: '#6B7280', marginTop: 2 },
  signOut:     { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  alertBox:    { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertText:   { fontSize: 13, color: '#92400E' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dot:         { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  rowName:     { flex: 1, fontSize: 14, color: '#374151' },
  rowQty:      { fontSize: 13, color: '#9CA3AF' },
  apptRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  apptInfo:    { flex: 1 },
  apptType:    { fontSize: 14, fontWeight: '600', color: '#111827' },
  apptDate:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { fontSize: 12, fontWeight: '600' },
  empty:       { fontSize: 13, color: '#9CA3AF', lineHeight: 20 },
  outlineBtn:  { marginTop: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  outlineBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
});
