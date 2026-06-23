import { type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ROLES, type Role } from '@basira/shared';
import { adminApi } from '../api/admin.js';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.js';
import { Field } from '../components/ui/Field.js';

export function AdminRoute() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin'] });

  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.listUsers });
  const seats = useQuery({ queryKey: ['admin', 'seats'], queryFn: adminApi.seats });
  const audit = useQuery({ queryKey: ['admin', 'audit'], queryFn: adminApi.audit });

  const create = useMutation({ mutationFn: adminApi.createUser, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (v: { id: string; role?: Role; disabled?: boolean }) =>
      adminApi.updateUser(v.id, { role: v.role, disabled: v.disabled }),
    onSuccess: invalidate,
  });

  if (user && user.role !== 'admin') {
    return <p className="text-ink-700">Admins only.</p>;
  }

  function addUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create.mutate(
      {
        email: String(f.get('email')),
        name: String(f.get('name')),
        role: f.get('role') as Role,
        password: String(f.get('password')),
      },
      { onSuccess: () => (e.target as HTMLFormElement).reset?.() },
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        {seats.data && (
          <span className="text-sm text-ink-700">
            Seats: {seats.data.used} / {seats.data.seatLimit}
          </span>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-700">
          Users
        </h2>
        <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase text-ink-700">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.id} className="border-t border-ink-100">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        update.mutate({ id: u.id, role: e.target.value as Role })
                      }
                      className="rounded border border-ink-100 px-1 py-0.5 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        update.mutate({ id: u.id, disabled: !u.disabled })
                      }
                      className="text-xs text-ink-700 hover:underline"
                    >
                      {u.disabled ? 'Disabled — enable' : 'Active — disable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={addUser}
          className="grid items-end gap-3 rounded-lg border border-ink-100 bg-white p-4 shadow-sm sm:grid-cols-5"
        >
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <label className="block space-y-1">
            <span className="text-sm font-medium text-ink-700">Role</span>
            <select
              name="role"
              defaultValue="editor"
              className="w-full rounded-md border border-ink-100 px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <Field label="Password" name="password" type="password" required minLength={8} />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add user'}
          </Button>
        </form>
        {create.isError && (
          <p className="text-sm text-red-600">Could not add user (seat limit or duplicate email).</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-700">
          Audit log
        </h2>
        <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100 bg-white text-sm shadow-sm">
          {audit.data?.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-3 py-2">
              <span>
                <span className="font-medium">{a.action}</span>{' '}
                <span className="text-ink-700">
                  {a.targetType}:{a.targetId.slice(0, 8)}
                </span>
              </span>
              <span className="text-xs text-ink-700">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {audit.data?.length === 0 && (
            <li className="px-3 py-2 text-ink-700">No audit entries.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
