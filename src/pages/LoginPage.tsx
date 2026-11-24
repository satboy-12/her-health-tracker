import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ErrorState } from '../components/ErrorState';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextEmailErr = validateEmail(email);
    const nextPassErr = validatePassword(password, 8);
    setEmailError(nextEmailErr);
    setPasswordError(nextPassErr);
    setApiError(null);

    if (nextEmailErr || nextPassErr) {
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password, rememberMe });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err);
      } else {
        setApiError('Unable to complete sign in. Please verify your credentials and connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle emerald silk ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 15%, rgba(39, 131, 106, 0.4) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <div className="page-container flex flex-col items-center relative z-10">
        <div className="w-full max-w-[460px] flex flex-col gap-5">
          <Link
            to="/"
            className="inline-flex items-center gap-3 font-display font-bold text-lg text-[var(--ink)] self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-champagne)] rounded-xl"
          >
            <BrandLogo className="w-11 h-11" />
            <div className="flex flex-col">
              <span className="leading-tight">Her Health Journey</span>
              <span className="text-[0.65rem] tracking-wider font-semibold text-[var(--brand-jade)] uppercase">
                Know Your Body. Own Your Journey.
              </span>
            </div>
          </Link>

          <div className="hhj-card p-6 sm:p-8 flex flex-col gap-5 border border-[var(--border-primary)] shadow-[var(--shadow-card)]">
            <div>
              <p className="hhj-eyebrow">Welcome Back</p>
              <h1 className="font-display font-bold text-2xl sm:text-[1.75rem] text-[var(--ink)] mt-1">
                Sign In to Your Journal
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Enter your registered email and password to access your private wellness data.
              </p>
            </div>

            {apiError && (
              <ErrorState error={apiError} expectedEndpoint="POST /api/auth/login" />
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <FormInput
                id="login-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="name@example.com"
                icon={<Mail className="w-4 h-4" aria-hidden="true" />}
                error={emailError}
              />

              <div className="flex flex-col gap-1">
                <FormInput
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter your password"
                  icon={<Lock className="w-4 h-4" aria-hidden="true" />}
                  error={passwordError}
                  trailing={
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  }
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-[var(--muted)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--brand-emerald)] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="font-semibold text-[var(--brand-emerald)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {forgotPasswordOpen && (
                <div className="p-3.5 rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-strong)] text-xs text-[var(--text-secondary)] flex flex-col gap-1.5">
                  <strong className="text-[var(--text-primary)]">Password Reset Assistance</strong>
                  <p>
                    For your privacy, account access resets require email verification through your backend administrator or clinical portal. Please contact <span className="font-semibold text-[var(--brand-emerald)]">support@herhealthjourney.com</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="self-end font-semibold text-[var(--brand-jade)] hover:underline pt-1 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <PrimaryButton type="submit" disabled={submitting} className="w-full mt-2">
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </PrimaryButton>
            </form>

            <div className="pt-4 border-t border-[var(--border-primary)] text-center">
              <p className="text-xs text-[var(--muted)]">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-[var(--brand-emerald)] font-bold hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
