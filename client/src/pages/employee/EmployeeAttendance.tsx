import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { attendanceStatusMeta } from '../../utils/statusMeta';
import { formatDate, formatTime, formatMinutesAsDuration } from '../../utils/format';
import type { Attendance } from '../../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function EmployeeAttendance() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'my', month, year, status],
    queryFn: () => attendanceApi.my({ month, year, status: status || undefined }).then((r) => r.data.data),
  });

  const columns: Column<Attendance>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(`${r.dateKey}T00:00:00`, 'dd MMM yyyy') },
    { key: 'day', header: 'Day', render: (r) => formatDate(`${r.dateKey}T00:00:00`, 'EEEE') },
    { key: 'in', header: 'Punch In', render: (r) => formatTime(r.punchInAt) },
    { key: 'out', header: 'Punch Out', render: (r) => formatTime(r.punchOutAt) },
    { key: 'hours', header: 'Working Hours', render: (r) => formatMinutesAsDuration(r.workingMinutes) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge label={attendanceStatusMeta[r.status]?.label ?? r.status} className={attendanceStatusMeta[r.status]?.className} />,
    },
    { key: 'remarks', header: 'Remarks', render: (r) => r.remarks || '--' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={year} onChange={(e) => setYear(e.target.value)}>
          {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(attendanceStatusMeta).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r._id}
        emptyTitle="No attendance records for this month."
      />
    </div>
  );
}
