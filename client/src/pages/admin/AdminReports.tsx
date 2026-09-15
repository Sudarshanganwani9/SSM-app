import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { reportApi } from '../../api/reports';
import { getErrorMessage } from '../../api/axiosClient';
import DataTable, { type Column } from '../../components/common/DataTable';

type ReportKey = 'attendance' | 'leaves' | 'cof' | 'employees';

const tabs: { key: ReportKey; label: string }[] = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'leaves', label: 'Leave' },
  { key: 'cof', label: 'COF' },
  { key: 'employees', label: 'Employees' },
];

export default function AdminReports() {
  const [tab, setTab] = useState<ReportKey>('attendance');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  const params = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ['reports', tab, dateFrom, dateTo],
    queryFn: async () => {
      const fn = { attendance: reportApi.attendance, leaves: reportApi.leaves, cof: reportApi.cof, employees: reportApi.employees }[tab];
      const res = await fn(params);
      return res.data.data as Record<string, string | number>[];
    },
  });

  async function handleExport() {
    setDownloading(true);
    try {
      await reportApi.downloadCsv(`/reports/${tab}`, params, `${tab}-report-${Date.now()}.csv`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  const columns: Column<Record<string, string | number>>[] =
    data && data.length > 0
      ? Object.keys(data[0]).map((key) => ({ key, header: key, render: (row) => String(row[key] ?? '') }))
      : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md bg-navy-50 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-navy-900 shadow-card' : 'text-navy-500 hover:text-navy-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={handleExport} disabled={downloading}>
          <Download size={16} /> {downloading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {tab !== 'employees' && (
        <div className="flex flex-wrap gap-3">
          <input type="date" className="input w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => JSON.stringify(row)}
        emptyTitle="No data for the selected filters."
      />
    </div>
  );
}
