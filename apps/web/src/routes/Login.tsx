import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../api/client.js';
import { useLogin, useRegister } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.js';
import { Field } from '../components/ui/Field.js';

type Mode = 'login' | 'register';

export function LoginRoute() {
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    try {
      if (mode === 'login') {
        await login.mutateAsync({ email, password });
      } else {
        await register.mutateAsync({
          email,
          password,
          name: String(form.get('name')),
          orgName: String(form.get('orgName')),
        });
      }
      navigate('/projects');
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Something went wrong',
      );
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 font-serif text-2xl text-white shadow-sm">
            ب
          </span>
          <div className="space-y-1">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-900">
              Basira
            </h1>
            <p className="text-sm text-ink-700">
              {mode === 'login'
                ? 'Sign in to your workspace'
                : 'Create a new organization'}
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-ink-100 bg-white p-6 shadow-card"
        >
          {mode === 'register' && (
            <>
              <Field label="Organization name" name="orgName" required />
              <Field label="Your name" name="name" required />
            </>
          )}
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field
            label="Password"
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-700">
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button
            type="button"
            className="font-medium text-ink-900 underline"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
