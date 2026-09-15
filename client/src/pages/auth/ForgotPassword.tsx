import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/axiosClient';

const schema = z.object({ email: z.string().email('Enter a valid email address.') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { data } = await authApi.forgotPassword(values.email);
      setSent(true);
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If an account exists for that email, we've sent a reset link.">
        {devResetUrl && (
          <div className="rounded-md bg-warning-light px-3 py-3 text-sm text-warning">
            <p className="font-medium">Development mode: SMTP is not configured.</p>
            <p className="mt-1">
              Use this link directly:{' '}
              <Link to={devResetUrl.replace(window.location.origin, '')} className="underline">
                Reset password
              </Link>
            </p>
          </div>
        )}
        <Link to="/login" className="btn-secondary mt-6 w-full">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="input" placeholder="you@company.com" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        {serverError && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">{serverError}</p>}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-navy-500">
        <Link to="/login" className="font-medium text-navy-700 hover:text-navy-900">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
