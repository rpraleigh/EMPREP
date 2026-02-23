import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface Appt {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  evaluation: 'Evaluation', delivery: 'Delivery', follow_up: 'Follow-up',
};

const STATUS_COLOR: Record<string, string> = {
  requested: '#D97706', confirmed: '#2563EB',
  in_progress: '#059669', completed: '#6B7280', cancelled: '#DC2626',
};

function fmtDate(iso: string | null) {
  if (!iso) return 'Unscheduled';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function CustomerAppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const [appt, setAppt]     = useState<Appt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('appointments')
      .select('id, type, status, scheduled_at, customer_notes, admin_notes, created_at')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setAppt(data as Appt | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <View style={s.center}><ActivityIndicator color="#DC2626" size="large" /></View>;
  if (!appt) return (
    <View style={s.center}>
      <Text style={s.err}>Appointment not found.</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={s.back}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );

  const color = STATUS_COLOR[appt.status] ?? '#6B7280';

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={s.backText}>← Appointments</Text>
      </TouchableOpacity>

      <View style={s.typeRow}>
        <Text style={s.type}>{TYPE_LABEL[appt.type] ?? appt.type}</Text>
        <View style={[s.badge, { backgroundColor: color + '20' }]}>
          <Text style={[s.badgeText, { color }]}>
            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Scheduled</Text>
        <Text style={s.value}>{fmtDate(appt.scheduled_at)}</Text>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Requested</Text>
        <Text style={s.value}>{fmtDate(appt.created_at)}</Text>
      </View>

      {appt.customer_notes && (
        <View style={s.field}>
          <Text style={s.label}>Your notes</Text>
          <Text style={s.value}>{appt.customer_notes}</Text>
        </View>
      )}

      {appt.admin_notes && (
        <View style={[s.field, s.adminBox]}>
          <Text style={s.label}>Notes from our team</Text>
          <Text style={s.value}>{appt.admin_notes}</Text>
        </View>
      )}

      {(appt.status === 'confirmed' || appt.status === 'requested') && (
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            To reschedule or cancel, please call or email our team directly.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: '#F9FAFB' },
  content:  { padding: 20, paddingBottom: 40 },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  err:      { fontSize: 15, color: '#6B7280' },
  backRow:  { marginBottom: 20 },
  backText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
  back:     { fontSize: 14, color: '#DC2626', marginTop: 12 },
  typeRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  type:     { fontSize: 24, fontWeight: '800', color: '#111827' },
  badge:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText:{ fontSize: 13, fontWeight: '700' },
  field:    { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  adminBox: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  label:    { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value:    { fontSize: 15, color: '#111827', lineHeight: 22 },
  infoBox:  { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, marginTop: 10 },
  infoText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
