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
import { useAuth } from '../context/AuthContext';
import { getFirebaseErrorMessage } from '../services/authService';
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
  const [apiError, setApiError] = useState<string | null>(null);
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
    } catch (err: any) {
      const msg = getFirebaseErrorMessage(err?.code || err?.message || String(err));
      setApiError(msg);
      if (err?.code?.includes('email-already-in-use')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already in use.' }));
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
              <p className="hhj-eyebrow">Begin Your Care</p>
              <h1 className="font-display font-bold text-2xl sm:text-[1.75rem] text-[var(--ink)] mt-1">
                Create Your Health Account
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Private, personal tracking tailored to your reproductive and endocrine wellness.
              </p>
            </div>

            {apiError && (
              <ErrorState error={apiError} expectedEndpoint="Firebase Auth" />
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <FormInput
                id="reg-full-name"
                label="Full name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="Dr. Jane Doe"
                icon={<User className="w-4 h-4" aria-hidden="true" />}
                error={errors.fullName}
              />

              <FormInput
                id="reg-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                icon={<Mail className="w-4 h-4" aria-hidden="true" />}
                error={errors.email}
              />

              <div className="flex flex-col gap-1.5">
                <FormInput
                  id="reg-password"
                  label="Create password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="At least 8 characters"
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

                {password && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between text-[0.7rem]">
                      <span className="text-[var(--muted)]">Security Strength:</span>
                      <span className="font-semibold text-[var(--ink)]">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--border-primary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          strength.tone === 'error'
                            ? 'bg-rose-500'
                            : strength.tone === 'secondary'
                            ? 'bg-amber-500'
                            : strength.tone === 'tertiary'
                            ? 'bg-emerald-500'
                            : 'bg-zinc-300'
                        }`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <FormInput
                id="reg-confirm-password"
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Re-enter your password"
                icon={<Lock className="w-4 h-4" aria-hidden="true" />}
                error={
                  errors.confirmPassword ||
                  (passwordsMismatch ? 'Passwords do not match.' : undefined)
                }
                trailing={
                  <div className="flex items-center gap-1">
                    {passwordsMatch && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--good)]" aria-label="Passwords match" />
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

              <div className="flex items-start gap-2 pt-1 text-xs text-[var(--muted)]">
                <input
                  id="reg-privacy"
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => {
                    setAcceptedPrivacy(e.target.checked);
                    if (errors.acceptedPrivacy) setErrors((prev) => ({ ...prev, acceptedPrivacy: '' }));
                  }}
                  className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-emerald)] cursor-pointer shrink-0"
                />
                <label htmlFor="reg-privacy" className="cursor-pointer select-none leading-relaxed">
                  I agree that my health logs will be kept private and accessible only under my authenticated account credentials.
                </label>
              </div>
              {errors.acceptedPrivacy && (
                <p className="text-xs text-[var(--bad)] -mt-2">{errors.acceptedPrivacy}</p>
              )}

              <PrimaryButton type="submit" disabled={submitting} className="w-full mt-2">
                <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </PrimaryButton>
            </form>

            <div className="pt-4 border-t border-[var(--border-primary)] text-center">
              <p className="text-xs text-[var(--muted)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--brand-emerald)] font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
