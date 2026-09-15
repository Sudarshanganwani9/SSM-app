import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Palmtree, Clock3, AlarmClock, Hourglass, CalendarDays,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { dashboardApi } from '../../api/reports';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { CardSkeleton, EmptyState } from '../../components/common/States';
import { leaveStatusMeta } from '../../utils/statusMeta';
import { formatDate, formatDateTime } from '../../utils/format';
import type { LeaveType } from '../../types';

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.admin().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">Could not load the dashboard. Please refresh.</p>;
  }

  const { totals } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totals.totalEmployees} icon={Users} accent="navy" />
        <StatCard label="Present Today" value={totals.presentToday} icon={UserCheck} accent="success" />
        <StatCard label="Absent Today" value={totals.absentToday} icon={UserX} accent="danger" />
        <StatCard label="On Leave Today" value={totals.onLeaveToday} icon={Palmtree} accent="plum" />
        <StatCard label="Pending Leave Requests" value={totals.pendingLeaveRequests} icon={Hourglass} accent="warning" />
        <StatCard label="Late Employees" value={totals.lateEmployees} icon={AlarmClock} accent="warning" />
        <StatCard label="Half-Day Employees" value={totals.halfDayEmployees} icon={Clock3} accent="info" />
        <StatCard label="COF Available" value={totals.cofAvailable} icon={Clock3} accent="brass" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Attendance trend (last 7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" />
              <XAxis dataKey="date" tickFormatter={(d) => formatDate(`${d}T00:00:00`, 'dd MMM')} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(d) => formatDate(`${d}T00:00:00`, 'dd MMM yyyy')} />
              <Line type="monotone" dataKey="present" stroke="#2C3C6B" strokeWidth={2} dot={false} name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#D14343" strokeWidth={2} dot={false} name="Absent" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Approved leave by type</h2>
          {data.leaveStatistics.length === 0 ? (
            <EmptyState title="No approved leave yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.leaveStatistics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="totalDays" fill="#D2AC42" radius={[4, 4, 0, 0]} name="Days" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent leave requests</h2>
            <Link to="/admin/leaves" className="text-sm font-medium text-navy-600 hover:text-navy-900">
              View all
            </Link>
          </div>
          {data.recentLeaveRequests.length === 0 ? (
            <EmptyState title="No leave requests yet" />
          ) : (
            <div className="divide-y divide-navy-100">
              {data.recentLeaveRequests.map((l) => (
                <div key={l._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">
                      {typeof l.employee === 'object' ? l.employee.fullName : ''} &middot;{' '}
                      {(l.leaveType as LeaveType)?.name}
                    </p>
                    <p className="text-navy-400">
                      {formatDate(l.startDate)} - {formatDate(l.endDate)}
                    </p>
                  </div>
                  <Badge label={leaveStatusMeta[l.status]?.label ?? l.status} className={leaveStatusMeta[l.status]?.className} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Upcoming holidays</h2>
            <CalendarDays size={16} className="text-navy-400" />
          </div>
          {data.upcomingHolidays.length === 0 ? (
            <EmptyState title="No upcoming holidays" />
          ) : (
            <div className="space-y-2.5">
              {data.upcomingHolidays.map((h) => (
                <div key={h._id} className="flex justify-between text-sm">
                  <span className="text-navy-600">{h.name}</span>
                  <span className="font-medium text-ink">{formatDate(h.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Recent registrations</h2>
          <Link to="/admin/employees" className="text-sm font-medium text-navy-600 hover:text-navy-900">
            View all
          </Link>
        </div>
        {data.recentRegistrations.length === 0 ? (
          <EmptyState title="No registrations yet" />
        ) : (
          <div className="divide-y divide-navy-100">
            {data.recentRegistrations.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{u.fullName}</p>
                  <p className="text-navy-400">{u.email}</p>
                </div>
                <p className="text-navy-400">{formatDateTime(u.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
