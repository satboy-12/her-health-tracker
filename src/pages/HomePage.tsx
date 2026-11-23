import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Droplets,
  HeartPulse,
  Lock,
  Shield,
  ShieldCheck,
  Smile,
  Utensils,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';

const HERO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrYaPjMYNUKO3ecUmmmotRJp5ZPKZheEXRuEySOlgj4bBCgR4_Vk1iLLt3MmiVsJTGA7NjZp7k12OhX20Wk53Y86Do31o9O3OcpVPXm3gOsp640n_nUZF4Lwqc2uGBTucEngKO5xg4BvRoLtuDne6M7besD9BXn_CWWnDhrQ1M7asMeuQ4OUd3F1X5TqAldUJfJwT-0rvsovnUfpGBoyziifVw0UeGxJCcKCA_lmc';

const DOCTOR_PORTRAIT_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA2FVz3MwlN0_MG7jvoZ5eSSrrJ-zfFGQuaD6Dc0Ut_8JnOr2GU5NYru7DVcbShS6bMlnUYkUD4n7s_K3xx3epLBeJ6IUlmRGGsxXYSPMyKDcQdDo_BXSvYEbLBUhLMBex6JMYC9_Cm4CC7vW6qLpZlTcpmfVRvK-E53b8i0brR0_PP4ky7QxIpqjXL9dBzpOS-jL_DxtucahGgjalYJXxSL3JVXMTQL0bnZ4BjFuM';

const MODULES = [
  {
    title: 'Period Tracker',
    description:
      'Log period start and end dates, review full cycle history, compute average cycle length, and view approximate upcoming cycle windows.',
    path: '/period-tracker',
    icon: CalendarDays,
    accentBg: 'bg-primary-fixed text-primary',
  },
  {
    title: 'PCOS Symptom Tracker',
    description:
      'Document acne, fatigue, cramping, pain levels, energy scores, and personal clinical observations with longitudinal symptom trends.',
    path: '/pcos-tracker',
    icon: HeartPulse,
    accentBg: 'bg-secondary-fixed text-secondary',
  },
  {
    title: 'Mood & Wellness',
    description:
      'Track daily mood states, sleep duration, sleep quality, stress index, and daily wellness notes in one calm record.',
    path: '/wellness',
    icon: Smile,
    accentBg: 'bg-tertiary-fixed text-tertiary',
  },
  {
    title: 'Nutrition & Diet',
    description:
      'Organize breakfast, lunch, dinner, and snacks into a structured food diary with macronutrient summaries and meal history.',
    path: '/nutrition',
    icon: Utensils,
    accentBg: 'bg-primary-fixed text-primary',
  },
  {
    title: 'Water Tracker',
    description:
      'Set your daily hydration target, record intake amounts throughout the day, monitor progress, and inspect historical hydration logs.',
    path: '/water',
    icon: Droplets,
    accentBg: 'bg-secondary-fixed text-secondary',
  },
  {
    title: 'Health Journal',
    description:
      'Create, edit, search, and manage private date-stamped journal entries for reflections, cycle notes, and practitioner visits.',
    path: '/journal',
    icon: BookOpen,
    accentBg: 'bg-tertiary-fixed text-tertiary',
  },
];

export function HomePage() {
  const { isAuthenticated, enterPreviewMode } = useAuth();
  const navigate = useNavigate();

  const handleExploreModule = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
      return;
    }
    enterPreviewMode();
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/60">
        <div className="h-16 max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="flex items-center gap-3 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <BrandLogo className="h-8 w-8" />
            <span className="font-display text-lg font-semibold text-on-surface">
              Her Health Journey
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant"
          >
            <a href="#modules" className="hover:text-on-surface transition-colors whitespace-nowrap shrink-0">
              Modules
            </a>
            <a href="#privacy" className="hover:text-on-surface transition-colors whitespace-nowrap shrink-0">
              Privacy
            </a>
            <Link to="/login" className="hover:text-on-surface transition-colors whitespace-nowrap shrink-0">
              Login
            </Link>
            <Link to="/register" className="hover:text-on-surface transition-colors whitespace-nowrap shrink-0">
              Registration
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Open Portal' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative bg-surface-container-low px-6 py-16 lg:py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col items-start gap-5">
              <p className="text-xs font-medium tracking-wider uppercase text-primary">
                Women&apos;s Health &amp; Cycle Intelligence
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-on-surface tracking-tight text-balance">
                Empowering Your <span className="text-primary">Health Journey</span>
              </h1>
              <p className="text-sm font-medium text-on-surface-variant tracking-wide">
                Period Tracking · PCOS Symptoms · Mood &amp; Wellness · Nutrition · Hydration · Health Journal
              </p>
              <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
                A structured digital health workspace built to help you record menstrual cycles, monitor PCOS symptoms, track nutrition and daily hydration, and maintain private wellness notes connected to your secure Spring Boot health profile.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors shadow-sm inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    enterPreviewMode();
                    navigate('/dashboard');
                  }}
                  className="px-4 py-3 text-sm font-medium text-primary hover:underline cursor-pointer whitespace-nowrap"
                >
                  Explore UI Modules
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-tertiary" aria-hidden="true" />
                  Private Personal Records
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-tertiary" aria-hidden="true" />
                  Authenticated Spring Boot API Client
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden shadow-lg border border-outline-variant/60 relative bg-surface-container-lowest">
                <SafeImage
                  src={HERO_IMAGE_URL}
                  alt="Her Health Journey tablet workspace in warm natural lighting"
                  className="w-full h-full object-cover"
                  fallbackLabel="Her Health Journey Workspace"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                  <div className="bg-surface-container-lowest/95 backdrop-blur-sm p-4 rounded-xl w-full border border-outline-variant/40">
                    <div className="text-sm font-semibold text-on-surface">
                      Holistic Cycle &amp; Wellness Portal
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Unified period calendar, symptom logs, nutrition diary, hydration goals, and private reflections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Six Core Tracking Modules */}
        <section id="modules" className="py-16 lg:py-20 px-6 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">
                Comprehensive Care
              </p>
              <h2 className="font-display text-3xl font-semibold text-on-surface text-balance">
                Six Core Tracking Modules
              </h2>
              <p className="text-base text-on-surface-variant mt-2">
                Structured daily logs and historical clarity tailored for every phase of your wellness journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.title}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between transition-colors hover:border-primary/40"
                  >
                    <div>
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${mod.accentBg}`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-on-surface mb-2">
                        {mod.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={() => handleExploreModule(mod.path)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
                      >
                        <span>Open module</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Privacy and Data Security Guarantee */}
        <section id="privacy" className="py-16 lg:py-20 px-6 bg-surface-container-low">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Privacy &amp; Ownership
              </p>
              <h2 className="font-display text-3xl font-semibold text-on-surface text-balance">
                Your Health Data Belongs to You Alone
              </h2>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Women&apos;s health records deserve uncompromising confidentiality. Her Health Journey acts strictly as an authenticated frontend client communicating directly with your protected Java Spring Boot REST API—never storing personal medical records in browser local storage or sharing data with third-party brokers.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">
                      In-Memory Session Token Handling
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Authentication tokens stay in memory and are cleared immediately upon sign-out.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">
                      Direct Spring Boot REST Persistence
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Cycle logs, PCOS indicators, nutrition, and journal records persist exclusively in your backend database.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">
                      Full Record Portability &amp; Deletion
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Manage notification preferences, review personal data, or delete your account anytime from Profile settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                    <ShieldCheck className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-on-surface">
                      Clinical Privacy Standard
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Designed for calm, transparent personal health stewardship
                    </p>
                  </div>
                </div>

                <blockquote className="text-base text-on-surface leading-relaxed">
                  &ldquo;Consistent, structured tracking across menstrual cycles, PCOS symptoms, sleep, and nutrition empowers meaningful, evidence-informed conversations during every clinical visit.&rdquo;
                </blockquote>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/60">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Dr. Elena Vance, MD</p>
                    <p className="text-xs text-on-surface-variant">
                      OB-GYN &amp; Clinical Advisory Perspective
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-outline-variant shrink-0">
                    <SafeImage
                      src={DOCTOR_PORTRAIT_URL}
                      alt="Dr. Elena Vance portrait"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 px-6 bg-surface">
          <div className="max-w-5xl mx-auto bg-deep-plum text-on-primary rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-balance">
              Begin Your Personal Health Record Today
            </h2>
            <p className="text-sm sm:text-base text-primary-fixed mt-3 max-w-xl mx-auto">
              Register an account or sign in to sync your health tracking modules with the Spring Boot backend.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-7">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-surface text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors whitespace-nowrap"
              >
                Register Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-medium hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant/60 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <p>&copy; {new Date().getFullYear()} Her Health Journey. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-on-surface">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-on-surface">
              Create Account
            </Link>
            <a href="#privacy" className="hover:text-on-surface">
              Privacy Principles
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
