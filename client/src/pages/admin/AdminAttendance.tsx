import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import { attendanceApi } from '../../api/attendance';
import { getErrorMessage } from '../../api/axiosClient';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { attendanceStatusMeta } from '../../utils/statusMeta';
import { formatDate, formatTime, formatMinutesAsDuration } from '../../utils/format';
import type { Attendance } from '../../types';

interface EditFormValues {
  punchInAt: string;
  punchOutAt: string;
  status: string;
  remarks: string;
  correctionNote: string;
}

export default function AdminAttendance() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<Attendance | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'all', dateFrom, dateTo, status, department, page],
    queryFn: () =>
      attendanceApi
        .all({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, status: status || undefined, department: department || undefined, page, limit: 15 })
        .then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm<EditFormValues>();

  function openEdit(a: Attendance) {
    setEditTarget(a);
    reset({
      punchInAt: a.punchInAt ? toLocalInput(a.punchInAt) : '',
      punchOutAt: a.punchOutAt ? toLocalInput(a.punchOutAt) : '',
      status: a.status,
      remarks: a.remarks || '',
      correctionNote: '',
    });
  }

  function toLocalInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function onSubmit(values: EditFormValues) {
    if (!editTarget) return;
    try {
      await attendanceApi.update(editTarget._id, {
        punchInAt: values.punchInAt ? new Date(values.punchInAt).toISOString() : undefined,
        punchOutAt: values.punchOutAt ? new Date(values.punchOutAt).toISOString() : undefined,
        status: values.status as Attendance['status'],
        remarks: values.remarks,
        correctionNote: values.correctionNote,
      });
      toast.success('Attendance updated.');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setEditTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns: Column<Attendance>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (a) => (typeof a.employee === 'object' ? `${a.employee.fullName} (${a.employee.employeeId ?? ''})` : ''),
    },
    { key: 'date', header: 'Date', render: (a) => formatDate(`${a.dateKey}T00:00:00`) },
    { key: 'in', header: 'Punch In', render: (a) => formatTime(a.punchInAt) },
    { key: 'out', header: 'Punch Out', render: (a) => formatTime(a.punchOutAt) },
    { key: 'hours', header: 'Working Hours', render: (a) => formatMinutesAsDuration(a.workingMinutes) },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge label={attendanceStatusMeta[a.status]?.label ?? a.status} className={attendanceStatusMeta[a.status]?.className} />,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <button type="button" onClick={() => openEdit(a)} className="rounded-md p-1.5 text-navy-500 hover:bg-navy-50" aria-label="Edit">
          <Pencil size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="date" className="input w-auto" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
        <input type="date" className="input w-auto" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
        <select className="input w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {Object.entries(attendanceStatusMeta).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <input className="input w-48" placeholder="Department" value={department} onChange={(e) => { setPage(1); setDepartment(e.target.value); }} />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(a) => a._id}
        emptyTitle="No attendance records for this filter."
        pagination={
          data
            ? { page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total, onPageChange: setPage }
            : undefined
        }
      />

      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title="Correct attendance" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Punch in</label>
              <input type="datetime-local" className="input" {...register('punchInAt')} />
            </div>
            <div>
              <label className="label">Punch out</label>
              <input type="datetime-local" className="input" {...register('punchOutAt')} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              {Object.entries(attendanceStatusMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Remarks</label>
            <input className="input" {...register('remarks')} />
          </div>
          <div>
            <label className="label">Correction note (internal)</label>
            <input className="input" {...register('correctionNote')} placeholder="Reason for this correction" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save correction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
