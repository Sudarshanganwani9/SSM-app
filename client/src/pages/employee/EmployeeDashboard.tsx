import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CalendarDays, Palmtree, Bell as BellIcon } from 'lucide-react';
import { dashboardApi } from '../../api/reports';
import { attendanceApi } from '../../api/attendance';
import { useAuth } from '../../context/AuthContext';
import { formatTime, formatMinutesAsDuration, formatDate } from '../../utils/format';
import { attendanceStatusMeta } from '../../utils/statusMeta';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/States';
import { getErrorMessage } from '../../api/axiosClient';
import type { Attendance } from '../../types';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [punching, setPunching] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: () => dashboardApi.employee().then((r) => r.data.data),
  });

  const attendance = data?.todayAttendance as Attendance | null | undefined;

  async function handlePunchIn() {
    setPunching(true);
    try {
      await attendanceApi.punchIn();
      toast.success('Punched in successfully.');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'employee'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPunching(false);
    }
  }

  async function handlePunchOut() {
    setPunching(true);
    try {
      await attendanceApi.punchOut();
      toast.success('Punched out successfully.');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'employee'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPunching(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">Could not load your dashboard. Please refresh.</p>;
  }

  const hasPunchedIn = Boolean(attendance?.punchInAt);
  const hasPunchedOut = Boolean(attendance?.punchOutAt);
  const statusMeta = attendance ? attendanceStatusMeta[attendance.status] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Welcome, {user?.fullName?.split(' ')[0]}</h2>
        <p className="text-sm text-navy-500">Here's what's happening with your workday.</p>
      </div>

      {!data.profileCompleted && (
        <div className="card border-warning bg-warning-light/60 p-4 text-sm text-warning">
          Your profile is incomplete.{' '}
          <Link to="/complete-profile" className="font-medium underline">
            Finish it now
          </Link>
          .
        </div>
      )}

      {/* Punch card */}
      <div className="card p-6">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-navy-500">Today's attendance</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-2xl font-semibold text-ink">
                {formatDate(new Date(), 'EEEE, dd MMM yyyy')}
              </span>
              {statusMeta && <Badge label={statusMeta.label} className={statusMeta.className} />}
            </div>
            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-navy-400">Punch in</p>
                <p className="font-medium text-ink">{formatTime(attendance?.punchInAt)}</p>
              </div>
              <div>
                <p className="text-navy-400">Punch out</p>
                <p className="font-medium text-ink">{formatTime(attendance?.punchOutAt)}</p>
              </div>
              <div>
                <p className="text-navy-400">Working hours</p>
                <p className="font-medium text-ink">{formatMinutesAsDuration(attendance?.workingMinutes)}</p>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            {!hasPunchedIn && (
              <button
                type="button"
                onClick={handlePunchIn}
                disabled={punching}
                className="punch-btn btn-primary w-full text-base sm:w-52"
              >
                <Clock size={20} /> Punch In
              </button>
            )}
            {hasPunchedIn && !hasPunchedOut && (
              <button
                type="button"
                onClick={handlePunchOut}
                disabled={punching}
                className="punch-btn btn-danger w-full text-base sm:w-52"
              >
                <Clock size={20} /> Punch Out
              </button>
            )}
            {hasPunchedIn && hasPunchedOut && (
              <div className="punch-btn flex w-full items-center justify-center rounded-md bg-success-light px-4 text-sm font-medium text-success sm:w-52">
                Day completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-navy-500">
            <Palmtree size={18} />
            <p className="text-sm">Leave balance</p>
          </div>
          <div className="mt-3 space-y-1.5">
            {data.leaveBalances.length === 0 && <p className="text-sm text-navy-400">No leave types configured.</p>}
            {data.leaveBalances.map((b) => (
              <div key={b._id} className="flex justify-between text-sm">
                <span className="text-navy-600">{typeof b.leaveType === 'object' ? b.leaveType.name : ''}</span>
                <span className="font-medium text-ink">{b.remainingDays} left</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-navy-500">
            <CalendarDays size={18} />
            <p className="text-sm">Upcoming holidays</p>
          </div>
          <div className="mt-3 space-y-1.5">
            {data.upcomingHolidays.length === 0 && <p className="text-sm text-navy-400">No upcoming holidays.</p>}
            {data.upcomingHolidays.map((h) => (
              <div key={h._id} className="flex justify-between text-sm">
                <span className="text-navy-600">{h.name}</span>
                <span className="font-medium text-ink">{formatDate(h.date)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-navy-500">
            <BellIcon size={18} />
            <p className="text-sm">Quick stats</p>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-navy-600">Pending leave requests</span>
              <span className="font-medium text-ink">{data.pendingLeaveCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-600">Compensatory Off available</span>
              <span className="font-medium text-ink">{data.cofAvailable}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
