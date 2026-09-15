import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse divide-y divide-navy-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-4 flex-1 rounded bg-navy-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="mb-3 h-3 w-1/2 rounded bg-navy-100" />
      <div className="h-6 w-1/3 rounded bg-navy-100" />
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: typeof Inbox;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="rounded-full bg-navy-50 p-3 text-navy-400">
        <Icon size={22} />
      </span>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-navy-500">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <p className="font-display text-base font-semibold text-danger">Something went wrong</p>
      <p className="max-w-sm text-sm text-navy-500">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}
