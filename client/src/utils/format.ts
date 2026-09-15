import { format, parseISO, isValid } from 'date-fns';

export function formatDate(value?: string | Date | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '--';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '--';
  return format(date, pattern);
}

export function formatTime(value?: string | Date | null): string {
  if (!value) return '--';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '--';
  return format(date, 'hh:mm a');
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '--';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '--';
  return format(date, 'dd MMM yyyy, hh:mm a');
}

export function formatMinutesAsDuration(minutes?: number | null): string {
  if (minutes === undefined || minutes === null) return '--';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}
