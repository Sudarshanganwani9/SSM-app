import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/axiosClient';
import ChangePasswordCard from '../../components/common/ChangePasswordCard';
import { initials, formatDateTime } from '../../utils/format';

interface FormValues {
  fullName: string;
  mobile: string;
}

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { fullName: user?.fullName, mobile: user?.mobile },
  });

  async function onSubmit() {
    // Admin identity fields are minimal by design; this app keeps Admin
    // basic-info editing intentionally simple since Admin has no
    // EmployeeProfile record. Password change is the primary self-service
    // action, handled below via ChangePasswordCard.
    try {
      const { data } = await authApi.me();
      setUser(data.data);
      toast.success('Profile refreshed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 lg:grid-cols-2">
      <div className="card p-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-navy-100 font-display text-xl font-semibold text-navy-700">
          {initials(user?.fullName)}
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-ink">{user?.fullName}</h2>
        <p className="text-sm text-navy-500">{user?.email}</p>
        <p className="mt-1 text-xs text-navy-400">Administrator</p>
        <p className="mt-3 border-t border-navy-100 pt-3 text-xs text-navy-400">
          Last login: {user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'This session'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 border-t border-navy-100 pt-4 text-left">
          <div>
            <label className="label">Full name</label>
            <input className="input" {...register('fullName')} disabled />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input" {...register('mobile')} disabled />
          </div>
          <p className="text-xs text-navy-400">Contact a fellow Admin with database access to change these values directly, or extend this form as needed.</p>
        </form>
      </div>

      <ChangePasswordCard />
    </div>
  );
}
