import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Download,
  LogOut,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { SafeImage } from '../components/SafeImage';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { profileService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types/api';
import { validateEmail } from '../utils/validation';

const PROFILE_PORTRAIT_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcljPLoRS4cWRi-G-XMHyjQcPVnzZGvnEMNYEA0ZXcBvuIx9Q6JQydBnxKJMmFZUbj7ZPpPhOLHAu6SYzvnRDviuRww3-39ONH44lho97ku9J28MI5xYMBLEoeDH2GxN9kI5fVpzI_ZCs7Uft6Muro7pY2oR_Vh3Z-9gaLI7GHIXvnegQVy0mIlDDm-tCQ9lGymm-C66zHDB4j1ZGT_b-7AgVrR93mLwbjSsKE-2w';

export function ProfilePage() {
  const { user, logout, isPreviewMode, exitPreviewMode } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cycleReminders, setCycleReminders] = useState(true);
  const [medicationAlerts, setMedicationAlerts] = useState(true);
  const [hydrationNudges, setHydrationNudges] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const applyProfileFields = useCallback((p: UserProfile) => {
    setFullName(p.fullName || '');
    setEmail(p.email || '');
    setDateOfBirth(p.dateOfBirth || '');
    setPhoneNumber(p.phoneNumber || '');
    setCycleReminders(Boolean(p.preferences?.cycleReminders));
    setMedicationAlerts(Boolean(p.preferences?.medicationAlerts));
    setHydrationNudges(Boolean(p.preferences?.hydrationNudges));
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await profileService.get();
      setProfile(data);
      applyProfileFields(data);
    } catch (err) {
      setProfile(null);
      if (user) {
        setFullName(user.fullName);
        setEmail(user.email);
      }
      setApiError(err instanceof ApiError ? err : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [applyProfileFields, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const updated = await profileService.update({
        fullName: fullName.trim(),
        email: email.trim(),
        dateOfBirth,
        phoneNumber: phoneNumber.trim(),
        preferences: {
          cycleReminders,
          medicationAlerts,
          hydrationNudges,
        },
      });
      setProfile(updated);
      applyProfileFields(updated);
      setToast({ message: 'Profile and preferences saved.', variant: 'success' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Unable to save profile changes.';
      setFormError(msg);
      setToast({ message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!profile) {
      setToast({
        message: 'No profile record loaded from GET /api/profile to export yet.',
        variant: 'error',
      });
      return;
    }
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'her-health-profile.json';
    link.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Profile record exported as JSON.', variant: 'success' });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await profileService.deleteAccount();
      setDeleteDialogOpen(false);
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteDialogOpen(false);
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to delete account.',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    if (isPreviewMode && !user) {
      exitPreviewMode();
      navigate('/login', { replace: true });
      return;
    }
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-tint">
              Account Management
            </p>
            <h1 className="font-display text-3xl font-semibold text-on-surface mt-1">
              Profile &amp; Settings
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage your personal details, notification preferences, and session controls.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                if (profile) {
                  applyProfileFields(profile);
                  setToast({ message: 'Reverted unsaved changes.', variant: 'success' });
                } else {
                  setFullName(user?.fullName || '');
                  setEmail(user?.email || '');
                  setDateOfBirth('');
                  setPhoneNumber('');
                  setToast({ message: 'Cleared unsaved draft fields.', variant: 'success' });
                }
              }}
              className="px-4 py-2 bg-surface-container-high text-on-surface text-sm font-medium rounded-xl hover:bg-surface-container-highest cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              form="profile-settings-form"
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint="GET /api/profile"
          onRetry={loadProfile}
          retrying={loading}
        />

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Summary Card */}
            <div className="space-y-6">
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-20 bg-primary-fixed/60" />
                <div className="relative mt-6 mb-4">
                  <div className="w-24 h-24 rounded-full p-1 bg-surface-container-lowest border border-outline-variant overflow-hidden">
                    <SafeImage
                      src={PROFILE_PORTRAIT_URL}
                      alt="Account holder portrait"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
                <h2 className="font-display text-xl font-semibold text-on-surface">
                  {fullName || 'Account Not Loaded'}
                </h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {email || 'Connect GET /api/profile'}
                </p>

                <div className="w-full grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-outline-variant/60 text-xs">
                  <div>
                    <span className="text-on-surface-variant block">Member Since</span>
                    <span className="font-semibold text-on-surface mt-0.5 block">
                      {profile?.memberSince ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Account Tier</span>
                    <span className="font-semibold text-primary mt-0.5 block">
                      {profile?.accountTier ?? '—'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-on-surface">
                    Security Overview
                  </h3>
                  <ShieldCheck className="w-5 h-5 text-tertiary" aria-hidden="true" />
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Session Storage</span>
                    <span className="font-medium text-tertiary">In-Memory Only</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Two-Factor Auth</span>
                    <span className="font-medium text-on-surface">
                      {profile ? (profile.twoFactorEnabled ? 'Enabled' : 'Disabled') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Password Updated</span>
                    <span className="font-medium text-on-surface">
                      {profile?.passwordLastChanged ?? '—'}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Forms & Controls */}
            <div className="lg:col-span-2 space-y-6">
              <form id="profile-settings-form" onSubmit={handleSave} className="space-y-6">
                <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                      <User className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-on-surface">
                        Personal Details
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Update your personal identification details (PUT /api/profile).
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <p className="text-xs text-error" role="alert">
                      {formError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="prof-name" className="block text-xs font-medium text-on-surface-variant mb-1">
                        Full Name
                      </label>
                      <input
                        id="prof-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                      />
                    </div>
                    <div>
                      <label htmlFor="prof-email" className="block text-xs font-medium text-on-surface-variant mb-1">
                        Email Address
                      </label>
                      <input
                        id="prof-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                      />
                    </div>
                    <div>
                      <label htmlFor="prof-dob" className="block text-xs font-medium text-on-surface-variant mb-1">
                        Date of Birth
                      </label>
                      <input
                        id="prof-dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                      />
                    </div>
                    <div>
                      <label htmlFor="prof-phone" className="block text-xs font-medium text-on-surface-variant mb-1">
                        Phone Number
                      </label>
                      <input
                        id="prof-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                      <Bell className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-on-surface">
                        Preferences &amp; Reminders
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Choose which cycle and wellness reminders to enable.
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-outline-variant/60">
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          Cycle Predictions &amp; Reminders
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Notify ahead of estimated cycle start dates.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Cycle Predictions and Reminders"
                        checked={cycleReminders}
                        onChange={(e) => setCycleReminders(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          Medication &amp; Supplement Alerts
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Daily schedule reminders for supplements or prescriptions.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Medication and Supplement Alerts"
                        checked={medicationAlerts}
                        onChange={(e) => setMedicationAlerts(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-on-surface">Hydration Nudges</p>
                        <p className="text-xs text-on-surface-variant">
                          Gentle daytime reminders to log water intake.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Hydration Nudges"
                        checked={hydrationNudges}
                        onChange={(e) => setHydrationNudges(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </section>
              </form>

              {/* Privacy & Data Actions */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Export Profile Record</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Download your loaded Spring Boot profile payload as a JSON file.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="self-start px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-medium text-on-surface hover:bg-surface-container-high inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Export Data
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-error">Delete Account</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Request permanent removal of your account via DELETE /api/profile.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="self-start px-3.5 py-2 rounded-xl bg-error-container text-on-error-container text-xs font-medium hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete Account
                  </button>
                </div>
              </section>

              {/* Logout */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-on-surface">
                    Session Control
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Sign out via POST /api/auth/logout and clear your in-memory token.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-error hover:text-on-error text-on-surface text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>{isPreviewMode && !user ? 'Exit Preview' : 'Logout'}</span>
                </button>
              </section>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Account & Health Records"
        description="Are you sure you want to permanently delete your account via DELETE /api/profile? This action cannot be undone."
        confirmLabel="Delete Account"
        destructive
        busy={deleting}
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <ToastBanner
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </AppShell>
  );
}
