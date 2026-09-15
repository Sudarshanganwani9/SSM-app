import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Settings2 } from 'lucide-react';
import { leaveApi } from '../../api/leaves';
import { getErrorMessage } from '../../api/axiosClient';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { leaveStatusMeta } from '../../utils/statusMeta';
import { formatDate } from '../../utils/format';
import type { Leave, LeaveType } from '../../types';

export default function AdminLeaves() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [decideTarget, setDecideTarget] = useState<{ leave: Leave; action: 'approve' | 'reject' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [typesModalOpen, setTypesModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', 'all', status, page],
    queryFn: () => leaveApi.all({ status: status || undefined, page, limit: 15 }).then((r) => r.data),
  });

  async function handleDecide() {
    if (!decideTarget) return;
    try {
      if (decideTarget.action === 'approve') {
        await leaveApi.approve(decideTarget.leave._id, remarks);
        toast.success('Leave approved.');
      } else {
        await leaveApi.reject(decideTarget.leave._id, remarks);
        toast.success('Leave rejected.');
      }
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setDecideTarget(null);
      setRemarks('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns: Column<Leave>[] = [
    { key: 'employee', header: 'Employee', render: (l) => (typeof l.employee === 'object' ? l.employee.fullName : '') },
    { key: 'type', header: 'Leave Type', render: (l) => (l.leaveType as LeaveType)?.name ?? '' },
    { key: 'from', header: 'From', render: (l) => formatDate(l.startDate) },
    { key: 'to', header: 'To', render: (l) => formatDate(l.endDate) },
    { key: 'days', header: 'Days', render: (l) => l.numberOfDays },
    { key: 'reason', header: 'Reason', render: (l) => <span className="line-clamp-1 max-w-[200px]">{l.reason}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (l) => <Badge label={leaveStatusMeta[l.status]?.label ?? l.status} className={leaveStatusMeta[l.status]?.className} />,
    },
    {
      key: 'actions',
      header: '',
      render: (l) =>
        l.status === 'PENDING' ? (
          <div className="flex gap-1.5">
            <button
              type="button"
              className="rounded-md p-1.5 text-success hover:bg-success-light"
              onClick={() => setDecideTarget({ leave: l, action: 'approve' })}
              aria-label="Approve"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              className="rounded-md p-1.5 text-danger hover:bg-danger-light"
              onClick={() => setDecideTarget({ leave: l, action: 'reject' })}
              aria-label="Reject"
            >
              <X size={16} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select className="input w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button type="button" className="btn-secondary" onClick={() => setTypesModalOpen(true)}>
          <Settings2 size={16} /> Manage leave types
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(l) => l._id}
        emptyTitle="No leave requests found."
        pagination={
          data
            ? { page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total, onPageChange: setPage }
            : undefined
        }
      />

      <Modal
        isOpen={Boolean(decideTarget)}
        onClose={() => setDecideTarget(null)}
        title={decideTarget?.action === 'approve' ? 'Approve leave request' : 'Reject leave request'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setDecideTarget(null)}>
              Cancel
            </button>
            <button type="button" className={decideTarget?.action === 'approve' ? 'btn-primary' : 'btn-danger'} onClick={handleDecide}>
              {decideTarget?.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        <label className="label">Remarks (optional)</label>
        <textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add a note for the employee..." />
      </Modal>

      <LeaveTypesModal isOpen={typesModalOpen} onClose={() => setTypesModalOpen(false)} />
    </div>
  );
}

function LeaveTypesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', defaultAnnualDays: 0, allowHalfDay: true, requiresAttachment: false });

  const { data } = useQuery({
    queryKey: ['leave-types', 'all'],
    queryFn: () => leaveApi.types(true).then((r) => r.data.data),
    enabled: isOpen,
  });

  async function handleCreate() {
    try {
      await leaveApi.createType(form);
      toast.success('Leave type created.');
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      setForm({ name: '', code: '', defaultAnnualDays: 0, allowHalfDay: true, requiresAttachment: false });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleToggleActive(type: LeaveType) {
    try {
      if (type.active) {
        await leaveApi.deleteType(type._id);
      } else {
        await leaveApi.updateType(type._id, { active: true });
      }
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage leave types" size="lg">
      <div className="space-y-4">
        <div className="divide-y divide-navy-100 rounded-md border border-navy-100">
          {(data ?? []).map((t) => (
            <div key={t._id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">
                  {t.name} <span className="text-navy-400">({t.code})</span>
                </p>
                <p className="text-xs text-navy-400">{t.defaultAnnualDays} days/year &middot; {t.isPaid ? 'Paid' : 'Unpaid'}</p>
              </div>
              <button type="button" className={t.active ? 'text-danger text-xs font-medium' : 'text-success text-xs font-medium'} onClick={() => handleToggleActive(t)}>
                {t.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-navy-100 p-4">
          <p className="mb-3 text-sm font-medium text-ink">Add new leave type</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Code (e.g. CL)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <input
              type="number"
              className="input"
              placeholder="Default annual days"
              value={form.defaultAnnualDays}
              onChange={(e) => setForm({ ...form, defaultAnnualDays: Number(e.target.value) })}
            />
            <label className="flex items-center gap-2 text-sm text-navy-600">
              <input type="checkbox" checked={form.allowHalfDay} onChange={(e) => setForm({ ...form, allowHalfDay: e.target.checked })} />
              Allow half-day
            </label>
          </div>
          <button type="button" className="btn-primary mt-3" onClick={handleCreate} disabled={!form.name || !form.code}>
            Add leave type
          </button>
        </div>
      </div>
    </Modal>
  );
}
