import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { employeeApi } from '../../api/employees';
import { attendanceApi } from '../../api/attendance';
import { leaveApi } from '../../api/leaves';
import { cofApi } from '../../api/cof';
import { getErrorMessage } from '../../api/axiosClient';
import Badge from '../../components/common/Badge';
import { attendanceStatusMeta, leaveStatusMeta, cofStatusMeta, employeeStatusMeta } from '../../utils/statusMeta';
import { formatDate, formatTime, formatMinutesAsDuration, initials, toDateInputValue } from '../../utils/format';
import { CardSkeleton } from '../../components/common/States';
import type { EmployeeProfile } from '../../types';

type TabKey = 'profile' | 'attendance' | 'leaves' | 'cof';

export default function AdminEmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>('profile');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id as string).then((r) => r.data.data),
    enabled: Boolean(id),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<EmployeeProfile> & { fullName?: string; mobile?: string }>();

  useEffect(() => {
    if (data) {
      reset({
        ...data.profile,
        dateOfBirth: toDateInputValue(data.profile.dateOfBirth) as never,
        dateOfJoining: toDateInputValue(data.profile.dateOfJoining) as never,
        fullName: data.user.fullName,
        mobile: data.user.mobile,
      });
    }
  }, [data, reset]);

  async function onSubmit(values: Partial<EmployeeProfile> & { fullName?: string; mobile?: string }) {
    if (!id) return;
    try {
      await employeeApi.updateByAdmin(id, values);
      toast.success('Employee updated.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const { data: attendanceHistory } = useQuery({
    queryKey: ['employee', id, 'attendance'],
    queryFn: () => attendanceApi.all({ employeeId: id, limit: 10 }).then((r) => r.data.data),
    enabled: Boolean(id) && tab === 'attendance',
  });

  const { data: leaveHistory } = useQuery({
    queryKey: ['employee', id, 'leaves'],
    queryFn: () => leaveApi.all({ employeeId: id, limit: 10 }).then((r) => r.data.data),
    enabled: Boolean(id) && tab === 'leaves',
  });

  const { data: cofHistory } = useQuery({
    queryKey: ['employee', id, 'cof'],
    queryFn: () => cofApi.all({ employeeId: id, limit: 10 }).then((r) => r.data.data),
    enabled: Boolean(id) && tab === 'cof',
  });

  if (isLoading || !data) {
    return <CardSkeleton />;
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leaves', label: 'Leaves' },
    { key: 'cof', label: 'COF' },
  ];

  return (
    <div className="space-y-4">
      <Link to="/admin/employees" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-900">
        <ArrowLeft size={16} /> Back to employees
      </Link>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 font-display text-lg font-semibold text-navy-700">
            {initials(data.user.fullName)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">{data.user.fullName}</p>
            <p className="text-sm text-navy-500">
              {data.user.email} &middot; {data.user.employeeId}
            </p>
          </div>
        </div>
        <Badge label={employeeStatusMeta[data.user.status]?.label} className={employeeStatusMeta[data.user.status]?.className} />
      </div>

      <div className="flex gap-1 border-b border-navy-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium ${
              tab === t.key ? 'border-b-2 border-navy-700 text-navy-900' : 'text-navy-400 hover:text-navy-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6">
          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Basic details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input className="input" {...register('fullName')} />
              </div>
              <div>
                <label className="label">Mobile</label>
                <input className="input" {...register('mobile')} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Personal details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Date of birth</label>
                <input type="date" className="input" {...register('dateOfBirth')} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" {...register('gender')}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input className="input" {...register('address')} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" {...register('city')} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" {...register('state')} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" {...register('pincode')} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Professional details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Department</label>
                <input className="input" {...register('department')} />
              </div>
              <div>
                <label className="label">Designation</label>
                <input className="input" {...register('designation')} />
              </div>
              <div>
                <label className="label">Job role</label>
                <input className="input" {...register('jobRole')} />
              </div>
              <div>
                <label className="label">Field / area of work</label>
                <input className="input" {...register('fieldOfWork')} />
              </div>
              <div>
                <label className="label">Date of joining</label>
                <input type="date" className="input" {...register('dateOfJoining')} />
              </div>
              <div>
                <label className="label">Employment type</label>
                <select className="input" {...register('employmentType')}>
                  <option value="">Select</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Emergency contact</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Contact name</label>
                <input className="input" {...register('emergencyContactName')} />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input className="input" {...register('emergencyContactRelationship')} />
              </div>
              <div>
                <label className="label">Contact number</label>
                <input className="input" {...register('emergencyContactNumber')} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Bank / payroll (optional)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Account holder name</label>
                <input className="input" {...register('bankDetails.accountHolderName')} />
              </div>
              <div>
                <label className="label">Account number</label>
                <input className="input" {...register('bankDetails.accountNumber')} />
              </div>
              <div>
                <label className="label">IFSC code</label>
                <input className="input" {...register('bankDetails.ifscCode')} />
              </div>
              <div>
                <label className="label">Bank name</label>
                <input className="input" {...register('bankDetails.bankName')} />
              </div>
              <div>
                <label className="label">PAN number</label>
                <input className="input" {...register('bankDetails.panNumber')} />
              </div>
            </div>
          </section>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      )}

      {tab === 'attendance' && (
        <div className="card divide-y divide-navy-100">
          {(attendanceHistory ?? []).length === 0 && <p className="p-5 text-sm text-navy-400">No attendance records.</p>}
          {(attendanceHistory ?? []).map((a) => (
            <div key={a._id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-navy-600">{formatDate(`${a.dateKey}T00:00:00`)}</span>
              <span>
                {formatTime(a.punchInAt)} - {formatTime(a.punchOutAt)}
              </span>
              <span>{formatMinutesAsDuration(a.workingMinutes)}</span>
              <Badge label={attendanceStatusMeta[a.status]?.label ?? a.status} className={attendanceStatusMeta[a.status]?.className} />
            </div>
          ))}
        </div>
      )}

      {tab === 'leaves' && (
        <div className="card divide-y divide-navy-100">
          {(leaveHistory ?? []).length === 0 && <p className="p-5 text-sm text-navy-400">No leave requests.</p>}
          {(leaveHistory ?? []).map((l) => (
            <div key={l._id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-navy-600">
                {formatDate(l.startDate)} - {formatDate(l.endDate)}
              </span>
              <span>{l.numberOfDays} day(s)</span>
              <Badge label={leaveStatusMeta[l.status]?.label ?? l.status} className={leaveStatusMeta[l.status]?.className} />
            </div>
          ))}
        </div>
      )}

      {tab === 'cof' && (
        <div className="card divide-y divide-navy-100">
          {(cofHistory ?? []).length === 0 && <p className="p-5 text-sm text-navy-400">No COF records.</p>}
          {(cofHistory ?? []).map((c) => (
            <div key={c._id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-navy-600">{formatDate(c.sundayDateWorked)}</span>
              <span>{(c.workingMinutes / 60).toFixed(1)}h</span>
              <Badge label={cofStatusMeta[c.status]?.label ?? c.status} className={cofStatusMeta[c.status]?.className} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
