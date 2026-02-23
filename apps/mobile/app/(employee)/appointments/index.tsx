import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface Appt {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  customer_profiles: { full_name: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  evaluation: 'Evaluation', delivery: 'Delivery', follow_up: 'Follow-up',
};

const ALL_STATUSES = ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const STATUS_COLOR: Record<string, string> = {
  requested: '#D97706', confirmed: '#2563EB',
  in_progress: '#059669', completed: '#6B7280', cancelled: '#DC2626',
};

function fmtDate(iso: string | null) {
  if (!iso) return 'Unscheduled';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EmployeeAppointments() {
  const router = useRouter();
  const [all, setAll]           = useState<Appt[]>([]);
  const [filter, setFilter]     = useState<string>('active');
  const [loading, setLoading]   = useState(true);
  const [userId, setUserId]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!emp) { setLoading(false); return; }

      const { data } = await supabase
        .from('appointments')
        .select('id, type, status, scheduled_at, customer_profiles(full_name)')
        .eq('employee_id', emp.id)
        .order('scheduled_at', { ascending: true, nullsFirst: false });

      setAll((data ?? []) as Appt[]);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'active'
    ? all.filter((a) => !['completed', 'cancelled'].includes(a.status))
    : all.filter((a) => a.status === filter);

  if (loading) return <View style={s.center}><ActivityIndicator color="#DC2626" size="large" /></View>;

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={s.title}>My Appointments</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={s.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={s.tabsContent}>
        {['active', ...ALL_STATUSES].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, filter === tab && s.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[s.tabText, filter === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>No appointments to show.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const color = STATUS_COLOR[item.status] ?? '#6B7280';
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => router.push(`/(employee)/appointments/${item.id}`)}
              >
                <View style={s.cardRow}>
                  <View style={s.cardInfo}>
                    <Text style={s.cardType}>{TYPE_LABEL[item.type] ?? item.type}</Text>
                    <Text style={s.cardCustomer}>
                      {item.customer_profiles?.full_name ?? 'Unknown customer'}
                    </Text>
                    <Text style={s.cardDate}>{fmtDate(item.scheduled_at)}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: color + '20' }]}>
                    <Text style={[s.badgeText, { color }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page:         { flex: 1, backgroundColor: '#F9FAFB' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:        { fontSize: 22, fontWeight: '800', color: '#111827' },
  signOut:      { fontSize: 13, color: '#9CA3AF' },
  tabs:         { flexGrow: 0, paddingTop: 4 },
  tabsContent:  { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  tab:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  tabActive:    { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  tabText:      { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive:{ color: '#fff' },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo:     { flex: 1, marginRight: 10 },
  cardType:     { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardCustomer: { fontSize: 13, color: '#374151', marginTop: 2 },
  cardDate:     { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  emptyText:    { fontSize: 14, color: '#9CA3AF' },
});
