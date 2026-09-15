import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { employeeApi } from '../../api/employees';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { initials, toDateInputValue } from '../../utils/format';
import { CardSkeleton } from '../../components/common/States';
import type { EmployeeProfile as ProfileType, User } from '../../types';

type FormValues = Partial<ProfileType>;

export default function EmployeeProfile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    employeeApi
      .getMyProfile()
      .then(({ data }) => {
        setProfile(data.data.profile);
        setProfileUser(data.data.user);
        reset({ ...data.data.profile, dateOfBirth: toDateInputValue(data.data.profile.dateOfBirth) as never });
      })
      .finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await employeeApi.updateMyProfile(values);
      setProfile(data.data.profile);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await employeeApi.uploadMyPhoto(file);
      setProfile(data.data);
      toast.success('Photo updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton />
        <div className="lg:col-span-2">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card p-6 text-center lg:col-span-1">
        <div className="relative mx-auto h-24 w-24">
          {profile?.profilePhotoUrl ? (
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.profilePhotoUrl}`}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy-100 font-display text-2xl font-semibold text-navy-700">
              {initials(authUser?.fullName)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-white hover:bg-navy-800"
            aria-label="Change photo"
            disabled={uploading}
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-ink">{authUser?.fullName}</h2>
        <p className="text-sm text-navy-500">{profileUser?.email}</p>
        <p className="mt-2 text-xs text-navy-400">Employee ID: {profileUser?.employeeId || '--'}</p>
        <div className="mt-4 space-y-1.5 border-t border-navy-100 pt-4 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-navy-500">Department</span>
            <span className="font-medium text-ink">{profile?.department || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Designation</span>
            <span className="font-medium text-ink">{profile?.designation || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Employment type</span>
            <span className="font-medium text-ink">{profile?.employmentType || '--'}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-navy-400">
          Professional details are managed by your administrator. Contact HR to request changes.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6 lg:col-span-2">
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

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
