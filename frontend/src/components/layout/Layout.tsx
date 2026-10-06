import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  Shield,
  User,
  LogOut,
  Bell,
  Menu,
  Stethoscope,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Patients', to: '/patients', icon: Users },
  { label: 'Analysis', to: '/analysis', icon: Activity },
  { label: 'Admin Panel', to: '/admin', icon: Shield, adminOnly: true },
];

const Layout: React.FC<LayoutProps> = ({ children, title = 'Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/signin');
    } catch (err) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={[
        'flex flex-col bg-[#1e293b] border-r border-slate-700/60 h-full',
        mobile ? 'w-full' : 'w-64 flex-shrink-0',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shadow-lg shadow-blue-900/40">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">NEXUS</span>
          <span className="text-lg font-bold text-blue-400 tracking-tight">-Q</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleNavItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    'w-4.5 h-4.5 flex-shrink-0 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                  ].join(' ')}
                  style={{ width: '1.125rem', height: '1.125rem' }}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-slate-700/60 pt-3">
        <NavLink
          to="/profile"
          onClick={() => mobile && setSidebarOpen(false)}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group w-full',
              isActive
                ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
            ].join(' ')
          }
        >
          <User
            className="text-slate-500 group-hover:text-slate-300 flex-shrink-0"
            style={{ width: '1.125rem', height: '1.125rem' }}
          />
          Profile
        </NavLink>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
        >
          <LogOut
            className="text-slate-500 group-hover:text-red-400 flex-shrink-0"
            style={{ width: '1.125rem', height: '1.125rem' }}
          />
          Sign Out
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-slate-800/60">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role ?? 'doctor'}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 bg-[#1e293b] border-b border-slate-700/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-slate-100">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-sm text-slate-300 font-medium">
                {user?.name ?? 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
