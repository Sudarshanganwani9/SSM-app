import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { leaveApi } from '../../api/leaves';
import { getErrorMessage } from '../../api/axiosClient';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { leaveStatusMeta } from '../../utils/statusMeta';
import { formatDate } from '../../utils/format';
import type { Leave, LeaveType } from '../../types';

export default function EmployeeMyLeaves() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Leave | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', 'my', status],
    queryFn: () => leaveApi.my(status || undefined).then((r) => r.data.data),
  });

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await leaveApi.cancel(cancelTarget._id);
      toast.success('Leave cancelled.');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setCancelTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  const columns: Column<Leave>[] = [
    { key: 'type', header: 'Leave Type', render: (r) => (r.leaveType as LeaveType)?.name ?? '--' },
    { key: 'from', header: 'From', render: (r) => formatDate(r.startDate) },
    { key: 'to', header: 'To', render: (r) => formatDate(r.endDate) },
    { key: 'days', header: 'Days', render: (r) => r.numberOfDays },
    { key: 'reason', header: 'Reason', render: (r) => <span className="line-clamp-1 max-w-[220px]">{r.reason}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge label={leaveStatusMeta[r.status]?.label ?? r.status} className={leaveStatusMeta[r.status]?.className} />,
    },
    { key: 'applied', header: 'Applied', render: (r) => formatDate(r.appliedAt) },
    { key: 'remarks', header: 'Admin Remarks', render: (r) => r.adminRemarks || '--' },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        ['PENDING', 'APPROVED'].includes(r.status) ? (
          <button type="button" className="text-sm font-medium text-danger hover:underline" onClick={() => setCancelTarget(r)}>
            Cancel
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r._id}
        emptyTitle="No leave requests found."
      />

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel leave request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmLabel="Cancel leave"
        danger
        isLoading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
