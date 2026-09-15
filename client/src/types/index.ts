export type Role = 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: Role;
  status: UserStatus;
  profileCompleted: boolean;
  employeeId?: string;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  panNumber?: string;
}

export interface EmployeeProfile {
  _id: string;
  user: string;
  profilePhotoUrl?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  department?: string;
  designation?: string;
  jobRole?: string;
  fieldOfWork?: string;
  dateOfJoining?: string;
  employmentType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern' | '';
  reportingManager?: { _id: string; fullName: string; email: string; employeeId?: string } | string | null;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactNumber?: string;
  bankDetails?: BankDetails;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'LEAVE'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'PENDING_PUNCH_OUT'
  | 'WORK_FROM_HOME';

export interface Attendance {
  _id: string;
  employee: string | { _id: string; fullName: string; email: string; employeeId?: string };
  dateKey: string;
  punchInAt?: string | null;
  punchOutAt?: string | null;
  workingMinutes: number;
  status: AttendanceStatus;
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  remarks?: string;
  correctedByAdmin?: string | null;
  correctionNote?: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  defaultAnnualDays: number;
  allowHalfDay: boolean;
  requiresAttachment: boolean;
  isPaid: boolean;
  active: boolean;
  description?: string;
}

export interface Leave {
  _id: string;
  employee: string | { _id: string; fullName: string; employeeId?: string };
  leaveType: string | LeaveType;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  numberOfDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  appliedAt: string;
  adminRemarks?: string;
  createdAt: string;
}

export interface LeaveBalance {
  _id: string;
  employee: string;
  leaveType: string | LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY' | 'OPTIONAL';
  description?: string;
  iconUrl?: string;
  isRecurringYearly?: boolean;
}

export type CofStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'USED' | 'CANCELLED' | 'EXPIRED';

export interface Cof {
  _id: string;
  employee: string | { _id: string; fullName: string; employeeId?: string };
  sundayDateWorked: string;
  punchInAt?: string;
  punchOutAt?: string;
  workingMinutes: number;
  status: CofStatus;
  generatedAt: string;
  expiryDate?: string | null;
  remarks?: string;
}

export interface AppNotification {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CompanySettings {
  _id: string;
  companyName: string;
  companyLogoUrl?: string;
  companyEmail?: string;
  companyPhone?: string;
  address?: string;
}

export interface OfficeSettings {
  _id: string;
  officeStartTime: string;
  officeEndTime: string;
  gracePeriodMinutes: number;
  minWorkingHoursForFullDay: number;
  halfDayThresholdHours: number;
  lateThresholdMinutes: number;
  leaveRules: {
    blockWeekendsInRange: boolean;
    blockHolidaysInRange: boolean;
    maxPastDaysForApplication: number;
  };
  cofRules: {
    minSundayWorkingHours: number;
    requiresApproval: boolean;
    expiryDays: number;
  };
  notificationSettings: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
  };
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
