import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export function LoginPage() {
  const { login, enterPreviewMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        setApiError('Unable to complete sign in. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPreview = () => {
    enterPreviewMode();
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-8 sm:p-10 relative z-10 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <BrandLogo className="w-12 h-12" />
          </Link>
          <span className="text-xs font-medium tracking-widest uppercase text-surface-tint">
            Her Health Journey
          </span>
          <h1 className="font-display text-2xl font-semibold text-on-surface">Welcome back</h1>
          <p className="text-sm text-on-surface-variant">
            Sign in to access your personal wellness portal and care timeline.
          </p>
        </div>

        {apiError && (
          <ApiIntegrationBanner error={apiError} expectedEndpoint="POST /api/auth/login" />
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-on-surface">
              Email address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-outline absolute left-3.5" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="name@example.com"
                aria-invalid={Boolean(emailError)}
                className={`w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-xl text-sm text-on-surface border outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 ${
                  emailError ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
            </div>
            {emailError && (
              <p className="text-xs text-error" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-on-surface">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-outline absolute left-3.5" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter your password"
                aria-invalid={Boolean(passwordError)}
                className={`w-full bg-surface-container-low pl-10 pr-11 py-2.5 rounded-xl text-sm text-on-surface border outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 ${
                  passwordError ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-error" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-primary cursor-pointer"
            />
            <span>Keep session preference for this visit</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-dusty hover:bg-primary text-on-primary font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="pt-4 border-t border-outline-variant/60 space-y-3 text-center">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="text-xs font-medium text-on-surface-variant hover:text-primary underline cursor-pointer"
            >
              Preview Protected UI Screens (Backend Disconnected)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
