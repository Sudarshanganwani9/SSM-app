import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { holidayApi } from '../../api/holidays';
import { formatDate } from '../../utils/format';
import { CardSkeleton, EmptyState } from '../../components/common/States';
import Badge from '../../components/common/Badge';

const typeMeta: Record<string, string> = {
  NATIONAL: 'bg-navy-100 text-navy-700',
  REGIONAL: 'bg-info-light text-info',
  COMPANY: 'bg-brass-100 text-brass-700',
  OPTIONAL: 'bg-plum-light text-plum',
};

export default function EmployeeHolidays() {
  const year = new Date().getFullYear();
  const { data, isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidayApi.list({ year }).then((r) => r.data.data),
  });

  const today = new Date();
  const upcoming = (data ?? []).filter((h) => new Date(h.date) >= today);
  const past = (data ?? []).filter((h) => new Date(h.date) < today);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Upcoming holidays</h2>
        {upcoming.length === 0 ? (
          <div className="card"><EmptyState icon={CalendarDays} title="No upcoming holidays" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((h) => (
              <div key={h._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{h.name}</p>
                    <p className="text-sm text-navy-500">{formatDate(h.date, 'EEEE, dd MMM yyyy')}</p>
                  </div>
                  <Badge label={h.type} className={typeMeta[h.type]} />
                </div>
                {h.description && <p className="mt-2 text-xs text-navy-400">{h.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Past holidays this year</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((h) => (
              <div key={h._id} className="card p-4 opacity-70">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{h.name}</p>
                    <p className="text-sm text-navy-500">{formatDate(h.date, 'EEEE, dd MMM yyyy')}</p>
                  </div>
                  <Badge label={h.type} className={typeMeta[h.type]} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
