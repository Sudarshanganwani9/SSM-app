import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/axiosClient';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function ChangePasswordCard() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    if (values.newPassword !== values.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      toast.success('Password changed successfully.');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-semibold text-ink">Change password</h2>
      <div>
        <label className="label">Current password</label>
        <input type="password" className="input" {...register('currentPassword', { required: true })} />
        {errors.currentPassword && <p className="mt-1 text-xs text-danger">Current password is required.</p>}
      </div>
      <div>
        <label className="label">New password</label>
        <input
          type="password"
          className="input"
          {...register('newPassword', { required: true, minLength: 8 })}
        />
        {errors.newPassword && <p className="mt-1 text-xs text-danger">New password must be at least 8 characters.</p>}
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input type="password" className="input" {...register('confirmNewPassword', { required: true })} />
      </div>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}
