import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/portal/dashboard');

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-600">EMPREP</h1>
          <p className="text-sm text-gray-500 mt-1">Emergency Preparedness</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <LoginForm />
        </div>
        <p className="text-center mt-6 text-sm text-gray-400">
          Staff?{' '}
          <a href="/ops/login" className="text-gray-500 hover:text-gray-700 underline">
            Staff login
          </a>
        </p>
      </div>
    </main>
  );
}
