import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../api/notifications';
import { formatDateTime } from '../../utils/format';
import { CardSkeleton, EmptyState } from '../../components/common/States';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', page],
    queryFn: () => notificationApi.list({ page, limit: 15 }).then((r) => r.data),
  });

  async function markRead(id: string) {
    await notificationApi.markRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markAllRead() {
    await notificationApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-500">{data?.unreadCount ?? 0} unread</p>
        <button type="button" onClick={markAllRead} className="btn-secondary text-sm">
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {!data || data.data.length === 0 ? (
        <div className="card">
          <EmptyState icon={Bell} title="No notifications yet" description="You'll see updates on leave, attendance, and COF here." />
        </div>
      ) : (
        <div className="card divide-y divide-navy-100">
          {data.data.map((n) => (
            <div key={n._id} className={`flex items-start justify-between gap-3 px-5 py-4 ${!n.isRead ? 'bg-navy-50/40' : ''}`}>
              <div>
                <p className="font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-navy-600">{n.message}</p>
                <p className="mt-1 text-xs text-navy-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button type="button" onClick={() => markRead(n._id)} className="shrink-0 text-xs font-medium text-navy-600 hover:text-navy-900">
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.pagination.pages > 1 && (
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <button className="btn-secondary" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
