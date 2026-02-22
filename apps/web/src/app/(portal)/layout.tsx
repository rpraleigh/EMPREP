import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase-server';
import Link from 'next/link';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portal/dashboard" className="font-bold text-lg text-red-600">
            EMPREP
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/portal/dashboard"    className="hover:text-gray-900">Dashboard</Link>
            <Link href="/portal/catalog"      className="hover:text-gray-900">Shop</Link>
            <Link href="/portal/orders"       className="hover:text-gray-900">Orders</Link>
            <Link href="/portal/appointments" className="hover:text-gray-900">Appointments</Link>
            <Link href="/portal/account"      className="hover:text-gray-900">Account</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
