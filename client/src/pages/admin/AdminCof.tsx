import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Pencil } from 'lucide-react';
import { cofApi } from '../../api/cof';
import { getErrorMessage } from '../../api/axiosClient';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { cofStatusMeta } from '../../utils/statusMeta';
import { formatDate, toDateInputValue } from '../../utils/format';
import type { Cof, CofStatus } from '../../types';

export default function AdminCof() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<Cof | null>(null);
  const [expiry, setExpiry] = useState('');
  const [remarks, setRemarks] = useState('');
  const [editStatus, setEditStatus] = useState<CofStatus>('APPROVED');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cof', 'all', status, page],
    queryFn: () => cofApi.all({ status: status || undefined, page, limit: 15 }).then((r) => r.data),
  });

  async function quickUpdate(id: string, next: CofStatus) {
    try {
      await cofApi.update(id, { status: next });
      toast.success('COF updated.');
      queryClient.invalidateQueries({ queryKey: ['cof'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openEdit(c: Cof) {
    setEditTarget(c);
    setExpiry(c.expiryDate ? toDateInputValue(c.expiryDate) : '');
    setRemarks(c.remarks || '');
    setEditStatus(c.status);
  }

  async function saveEdit() {
    if (!editTarget) return;
    try {
      await cofApi.update(editTarget._id, {status: editStatus, expiryDate: expiry || null, remarks });
      toast.success('COF updated.');
      queryClient.invalidateQueries({ queryKey: ['cof'] });
      setEditTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns: Column<Cof>[] = [
    { key: 'employee', header: 'Employee', render: (c) => (typeof c.employee === 'object' ? c.employee.fullName : '') },
    { key: 'sunday', header: 'Sunday Worked', render: (c) => formatDate(c.sundayDateWorked) },
    { key: 'hours', header: 'Hours', render: (c) => (c.workingMinutes / 60).toFixed(1) },
    { key: 'expiry', header: 'Expiry', render: (c) => (c.expiryDate ? formatDate(c.expiryDate) : '--') },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge label={cofStatusMeta[c.status]?.label ?? c.status} className={cofStatusMeta[c.status]?.className} />,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex items-center gap-1">
          {c.status === 'PENDING_APPROVAL' && (
            <>
              <button type="button" className="rounded-md p-1.5 text-success hover:bg-success-light" onClick={() => quickUpdate(c._id, 'APPROVED')} aria-label="Approve">
                <Check size={16} />
              </button>
              <button type="button" className="rounded-md p-1.5 text-danger hover:bg-danger-light" onClick={() => quickUpdate(c._id, 'REJECTED')} aria-label="Reject">
                <X size={16} />
              </button>
            </>
          )}
          <button type="button" className="rounded-md p-1.5 text-navy-500 hover:bg-navy-50" onClick={() => openEdit(c)} aria-label="Edit">
            <Pencil size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <select className="input w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
        <option value="">All statuses</option>
        {Object.entries(cofStatusMeta).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(c) => c._id}
        emptyTitle="No Compensatory Off records found."
        pagination={
          data
            ? { page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total, onPageChange: setPage }
            : undefined
        }
      />

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Adjust Compensatory Off"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={saveEdit}>
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as CofStatus)}
            >
              {Object.entries(cofStatusMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Expiry date</label>
            <input type="date" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div>
            <label className="label">Remarks</label>
            <textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
