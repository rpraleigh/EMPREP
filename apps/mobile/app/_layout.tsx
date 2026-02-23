import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  // undefined = loading, null = logged out, Session = logged in
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();
  const rootState = useRootNavigationState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined || !rootState?.key) return;

    if (!session) {
      if (segments[0] !== '(auth)') router.replace('/(auth)/login');
    } else {
      const role = (session.user.app_metadata as Record<string, string>)?.user_role;
      if (role === 'employee' || role === 'admin') {
        if (segments[0] !== '(employee)') router.replace('/(employee)/appointments');
      } else {
        if (segments[0] !== '(customer)') router.replace('/(customer)/dashboard');
      }
    }
  }, [session, segments, rootState?.key]);

  if (session === undefined) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
