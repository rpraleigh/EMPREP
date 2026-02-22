import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { createServerSupabaseClient, createEmployee } from '@rpral/api';
import Link from 'next/link';

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const { error } = await searchParams;

  async function createEmployeeAction(formData: FormData) {
    'use server';
    const admin    = createServerSupabaseClient();
    const fullName = (formData.get('fullName') as string).trim();
    const email    = (formData.get('email')    as string).trim();
    const phone    = (formData.get('phone')    as string).trim() || null;
    const password = (formData.get('password') as string);

    // Create the Supabase auth user with employee role
    const { data, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { user_role: 'employee' },
    });

    if (authError || !data.user) {
      const msg = encodeURIComponent(authError?.message ?? 'Failed to create user');
      redirect(`/ops/employees/new?error=${msg}`);
    }

    // Create the employee profile record
    const employee = await createEmployee(admin, {
      userId:   data.user.id,
      fullName,
      email,
      ...(phone ? { phone } : {}),
    });

    redirect(`/ops/employees/${employee.id}`);
  }

  return (
    <div className="max-w-md">
      <Link href="/ops/employees" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
        ← Employees
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">New Employee</h1>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mb-5 text-sm text-red-300">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={createEmployeeAction}>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <Field label="Full Name *">
            <input
              type="text"
              name="fullName"
              required
              autoComplete="off"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="Email *">
            <input
              type="email"
              name="email"
              required
              autoComplete="off"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              name="phone"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="Temporary Password *">
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Share this with the employee — they can change it after first login.
            </p>
          </Field>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Create Employee
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
