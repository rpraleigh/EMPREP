import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import OpsLoginForm from './OpsLoginForm';

export default async function OpsLoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/ops/dashboard');

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">EMPREP</h1>
          <p className="text-sm text-gray-400 mt-1">Staff Portal</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
          <OpsLoginForm />
        </div>
        <p className="text-center mt-6 text-sm text-gray-500">
          Customer?{' '}
          <Link href="/login" className="text-gray-400 hover:text-gray-200 underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
