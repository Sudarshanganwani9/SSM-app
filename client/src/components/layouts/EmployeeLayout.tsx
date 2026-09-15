import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle,
  CalendarCheck,
  FilePlus,
  ListChecks,
  CalendarDays,
  Clock3,
  Bell,
  Settings,
} from 'lucide-react';
import Sidebar, { type NavItem } from './Sidebar';
import Header from './Header';

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/employee', icon: LayoutDashboard },
  { label: 'My Profile', to: '/employee/profile', icon: UserCircle },
  { label: 'Attendance', to: '/employee/attendance', icon: CalendarCheck },
  { label: 'Apply Leave', to: '/employee/apply-leave', icon: FilePlus },
  { label: 'My Leaves', to: '/employee/my-leaves', icon: ListChecks },
  { label: 'Holiday Calendar', to: '/employee/holidays', icon: CalendarDays },
  { label: 'COF', to: '/employee/cof', icon: Clock3 },
  { label: 'Notifications', to: '/employee/notifications', icon: Bell },
  { label: 'Settings', to: '/employee/settings', icon: Settings },
];

const titleMap: Record<string, string> = {
  employee: 'Dashboard',
  profile: 'My Profile',
  attendance: 'My Attendance',
  'apply-leave': 'Apply Leave',
  'my-leaves': 'My Leaves',
  holidays: 'Holiday Calendar',
  cof: 'Compensatory Off',
  notifications: 'Notifications',
  settings: 'Settings',
};

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const segment = location.pathname.split('/')[2] || 'employee';
  const title = titleMap[segment] ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar items={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} basePath="/employee" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
