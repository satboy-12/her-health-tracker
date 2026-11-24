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
import { ErrorState } from '../components/ErrorState';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
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
        <div className="w-full max-w-[500px] flex flex-col gap-5">
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
              <p className="hhj-eyebrow">Quick Setup</p>
              <h1 className="font-display font-bold text-2xl sm:text-[1.75rem] text-[var(--ink)] mt-1">
                Create Your Account
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Begin your private, encrypted health journey with dedicated email and password credentials.
              </p>
            </div>

            {apiError && (
              <ErrorState error={apiError} expectedEndpoint="POST /api/auth/register" />
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <FormInput
                id="reg-fullname"
                label="Full Name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.fullName;
                      return next;
                    });
                  }
                }}
                placeholder="Jane Doe"
                icon={<User className="w-4 h-4" aria-hidden="true" />}
                error={errors.fullName}
              />

              <FormInput
                id="reg-email"
                label="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
                placeholder="jane@example.com"
                icon={<Mail className="w-4 h-4" aria-hidden="true" />}
                error={errors.email}
              />

              <div className="flex flex-col gap-1.5">
                <FormInput
                  id="reg-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.password;
                        return next;
                      });
                    }
                  }}
                  placeholder="Minimum 8 characters"
                  icon={<Lock className="w-4 h-4" aria-hidden="true" />}
                  error={errors.password}
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

                {password.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden flex gap-0.5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 1 ? 'w-1/3 bg-[#E58B91]' : 'w-0'
                        } ${strength.score >= 2 ? 'bg-[#D8AA65]' : ''} ${
                          strength.score >= 3 ? 'bg-[#27836A]' : ''
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 2 ? 'w-1/3 bg-[#D8AA65]' : 'w-0'
                        } ${strength.score >= 3 ? 'bg-[#27836A]' : ''}`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 3 ? 'w-1/3 bg-[#27836A]' : 'w-0'
                        }`}
                      />
                    </div>
                    <span className="font-semibold text-[var(--muted)] capitalize">
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <FormInput
                id="reg-confirm-password"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.confirmPassword;
                      return next;
                    });
                  }
                }}
                placeholder="Re-enter your password"
                icon={<Lock className="w-4 h-4" aria-hidden="true" />}
                error={errors.confirmPassword}
                trailing={
                  <div className="flex items-center gap-1">
                    {passwordsMatch && (
                      <CheckCircle2
                        className="w-4 h-4 text-[#287B52]"
                        aria-label="Passwords match"
                      />
                    )}
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                }
              />
              {passwordsMismatch && (
                <p className="text-xs text-[var(--status-error)] -mt-2">Passwords do not match.</p>
              )}

              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[var(--muted)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => {
                      setAcceptedPrivacy(e.target.checked);
                      if (errors.acceptedPrivacy) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.acceptedPrivacy;
                          return next;
                        });
                      }
                    }}
                    className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-emerald)] cursor-pointer shrink-0"
                  />
                  <span>
                    I accept the{' '}
                    <strong className="text-[var(--ink)]">Terms of Service</strong> and acknowledge the{' '}
                    <strong className="text-[var(--ink)]">Privacy Policy</strong>. My wellness data is stored privately and securely.
                  </span>
                </label>
                {errors.acceptedPrivacy && (
                  <p className="text-xs text-[var(--status-error)] mt-1.5">{errors.acceptedPrivacy}</p>
                )}
              </div>

              <PrimaryButton type="submit" disabled={submitting} className="w-full mt-2">
                <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </PrimaryButton>
            </form>

            <div className="pt-4 border-t border-[var(--border-primary)] text-center">
              <p className="text-xs text-[var(--muted)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--brand-emerald)] font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
