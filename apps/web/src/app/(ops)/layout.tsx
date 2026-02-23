import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/ops/login');

  // Role check via JWT claim
  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string | undefined;
  if (role !== 'admin' && role !== 'employee') redirect('/portal/dashboard');

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">EMPREP Ops</span>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/ops/dashboard"     className="hover:text-white">Dashboard</Link>
            <Link href="/ops/appointments"  className="hover:text-white">Appointments</Link>
            {isAdmin && (
              <>
                <Link href="/ops/orders"     className="hover:text-white">Orders</Link>
                <Link href="/ops/customers"  className="hover:text-white">Customers</Link>
                <Link href="/ops/catalog"    className="hover:text-white">Catalog</Link>
                <Link href="/ops/employees"  className="hover:text-white">Employees</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
