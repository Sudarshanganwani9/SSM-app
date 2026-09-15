import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { settingsApi } from '../../api/settings';
import { getErrorMessage } from '../../api/axiosClient';
import { CardSkeleton } from '../../components/common/States';
import type { CompanySettings } from '../../types';

type TabKey = 'company' | 'office' | 'leave' | 'cof' | 'notifications';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'office', label: 'Office Hours' },
  { key: 'leave', label: 'Leave Rules' },
  { key: 'cof', label: 'COF Rules' },
  { key: 'notifications', label: 'Notifications' },
];

export default function AdminSettings() {
  const [tab, setTab] = useState<TabKey>('company');
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
  });

  const companyForm = useForm<Partial<CompanySettings>>();
  const officeForm = useForm<any>();

  useEffect(() => {
    if (data) {
      companyForm.reset(data.company);
      officeForm.reset(data.office);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function saveCompany(values: Partial<CompanySettings>) {
    try {
      await settingsApi.update({ company: values });
      toast.success('Company settings saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function saveOffice(values: any) {
    try {
      await settingsApi.update({
        office: {
          officeStartTime: values.officeStartTime,
          officeEndTime: values.officeEndTime,
          gracePeriodMinutes: Number(values.gracePeriodMinutes),
          minWorkingHoursForFullDay: Number(values.minWorkingHoursForFullDay),
          halfDayThresholdHours: Number(values.halfDayThresholdHours),
          lateThresholdMinutes: Number(values.lateThresholdMinutes),
        },
      });
      toast.success('Office hours saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function saveLeaveRules(values: any) {
    try {
      await settingsApi.update({
        office: {
          leaveRules: {
            blockWeekendsInRange: values.blockWeekendsInRange,
            blockHolidaysInRange: values.blockHolidaysInRange,
            maxPastDaysForApplication: Number(values.maxPastDaysForApplication),
          },
        },
      });
      toast.success('Leave rules saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function saveCofRules(values: any) {
    try {
      await settingsApi.update({
        office: {
          cofRules: {
            minSundayWorkingHours: Number(values.minSundayWorkingHours),
            requiresApproval: values.requiresApproval,
            expiryDays: Number(values.expiryDays),
          },
        },
      });
      toast.success('COF rules saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function saveNotifications(values: any) {
    try {
      await settingsApi.update({
        office: {
          notificationSettings: {
            inAppEnabled: values.inAppEnabled,
            emailEnabled: values.emailEnabled,
          },
        },
      });
      toast.success('Notification settings saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await settingsApi.uploadLogo(file);
      toast.success('Logo updated.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (isLoading || !data) return <CardSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-navy-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium ${tab === t.key ? 'border-b-2 border-navy-700 text-navy-900' : 'text-navy-400 hover:text-navy-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <form onSubmit={companyForm.handleSubmit(saveCompany)} className="card max-w-xl space-y-4 p-6">
          <div className="flex items-center gap-4">
            {data.company.companyLogoUrl ? (
              <img
                src={`${(import.meta.env.VITE_API_URL as string)?.replace('/api', '') || 'http://localhost:5000'}${data.company.companyLogoUrl}`}
                alt="Logo"
                className="h-14 w-14 rounded-md border border-navy-100 object-contain"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-navy-50 font-display text-lg font-bold text-navy-400">S</div>
            )}
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Upload logo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div>
            <label className="label">Company name</label>
            <input className="input" {...companyForm.register('companyName')} />
          </div>
          <div>
            <label className="label">Company email</label>
            <input className="input" {...companyForm.register('companyEmail')} />
          </div>
          <div>
            <label className="label">Company phone</label>
            <input className="input" {...companyForm.register('companyPhone')} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} {...companyForm.register('address')} />
          </div>
          <button type="submit" className="btn-primary">
            Save company settings
          </button>
        </form>
      )}

      {tab === 'office' && (
        <form onSubmit={officeForm.handleSubmit(saveOffice)} className="card max-w-xl space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Office start time</label>
              <input type="time" className="input" {...officeForm.register('officeStartTime')} />
            </div>
            <div>
              <label className="label">Office end time</label>
              <input type="time" className="input" {...officeForm.register('officeEndTime')} />
            </div>
            <div>
              <label className="label">Grace period (minutes)</label>
              <input type="number" className="input" {...officeForm.register('gracePeriodMinutes')} />
            </div>
            <div>
              <label className="label">Late threshold (minutes)</label>
              <input type="number" className="input" {...officeForm.register('lateThresholdMinutes')} />
            </div>
            <div>
              <label className="label">Minimum working hours (full day)</label>
              <input type="number" step="0.5" className="input" {...officeForm.register('minWorkingHoursForFullDay')} />
            </div>
            <div>
              <label className="label">Half-day threshold (hours)</label>
              <input type="number" step="0.5" className="input" {...officeForm.register('halfDayThresholdHours')} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Save office hours
          </button>
        </form>
      )}

      {tab === 'leave' && (
        <form onSubmit={officeForm.handleSubmit(saveLeaveRules)} className="card max-w-xl space-y-4 p-6">
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" defaultChecked={data.office.leaveRules.blockWeekendsInRange} {...officeForm.register('blockWeekendsInRange')} />
            Exclude Sundays from leave day count
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" defaultChecked={data.office.leaveRules.blockHolidaysInRange} {...officeForm.register('blockHolidaysInRange')} />
            Exclude company holidays from leave day count
          </label>
          <div>
            <label className="label">Max past days allowed when applying for leave</label>
            <input type="number" className="input w-40" defaultValue={data.office.leaveRules.maxPastDaysForApplication} {...officeForm.register('maxPastDaysForApplication')} />
          </div>
          <p className="text-xs text-navy-400">Leave types and per-employee balances are managed from the Leaves page.</p>
          <button type="submit" className="btn-primary">
            Save leave rules
          </button>
        </form>
      )}

      {tab === 'cof' && (
        <form onSubmit={officeForm.handleSubmit(saveCofRules)} className="card max-w-xl space-y-4 p-6">
          <div>
            <label className="label">Minimum Sunday working hours to earn a COF</label>
            <input type="number" step="0.5" className="input w-40" defaultValue={data.office.cofRules.minSundayWorkingHours} {...officeForm.register('minSundayWorkingHours')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" defaultChecked={data.office.cofRules.requiresApproval} {...officeForm.register('requiresApproval')} />
            Require Admin approval before a COF is usable
          </label>
          <div>
            <label className="label">Expiry period (days, 0 = never expires)</label>
            <input type="number" className="input w-40" defaultValue={data.office.cofRules.expiryDays} {...officeForm.register('expiryDays')} />
          </div>
          <button type="submit" className="btn-primary">
            Save COF rules
          </button>
        </form>
      )}

      {tab === 'notifications' && (
        <form onSubmit={officeForm.handleSubmit(saveNotifications)} className="card max-w-xl space-y-4 p-6">
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" defaultChecked={data.office.notificationSettings.inAppEnabled} {...officeForm.register('inAppEnabled')} />
            Enable in-app notifications
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" defaultChecked={data.office.notificationSettings.emailEnabled} {...officeForm.register('emailEnabled')} />
            Enable email notifications (requires SMTP configuration)
          </label>
          <button type="submit" className="btn-primary">
            Save notification settings
          </button>
        </form>
      )}
    </div>
  );
}
