import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  PalmtreeIcon,
  Clock3,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
} from 'lucide-react';
import Sidebar, { type NavItem } from './Sidebar';
import Header from './Header';

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Employees', to: '/admin/employees', icon: Users },
  { label: 'Attendance', to: '/admin/attendance', icon: CalendarCheck },
  { label: 'Leaves', to: '/admin/leaves', icon: PalmtreeIcon },
  { label: 'Holiday Calendar', to: '/admin/holidays', icon: CalendarDays },
  { label: 'COF', to: '/admin/cof', icon: Clock3 },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
  { label: 'Profile', to: '/admin/profile', icon: UserCircle },
];

const titleMap: Record<string, string> = {
  admin: 'Dashboard',
  employees: 'Employees',
  attendance: 'Attendance Management',
  leaves: 'Leave Management',
  holidays: 'Holiday Calendar',
  cof: 'Compensatory Off',
  reports: 'Reports',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'My Profile',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const segment = location.pathname.split('/')[2] || 'admin';
  const title = titleMap[segment] ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar items={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} basePath="/admin" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
