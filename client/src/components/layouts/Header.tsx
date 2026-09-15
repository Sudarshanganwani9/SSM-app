import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, User as UserIcon, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import { initials } from '../../utils/format';

interface HeaderProps {
  title: string;
  basePath: string;
  onMenuClick: () => void;
}

export default function Header({ title, basePath, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-100 bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-navy-600 hover:bg-navy-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell basePath={basePath} />
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-navy-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
              {initials(user?.fullName)}
            </span>
            <span className="hidden text-sm font-medium text-ink sm:block">{user?.fullName}</span>
            <ChevronDown size={16} className="hidden text-navy-400 sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-52 rounded-lg border border-navy-100 bg-white py-1 shadow-popover">
              <Link
                to={`${basePath}/profile`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-navy-50"
              >
                <UserIcon size={16} /> My Profile
              </Link>
              <Link
                to={`${basePath}/settings`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-navy-50"
              >
                <SettingsIcon size={16} /> Settings
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-light"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
