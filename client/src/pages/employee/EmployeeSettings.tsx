import ChangePasswordCard from '../../components/common/ChangePasswordCard';

export default function EmployeeSettings() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <ChangePasswordCard />
      <div className="card p-6 text-sm text-navy-500">
        Notification and office-policy settings are managed by your administrator.
      </div>
    </div>
  );
}
