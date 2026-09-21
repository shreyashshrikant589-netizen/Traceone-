import { Eye, EyeOff, Lock, Mail, ShieldCheck, TriangleAlert } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@traceone.io');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await login({ email, password });

    if (!response.ok) {
      setError(response.message ?? 'Invalid credentials. Please check your email and password.');
      setIsSubmitting(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('traceone-admin-remembered', email);
    } else {
      localStorage.removeItem('traceone-admin-remembered');
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-xl font-bold text-white">T</div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue">TraceOne</div>
          <h1 className="mt-2 text-3xl font-semibold text-navy">Admin Command Center</h1>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 outline-none transition focus:border-blue focus:bg-white focus:ring-2 focus:ring-blue/20"
                placeholder="admin@traceone.io"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-slate-900 outline-none transition focus:border-blue focus:bg-white focus:ring-2 focus:ring-blue/20"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
              />
              Remember me
            </label>

            <button type="button" className="text-sm font-medium text-blue hover:text-navy">
              Forgot password?
            </button>
          </div>

          {error && (
            <div id="login-error" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-navy px-4 py-3 text-base font-semibold text-white transition hover:bg-[#0b1736] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-teal/20 bg-teal/5 p-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-teal" size={18} />
            <div>
              <div className="text-sm font-semibold text-navy">Security notice</div>
              <p className="mt-1 text-sm text-slate-600">All admin access is monitored and protected by role-based approvals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
