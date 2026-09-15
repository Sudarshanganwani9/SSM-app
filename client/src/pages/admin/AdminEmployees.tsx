import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Eye, KeyRound, UserCheck, UserX } from 'lucide-react';
import { employeeApi, type EmployeeListItem } from '../../api/employees';
import { getErrorMessage } from '../../api/axiosClient';
import DataTable, { type Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { employeeStatusMeta } from '../../utils/statusMeta';
import { formatDate, initials } from '../../utils/format';

export default function AdminEmployees() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [statusTarget, setStatusTarget] = useState<EmployeeListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<EmployeeListItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, status, department, page],
    queryFn: () =>
      employeeApi
        .list({ search: search || undefined, status: status || undefined, department: department || undefined, page, limit: 15 })
        .then((r) => r.data),
  });

  async function handleToggleStatus() {
    if (!statusTarget) return;
    setActionLoading(true);
    const nextStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await employeeApi.setStatus(statusTarget._id, nextStatus);
      toast.success(`Employee ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setStatusTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setActionLoading(true);
    try {
      const { data: res } = await employeeApi.resetPassword(resetTarget._id);
      toast.success(res.devTempPassword ? `Temporary password: ${res.devTempPassword}` : 'Password reset. Email sent.');
      setResetTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  const columns: Column<EmployeeListItem>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
            {initials(e.fullName)}
          </span>
          <div>
            <p className="font-medium text-ink">{e.fullName}</p>
            <p className="text-xs text-navy-400">{e.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (e) => e.email },
    { key: 'mobile', header: 'Mobile', render: (e) => e.mobile },
    { key: 'department', header: 'Department', render: (e) => e.profile?.department || '--' },
    { key: 'designation', header: 'Designation', render: (e) => e.profile?.designation || '--' },
    { key: 'joining', header: 'Joining Date', render: (e) => (e.profile?.dateOfJoining ? formatDate(e.profile.dateOfJoining) : '--') },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <Badge label={employeeStatusMeta[e.status]?.label ?? e.status} className={employeeStatusMeta[e.status]?.className} />,
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex items-center gap-1">
          <Link to={`/admin/employees/${e._id}`} className="rounded-md p-1.5 text-navy-500 hover:bg-navy-50" aria-label="View profile">
            <Eye size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setResetTarget(e)}
            className="rounded-md p-1.5 text-navy-500 hover:bg-navy-50"
            aria-label="Reset password"
          >
            <KeyRound size={16} />
          </button>
          <button
            type="button"
            onClick={() => setStatusTarget(e)}
            className={`rounded-md p-1.5 hover:bg-navy-50 ${e.status === 'ACTIVE' ? 'text-danger' : 'text-success'}`}
            aria-label={e.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          >
            {e.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            className="input w-64 pl-9"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <input
          className="input w-48"
          placeholder="Department"
          value={department}
          onChange={(e) => { setPage(1); setDepartment(e.target.value); }}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(e) => e._id}
        emptyTitle="No employees found."
        pagination={
          data
            ? { page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total, onPageChange: setPage }
            : undefined
        }
      />

      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.status === 'ACTIVE' ? 'Deactivate employee' : 'Activate employee'}
        message={
          statusTarget?.status === 'ACTIVE'
            ? `${statusTarget?.fullName} will no longer be able to log in. Their historical data will be preserved.`
            : `${statusTarget?.fullName} will be able to log in again.`
        }
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        danger={statusTarget?.status === 'ACTIVE'}
        isLoading={actionLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(resetTarget)}
        title="Reset password"
        message={`Generate a new temporary password for ${resetTarget?.fullName}? They'll be required to change it on next login.`}
        confirmLabel="Reset password"
        isLoading={actionLoading}
        onConfirm={handleResetPassword}
        onCancel={() => setResetTarget(null)}
      />
    </div>
  );
}
