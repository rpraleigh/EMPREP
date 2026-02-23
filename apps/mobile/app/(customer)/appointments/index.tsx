import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface Appt {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  customer_notes: string | null;
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomerAppointments() {
  const router = useRouter();
  const [appts, setAppts]   = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('appointments')
        .select('id, type, status, scheduled_at, customer_notes')
        .eq('customer_id', user.id)
        .order('scheduled_at', { ascending: false, nullsFirst: true });
      setAppts((data ?? []) as Appt[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#DC2626" size="large" /></View>;
  }

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={s.title}>Appointments</Text>
      </View>
      {appts.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>No appointments yet</Text>
          <Text style={s.emptyBody}>Contact us to schedule your first evaluation.</Text>
        </View>
      ) : (
        <FlatList
          data={appts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const color = STATUS_COLOR[item.status] ?? '#6B7280';
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => router.push(`/(customer)/appointments/${item.id}`)}
              >
                <View style={s.cardRow}>
                  <View>
                    <Text style={s.cardType}>{TYPE_LABEL[item.type] ?? item.type}</Text>
                    <Text style={s.cardDate}>{fmtDate(item.scheduled_at)}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: color + '20' }]}>
                    <Text style={[s.badgeText, { color }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                {item.customer_notes && (
                  <Text style={s.notes} numberOfLines={1}>{item.customer_notes}</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: '#F9FAFB' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title:      { fontSize: 22, fontWeight: '800', color: '#111827' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', textAlign: 'center' },
  emptyBody:  { fontSize: 13, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardDate:   { fontSize: 12, color: '#6B7280', marginTop: 3 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:  { fontSize: 12, fontWeight: '600' },
  notes:      { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
});
