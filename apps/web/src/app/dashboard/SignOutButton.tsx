'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
    >
      Sign out
    </button>
  );
}
