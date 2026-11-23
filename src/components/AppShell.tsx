import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Droplets,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Smile,
  User,
  UserCircle,
  Utensils,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/client';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
  { to: '/period-tracker', label: 'Period Tracker', shortLabel: 'Period', icon: CalendarDays },
  { to: '/pcos-tracker', label: 'PCOS Symptom Tracker', shortLabel: 'PCOS', icon: HeartPulse },
  { to: '/wellness', label: 'Mood & Wellness', shortLabel: 'Mood', icon: Smile },
  { to: '/nutrition', label: 'Nutrition & Diet', shortLabel: 'Diet', icon: Utensils },
  { to: '/water', label: 'Water Tracker', shortLabel: 'Water', icon: Droplets },
  { to: '/journal', label: 'Health Journal', shortLabel: 'Journal', icon: BookOpen },
  { to: '/profile', label: 'Profile', shortLabel: 'Profile', icon: UserCircle },
];

const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[7],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isPreviewMode, logout, exitPreviewMode } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  const handleSignOut = async () => {
    if (isPreviewMode && !user) {
      exitPreviewMode();
      navigate('/login');
      return;
    }
    await logout();
    navigate('/login');
  };

  const baseUrl = getApiBaseUrl();

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-low border-r border-outline-variant/60 z-40 flex-col py-8"
      >
        <div className="px-6 mb-8 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <BrandLogo className="h-8 w-8" />
            <span className="font-display text-lg font-semibold text-on-surface whitespace-nowrap">
              Her Health
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto" aria-label="Health modules">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 pt-4 border-t border-outline-variant/60">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" aria-hidden="true" />
            <span>{isPreviewMode && !user ? 'Exit Preview' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/50 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg hover:bg-surface-container-high text-on-surface cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <BrandLogo className="h-7 w-7" />
              <span className="font-display text-base font-semibold text-on-surface whitespace-nowrap">
                Her Health
              </span>
            </Link>
            {isPreviewMode && !user && (
              <span className="hidden sm:inline-block text-xs font-medium text-primary">
                UI Layout Preview (Spring Boot API Disconnected)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto relative">
            <button
              type="button"
              aria-label="API connection and reminders overview"
              aria-expanded={statusPopoverOpen}
              onClick={() => setStatusPopoverOpen((prev) => !prev)}
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
            </button>

            <Link
              to="/profile"
              aria-label="Open profile settings"
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors"
            >
              <User className="w-4 h-4" aria-hidden="true" />
            </Link>

            {statusPopoverOpen && (
              <div
                role="region"
                aria-label="Backend integration status"
                className="absolute right-0 top-12 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-4 z-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-on-surface">
                    API &amp; Session Status
                  </span>
                  <button
                    type="button"
                    aria-label="Close status popover"
                    onClick={() => setStatusPopoverOpen(false)}
                    className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="text-xs text-on-surface-variant space-y-2">
                  <p>
                    <span className="font-medium text-on-surface">Session:</span>{' '}
                    {user ? `Authenticated (${user.email})` : 'Offline UI Preview'}
                  </p>
                  <p>
                    <span className="font-medium text-on-surface">Spring Boot Base URL:</span>{' '}
                    <code className="font-mono text-primary">
                      {baseUrl || 'Not configured (VITE_API_BASE_URL empty)'}
                    </code>
                  </p>
                  <div className="pt-2 border-t border-outline-variant/60 flex justify-between items-center">
                    <Link
                      to="/profile"
                      onClick={() => setStatusPopoverOpen(false)}
                      className="text-primary font-medium hover:underline"
                    >
                      Manage Preferences
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
                    >
                      {user ? 'Log out' : 'Go to Login'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[85vw] bg-surface-container-low h-full p-6 flex flex-col z-10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BrandLogo className="h-8 w-8" />
                  <span className="font-display text-lg font-semibold text-on-surface">
                    Her Health
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 mr-3 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 flex items-center px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
              >
                <LogOut className="w-5 h-5 mr-3 shrink-0" aria-hidden="true" />
                <span>{isPreviewMode && !user ? 'Exit Preview' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 pt-16 pb-20 lg:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-outline-variant z-30 flex items-center justify-around px-1"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] py-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span>{item.shortLabel}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
