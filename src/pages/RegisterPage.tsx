import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  evaluatePasswordStrength,
  validateRegistrationForm,
} from '../utils/validation';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<ApiError | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegistrationForm({
      fullName,
      email,
      password,
      confirmPassword,
      acceptedPrivacy,
    });
    setErrors(validationErrors);
    setApiError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err);
        if (err.fieldErrors) {
          setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
        }
      } else {
        setApiError('Unable to complete registration. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-8 sm:p-10 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <BrandLogo className="w-12 h-12" />
          </Link>
          <h1 className="font-display text-2xl font-semibold text-on-surface">
            Her Health Journey
          </h1>
          <p className="text-sm text-on-surface-variant">
            Create your secure, private health account
          </p>
        </div>

        {apiError && (
          <ApiIntegrationBanner error={apiError} expectedEndpoint="POST /api/auth/register" />
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-fullname" className="text-xs font-medium text-on-surface-variant">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-outline absolute left-3.5" aria-hidden="true" />
              <input
                id="reg-fullname"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' }));
                }}
                placeholder="Eleanor Vance"
                className={`w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-xl text-sm text-on-surface border outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 ${
                  errors.fullName ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-error" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-xs font-medium text-on-surface-variant">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-outline absolute left-3.5" aria-hidden="true" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                }}
                placeholder="jane.doe@example.com"
                className={`w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-xl text-sm text-on-surface border outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 ${
                  errors.email ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-password" className="text-xs font-medium text-on-surface-variant">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-outline absolute left-3.5" aria-hidden="true" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                }}
                placeholder="Create a strong password"
                className={`w-full bg-surface-container-low pl-10 pr-11 py-2.5 rounded-xl text-sm text-on-surface border outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 ${
                  errors.password ? 'border-error' : 'border-outline-variant focus:border-primary'
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
            <div className="space-y-1 pt-0.5">
              <div className="flex gap-1 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((segment) => (
                  <div
                    key={segment}
                    className={`w-1/4 transition-colors ${
                      segment <= strength.score ? 'bg-tertiary' : 'bg-surface-container-high'
                    }`}
                  />
                ))}
              </div>
              <p
                className={`text-xs ${
                  strength.tone === 'error'
                    ? 'text-error'
                    : strength.tone === 'secondary'
                    ? 'text-secondary'
                    : strength.tone === 'tertiary'
                    ? 'text-tertiary'
                    : 'text-outline'
                }`}
              >
                {strength.label}
              </p>
            </div>
            {errors.password && (
              <p className="text-xs text-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-confirm-password"
              className="text-xs font-medium text-on-surface-variant"
            >
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-outline absolute left-3.5" aria-hidden="true" />
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }));
                }}
                placeholder="Re-enter your password"
                className={`w-full bg-surface-container-low pl-10 pr-16 py-2.5 rounded-xl text-sm text-on-surface border outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 ${
                  passwordsMismatch || errors.confirmPassword
                    ? 'border-error'
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              <div className="absolute right-3 flex items-center gap-1">
                {passwordsMatch && (
                  <CheckCircle2 className="w-4 h-4 text-tertiary" aria-hidden="true" />
                )}
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="p-1 text-outline hover:text-on-surface cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {(passwordsMismatch || errors.confirmPassword) && (
              <p className="text-xs text-error" role="alert">
                {errors.confirmPassword || 'Passwords do not match.'}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2.5 text-xs text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => {
                  setAcceptedPrivacy(e.target.checked);
                  if (errors.acceptedPrivacy) setErrors((p) => ({ ...p, acceptedPrivacy: '' }));
                }}
                className="w-4 h-4 mt-0.5 rounded accent-primary cursor-pointer"
              />
              <span>
                I consent to private health record processing through my Spring Boot backend account.
              </span>
            </label>
            {errors.acceptedPrivacy && (
              <p className="text-xs text-error" role="alert">
                {errors.acceptedPrivacy}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-1 py-3 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-outline-variant/60 text-xs text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
