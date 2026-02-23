import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Switch,
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
  customer_profiles: { full_name: string; email: string } | null;
}

interface VisitRecord {
  id: string;
  summary: string | null;
  recommendations: string | null;
  follow_up_needed: boolean;
  follow_up_interval: string | null;
  completed_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  evaluation: 'Evaluation', delivery: 'Delivery', follow_up: 'Follow-up',
};

const STATUS_COLOR: Record<string, string> = {
  requested: '#D97706', confirmed: '#2563EB',
  in_progress: '#059669', completed: '#6B7280', cancelled: '#DC2626',
};

const FOLLOW_UP_INTERVALS: { label: string; value: string }[] = [
  { label: '3 months', value: '3months' },
  { label: '6 months', value: '6months' },
  { label: '1 year',   value: '1year' },
];

function fmtDate(iso: string | null) {
  if (!iso) return 'Unscheduled';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function EmployeeAppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [appt, setAppt]           = useState<Appt | null>(null);
  const [visitRecord, setVisitRecord] = useState<VisitRecord | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Form state
  const [summary, setSummary]           = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpNeeded, setFollowUpNeeded]   = useState(false);
  const [followUpInterval, setFollowUpInterval] = useState<string>('6months');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [apptResp, visitResp] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, type, status, scheduled_at, customer_notes, admin_notes, customer_profiles(full_name, email)')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('visit_records')
          .select('id, summary, recommendations, follow_up_needed, follow_up_interval, completed_at')
          .eq('appointment_id', id)
          .maybeSingle(),
      ]);
      setAppt(apptResp.data as Appt | null);
      setVisitRecord(visitResp.data as VisitRecord | null);
      setLoading(false);
    })();
  }, [id]);

  async function handleStartVisit() {
    if (!appt) return;
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', appt.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setAppt({ ...appt, status: 'in_progress' });
  }

  async function handleCompleteVisit() {
    if (!appt || !summary.trim()) {
      Alert.alert('Required', 'Please add a visit summary before completing.');
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Get employee id
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!emp) { Alert.alert('Error', 'Employee profile not found.'); setSaving(false); return; }

    // Create visit record
    const { data: vr, error: vrErr } = await supabase
      .from('visit_records')
      .insert({
        appointment_id:     appt.id,
        employee_id:        emp.id,
        summary:            summary.trim(),
        recommendations:    recommendations.trim() || null,
        follow_up_needed:   followUpNeeded,
        follow_up_interval: followUpNeeded ? followUpInterval : null,
      })
      .select()
      .single();

    if (vrErr) { Alert.alert('Error', vrErr.message); setSaving(false); return; }

    // Mark appointment completed
    await supabase
      .from('appointments')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', appt.id);

    setVisitRecord(vr as VisitRecord);
    setAppt({ ...appt, status: 'completed' });
    setSaving(false);
    Alert.alert('Visit completed', 'The visit record has been saved.');
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#DC2626" size="large" /></View>;
  if (!appt)   return (
    <View style={s.center}>
      <Text style={s.err}>Appointment not found.</Text>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.backLink}>← Go back</Text></TouchableOpacity>
    </View>
  );

  const statusColor = STATUS_COLOR[appt.status] ?? '#6B7280';
  const canStart    = appt.status === 'confirmed';
  const canComplete = appt.status === 'in_progress' && !visitRecord;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={s.backText}>← Appointments</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.customer}>{appt.customer_profiles?.full_name ?? 'Unknown customer'}</Text>
          <Text style={s.type}>{TYPE_LABEL[appt.type] ?? appt.type}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[s.badgeText, { color: statusColor }]}>
            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={s.card}>
        <Row label="Scheduled"     value={fmtDate(appt.scheduled_at)} />
        {appt.customer_profiles?.email && <Row label="Email" value={appt.customer_profiles.email} />}
        {appt.customer_notes && <Row label="Customer notes" value={appt.customer_notes} />}
        {appt.admin_notes    && <Row label="Admin notes"    value={appt.admin_notes} />}
      </View>

      {/* Start visit CTA */}
      {canStart && (
        <TouchableOpacity style={s.startBtn} onPress={handleStartVisit}>
          <Text style={s.startBtnText}>Start Visit</Text>
        </TouchableOpacity>
      )}

      {/* Visit completion form */}
      {canComplete && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Complete Visit</Text>

          <Text style={s.fieldLabel}>Visit Summary *</Text>
          <TextInput
            style={[s.input, s.multiline]}
            placeholder="Describe what was assessed, delivered, or serviced…"
            placeholderTextColor="#9CA3AF"
            value={summary}
            onChangeText={setSummary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={s.fieldLabel}>Recommendations</Text>
          <TextInput
            style={[s.input, s.multiline]}
            placeholder="Any follow-up items or recommendations for the customer…"
            placeholderTextColor="#9CA3AF"
            value={recommendations}
            onChangeText={setRecommendations}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={s.switchRow}>
            <Text style={s.fieldLabel}>Schedule follow-up?</Text>
            <Switch
              value={followUpNeeded}
              onValueChange={setFollowUpNeeded}
              trackColor={{ true: '#DC2626' }}
            />
          </View>

          {followUpNeeded && (
            <>
              <Text style={s.fieldLabel}>Follow-up interval</Text>
              <View style={s.intervalRow}>
                {FOLLOW_UP_INTERVALS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.intervalBtn, followUpInterval === opt.value && s.intervalBtnActive]}
                    onPress={() => setFollowUpInterval(opt.value)}
                  >
                    <Text style={[s.intervalBtnText, followUpInterval === opt.value && s.intervalBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={[s.completeBtn, saving && s.btnDisabled]} onPress={handleCompleteVisit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.completeBtnText}>Complete Visit</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Completed visit record */}
      {visitRecord && (
        <View style={[s.card, s.completedCard]}>
          <Text style={s.sectionTitle}>Visit Record</Text>
          {visitRecord.summary && <Row label="Summary"         value={visitRecord.summary} />}
          {visitRecord.recommendations && <Row label="Recommendations" value={visitRecord.recommendations} />}
          <Row label="Follow-up needed" value={visitRecord.follow_up_needed ? `Yes — ${visitRecord.follow_up_interval ?? ''}` : 'No'} />
          <Row label="Completed"        value={fmtDate(visitRecord.completed_at)} />
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={r.row}>
      <Text style={r.label}>{label}</Text>
      <Text style={r.value}>{value}</Text>
    </View>
  );
}

const r = StyleSheet.create({
  row:   { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 14, color: '#111827', lineHeight: 20 },
});

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: '#F9FAFB' },
  content:           { padding: 20, paddingBottom: 48 },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  err:               { fontSize: 15, color: '#6B7280' },
  backRow:           { marginBottom: 20 },
  backText:          { fontSize: 14, color: '#DC2626', fontWeight: '600' },
  backLink:          { fontSize: 14, color: '#DC2626', marginTop: 12 },
  headerRow:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  customer:          { fontSize: 20, fontWeight: '800', color: '#111827' },
  type:              { fontSize: 14, color: '#6B7280', marginTop: 2 },
  badge:             { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginLeft: 10, alignSelf: 'flex-start' },
  badgeText:         { fontSize: 13, fontWeight: '700' },
  card:              { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  completedCard:     { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  startBtn:          { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  startBtnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  section:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  sectionTitle:      { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  fieldLabel:        { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
  },
  multiline:         { minHeight: 90, paddingTop: 10 },
  switchRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  intervalRow:       { flexDirection: 'row', gap: 8, marginTop: 6 },
  intervalBtn:       { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#F9FAFB' },
  intervalBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  intervalBtnText:   { fontSize: 13, fontWeight: '600', color: '#374151' },
  intervalBtnTextActive: { color: '#fff' },
  completeBtn:       { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  completeBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled:       { opacity: 0.6 },
});
