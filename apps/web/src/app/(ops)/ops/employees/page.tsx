import { createClient } from '@/lib/supabase-server';
import { listEmployees } from '@rpral/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const params          = await searchParams;
  const includeInactive = params.inactive === '1';

  const employees = await listEmployees(supabase, { includeInactive });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <div className="flex items-center gap-3">
          <Link
            href={includeInactive ? '/ops/employees' : '/ops/employees?inactive=1'}
            className="text-sm text-gray-400 hover:text-gray-200 border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            {includeInactive ? 'Hide inactive' : 'Show inactive'}
          </Link>
          <Link
            href="/ops/employees/new"
            className="bg-blue-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Employee
          </Link>
        </div>
      </div>

      {employees.length === 0 ? (
        <p className="text-gray-500 text-sm">No employees found.</p>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
          {employees.map((emp) => (
            <Link
              key={emp.id}
              href={`/ops/employees/${emp.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-750 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{emp.fullName}</p>
                  {!emp.isActive && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{emp.email}</p>
              </div>
              <p className="text-xs text-gray-500 shrink-0 ml-4">Since {fmtDate(emp.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
