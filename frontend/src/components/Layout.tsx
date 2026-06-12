import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/users/auth.store';
import { LayoutDashboard, Package, Users, LogOut } from 'lucide-react';
import { cn } from '../lib/cn';

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout() {
    useAuthStore.logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Marketplace</h1>
          <p className="text-xs text-gray-400">Task Manager</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/board" icon={<LayoutDashboard size={17} />} label="Дошка" />
          <NavItem to="/products" icon={<Package size={17} />} label="Товари" />
          {user?.role === 'ADMIN' && (
            <NavItem to="/users" icon={<Users size={17} />} label="Користувачі" />
          )}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{roleLabel(user?.role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 text-sm transition-colors w-full"
          >
            <LogOut size={15} />
            Вийти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    ADMIN: 'Адміністратор',
    MANAGER: 'Менеджер',
    EXECUTOR: 'Виконавець',
  };
  return role ? (map[role] ?? role) : '';
}
