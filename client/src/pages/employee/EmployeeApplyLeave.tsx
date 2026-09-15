import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { leaveApi } from '../../api/leaves';
import { getErrorMessage } from '../../api/axiosClient';

interface FormValues {
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDaySession: 'FIRST_HALF' | 'SECOND_HALF' | '';
  reason: string;
}

export default function EmployeeApplyLeave() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attachment, setAttachment] = useState<File | null>(null);
  const [serverError, setServerError] = useState('');

  const { data: leaveTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveApi.types().then((r) => r.data.data),
  });

  const noLeaveTypes = !typesLoading && (leaveTypes?.length ?? 0) === 0;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { isHalfDay: false, halfDaySession: '', leaveType: '', startDate: '', endDate: '', reason: '' },
  });

  const isHalfDay = watch('isHalfDay');
  const selectedTypeId = watch('leaveType');
  const selectedType = leaveTypes?.find((t) => t._id === selectedTypeId);

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      let attachmentUrl: string | undefined;
      if (attachment) {
        const { data } = await leaveApi.uploadAttachment(attachment);
        attachmentUrl = data.data.url;
      }
      await leaveApi.apply({
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.isHalfDay ? values.startDate : values.endDate,
        isHalfDay: values.isHalfDay,
        halfDaySession: values.isHalfDay ? (values.halfDaySession as 'FIRST_HALF' | 'SECOND_HALF') : undefined,
        reason: values.reason,
        attachmentUrl,
      });
      toast.success('Leave request submitted.');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      navigate('/employee/my-leaves');
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
                {noLeaveTypes && (
          <div className="rounded-md bg-warning-light px-3 py-3 text-sm text-warning">
            <p className="font-medium">No leave types have been configured yet.</p>
            <p className="mt-1">
              Ask your administrator to add leave types from Leaves &rarr; Manage leave types before applying.
            </p>
          </div>
        )}

        <div>
          <label className="label">Leave type</label>
          <select
            className="input"
            disabled={typesLoading || noLeaveTypes}
            {...register('leaveType', { required: 'Select a leave type.' })}
          >
            <option value="">
              {typesLoading
                ? 'Loading leave types...'
                : noLeaveTypes
                  ? 'No leave types available'
                  : 'Select leave type'}
            </option>
            {leaveTypes?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          {errors.leaveType && <p className="mt-1 text-xs text-danger">{errors.leaveType.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="isHalfDay"
            render={({ field }) => (
              <input
                id="isHalfDay"
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-400"
                disabled={selectedType ? !selectedType.allowHalfDay : false}
              />
            )}
          />
          <label htmlFor="isHalfDay" className="text-sm text-navy-700">
            This is a half-day leave
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{isHalfDay ? 'Date' : 'Start date'}</label>
            <input type="date" className="input" {...register('startDate', { required: 'Start date is required.' })} />
            {errors.startDate && <p className="mt-1 text-xs text-danger">{errors.startDate.message}</p>}
          </div>
          {!isHalfDay && (
            <div>
              <label className="label">End date</label>
              <input type="date" className="input" {...register('endDate', { required: 'End date is required.' })} />
              {errors.endDate && <p className="mt-1 text-xs text-danger">{errors.endDate.message}</p>}
            </div>
          )}
        </div>

        {isHalfDay && (
          <div>
            <label className="label">Half-day session</label>
            <select className="input" {...register('halfDaySession', { required: isHalfDay ? 'Select a session.' : false })}>
              <option value="">Select session</option>
              <option value="FIRST_HALF">First half</option>
              <option value="SECOND_HALF">Second half</option>
            </select>
            {errors.halfDaySession && <p className="mt-1 text-xs text-danger">{errors.halfDaySession.message}</p>}
          </div>
        )}

        <div>
          <label className="label">Reason</label>
          <textarea className="input" rows={3} {...register('reason', { required: 'A reason is required.' })} />
          {errors.reason && <p className="mt-1 text-xs text-danger">{errors.reason.message}</p>}
        </div>

        <div>
          <label className="label">
            Attachment {selectedType?.requiresAttachment && <span className="text-danger">*</span>}
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            className="block w-full text-sm text-navy-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-200"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
          />
        </div>

        {serverError && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">{serverError}</p>}

        <button type="submit" className="btn-primary" disabled={isSubmitting || noLeaveTypes}>
          {isSubmitting ? 'Submitting...' : 'Submit leave request'}
        </button>
      </form>
    </div>
  );
}
