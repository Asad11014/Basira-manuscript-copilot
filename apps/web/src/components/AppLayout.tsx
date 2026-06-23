import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '../hooks/useAuth.js';
import { Button } from './ui/Button.js';

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-2.5 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100',
  ].join(' ');
}

/** Shell with top nav for authenticated pages. */
export function AppLayout() {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-ink-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-5">
            <Link to="/projects" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 font-serif text-lg text-white shadow-sm">
                ب
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif text-lg font-semibold tracking-tight text-ink-900">
                  Basira
                </span>
                <span className="text-[11px] text-ink-700">
                  Manuscript Copilot
                </span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/projects" className={navClass}>
                Projects
              </NavLink>
              <NavLink to="/search" className={navClass}>
                Search
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={navClass}>
                  Admin
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-ink-700 sm:inline">
                {user.name}{' '}
                <span className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-700">
                  {user.role}
                </span>
              </span>
            )}
            <Button
              variant="ghost"
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => navigate('/login'),
                })
              }
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
