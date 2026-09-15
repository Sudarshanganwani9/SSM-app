import { useQuery } from '@tanstack/react-query';
import { cofApi } from '../../api/cof';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import { cofStatusMeta } from '../../utils/statusMeta';
import { formatDate } from '../../utils/format';
import { Clock3 } from 'lucide-react';
import type { Cof } from '../../types';

export default function EmployeeCof() {
  const { data, isLoading } = useQuery({
    queryKey: ['cof', 'my'],
    queryFn: () => cofApi.my().then((r) => r.data),
  });

  const columns: Column<Cof>[] = [
    { key: 'sunday', header: 'Sunday Worked', render: (r) => formatDate(r.sundayDateWorked) },
    { key: 'hours', header: 'Hours', render: (r) => (r.workingMinutes / 60).toFixed(1) },
    { key: 'generated', header: 'Generated', render: (r) => formatDate(r.generatedAt) },
    { key: 'expiry', header: 'Expiry', render: (r) => (r.expiryDate ? formatDate(r.expiryDate) : '--') },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge label={cofStatusMeta[r.status]?.label ?? r.status} className={cofStatusMeta[r.status]?.className} />,
    },
    { key: 'remarks', header: 'Remarks', render: (r) => r.remarks || '--' },
  ];

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <StatCard label="Compensatory Off available" value={data?.availableCount ?? 0} icon={Clock3} accent="brass" />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r._id}
        emptyTitle="No Compensatory Off records yet."
        emptyDescription="Working on a Sunday and completing the minimum required hours will earn you a Compensatory Off automatically."
      />
    </div>
  );
}
