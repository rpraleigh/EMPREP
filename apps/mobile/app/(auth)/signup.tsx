import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function SignupScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSignup() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else setDone(true);
  }

  if (done) {
    return (
      <View style={s.center}>
        <Text style={s.brand}>EMPREP</Text>
        <Text style={s.checkTitle}>Check your email</Text>
        <Text style={s.checkBody}>
          We sent a confirmation link to {email}.{'\n'}
          Tap it to activate your account, then sign in.
        </Text>
        <Link href="/(auth)/login" style={s.backLink}>← Back to sign in</Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>EMPREP</Text>
        <Text style={s.subtitle}>Emergency Preparedness</Text>

        <Text style={s.title}>Create account</Text>

        <TextInput
          style={s.input}
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={s.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignup} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Create Account</Text>
          }
        </TouchableOpacity>

        <Link href="/(auth)/login" style={s.link}>
          Already have an account? Sign in
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: '#F9FAFB' },
  container:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  center:     { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  brand:      { fontSize: 32, fontWeight: '800', color: '#DC2626', textAlign: 'center' },
  subtitle:   { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 40 },
  title:      { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#111827', marginBottom: 12,
  },
  btn:        { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  link:       { color: '#6B7280', textAlign: 'center', marginTop: 24, fontSize: 14 },
  checkTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 16 },
  checkBody:  { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  backLink:   { color: '#DC2626', marginTop: 32, fontSize: 14 },
});
