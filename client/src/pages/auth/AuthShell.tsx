import type { ReactNode } from 'react';

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brass-400 font-display text-xl font-bold text-navy-900">
            S
          </div>
          <span className="font-display text-2xl font-bold text-white">SSM</span>
        </div>
        <div className="rounded-xl border border-navy-800 bg-white p-7 shadow-popover sm:p-8">
          <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-navy-400">&copy; {new Date().getFullYear()} SSM. All rights reserved.</p>
      </div>
    </div>
  );
}
