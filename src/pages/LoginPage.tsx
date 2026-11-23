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
  const { login, loginWithGoogle, enterPreviewMode } = useAuth();
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
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleGoogleSignIn = async () => {
    setApiError(null);
    setGoogleBusy(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setApiError(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center py-8 sm:py-12">
      <div className="page-container flex flex-col items-center">
        <div className="w-full max-w-[460px] flex flex-col gap-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-display font-bold text-[var(--ink)] self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-champagne)] rounded-xl"
          >
            <BrandLogo className="w-9 h-9" />
            <span>Her Health Journey</span>
          </Link>

          <div className="hhj-card p-5 sm:p-8 flex flex-col gap-5">
            <div>
              <p className="hhj-eyebrow">Welcome back</p>
              <h1 className="font-display font-bold text-2xl sm:text-[1.75rem] text-[var(--ink)] mt-1">
                Sign in to your journal
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Sign in with Google to sync with Cloud Firestore, or use your Spring Boot account credentials.
              </p>
            </div>

            {apiError && (
              <ErrorState error={apiError} expectedEndpoint="Firebase Auth / POST /api/auth/login" />
            )}

            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={googleBusy || submitting}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {googleBusy ? 'Connecting to Google...' : 'Sign in with Google'}
                </span>
                <span style={{ display: 'none' }}>Sign in with Google</span>
              </div>
            </button>

            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span>or Spring Boot credentials</span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

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

              <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--plum)] cursor-pointer"
                />
                <span>Keep session preference for this visit</span>
              </label>

              <PrimaryButton type="submit" disabled={submitting} className="w-full">
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </PrimaryButton>
            </form>

            <div className="pt-4 border-t border-[var(--line)] space-y-2.5 text-center">
              <p className="text-xs text-[var(--muted)]">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-[var(--plum)] font-bold hover:underline">
                  Create account
                </Link>
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--plum)] underline cursor-pointer"
                >
                  Preview Protected UI Screens (Backend Disconnected)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
