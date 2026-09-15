import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeApi } from '../../api/employees';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import type { EmployeeProfile } from '../../types';

type FormValues = Partial<EmployeeProfile>;

export default function CompleteProfile() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    employeeApi
      .getMyProfile()
      .then(({ data }) => reset(data.data.profile))
      .finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      await employeeApi.updateMyProfile(values);
      await refreshMe();
      toast.success('Profile completed!');
      navigate('/employee', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-brass-400 font-display text-xl font-bold text-navy-900">
            S
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome, {user?.fullName}</h1>
          <p className="mt-1 text-sm text-navy-500">Complete your profile to access your SSM dashboard.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6">
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
            <p className="mb-3 text-xs text-navy-400">
              You can set these once now; afterwards your administrator manages professional details.
            </p>
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

          {serverError && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">{serverError}</p>}

          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
