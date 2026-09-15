export const attendanceStatusMeta: Record<string, { label: string; className: string }> = {
  PRESENT: { label: 'Present', className: 'bg-success-light text-success' },
  LATE: { label: 'Late', className: 'bg-warning-light text-warning' },
  HALF_DAY: { label: 'Half Day', className: 'bg-info-light text-info' },
  ABSENT: { label: 'Absent', className: 'bg-danger-light text-danger' },
  LEAVE: { label: 'On Leave', className: 'bg-plum-light text-plum' },
  HOLIDAY: { label: 'Holiday', className: 'bg-brass-100 text-brass-700' },
  WEEK_OFF: { label: 'Week Off', className: 'bg-navy-100 text-navy-700' },
  PENDING_PUNCH_OUT: { label: 'Pending Punch Out', className: 'bg-warning-light text-warning' },
  WORK_FROM_HOME: { label: 'Work From Home', className: 'bg-info-light text-info' },
};

export const leaveStatusMeta: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning-light text-warning' },
  APPROVED: { label: 'Approved', className: 'bg-success-light text-success' },
  REJECTED: { label: 'Rejected', className: 'bg-danger-light text-danger' },
  CANCELLED: { label: 'Cancelled', className: 'bg-navy-100 text-navy-700' },
};

export const cofStatusMeta: Record<string, { label: string; className: string }> = {
  PENDING_APPROVAL: { label: 'Pending Approval', className: 'bg-warning-light text-warning' },
  APPROVED: { label: 'Approved', className: 'bg-success-light text-success' },
  REJECTED: { label: 'Rejected', className: 'bg-danger-light text-danger' },
  USED: { label: 'Used', className: 'bg-navy-100 text-navy-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-navy-100 text-navy-700' },
  EXPIRED: { label: 'Expired', className: 'bg-danger-light text-danger' },
};

export const employeeStatusMeta: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-success-light text-success' },
  INACTIVE: { label: 'Inactive', className: 'bg-danger-light text-danger' },
};
