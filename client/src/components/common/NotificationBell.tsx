import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationApi } from '../../api/notifications';
import { formatDateTime } from '../../utils/format';

export default function NotificationBell({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => notificationApi.list({ limit: 8 }).then((r) => r.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = data?.unreadCount ?? 0;

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-navy-500 hover:bg-navy-50"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-navy-100 bg-white shadow-popover">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
            <p className="font-display text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-navy-600 hover:text-navy-900">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data || data.data.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-navy-400">No notifications found.</p>
            ) : (
              data.data.map((n) => (
                <div key={n._id} className={`border-b border-navy-50 px-4 py-3 text-sm ${!n.isRead ? 'bg-navy-50/50' : ''}`}>
                  <p className="font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-navy-500">{n.message}</p>
                  <p className="mt-1 text-xs text-navy-300">{formatDateTime(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          <Link
            to={`${basePath}/notifications`}
            onClick={() => setOpen(false)}
            className="block border-t border-navy-100 px-4 py-2.5 text-center text-sm font-medium text-navy-700 hover:bg-navy-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
