import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import SignOutButton from './SignOutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <span className="text-white font-bold text-lg">EMPREP</span>
          <p className="text-gray-400 text-xs mt-0.5">Ops Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard/alerts">Alerts</NavLink>
          <NavLink href="/dashboard/alerts/templates">Templates</NavLink>
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <p className="text-gray-400 text-xs truncate mb-2">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
