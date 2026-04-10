'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import LogoDonut from '@/components/ui/Logo';
import Loader from '@/components/ui/FullPageLoader';

// ─── Carousel data ────────────────────────────────────────────────────────────

const SLIDE_KEYS = [
  { titleKey: 'auth.login.slide1Title', descKey: 'auth.login.slide1Desc', svgSrc: '/login/1.svg' },
  { titleKey: 'auth.login.slide2Title', descKey: 'auth.login.slide2Desc', svgSrc: '/login/2.svg' },
  { titleKey: 'auth.login.slide3Title', descKey: 'auth.login.slide3Desc', svgSrc: '/login/3.svg' },
];

const SLIDE_INTERVAL = 5000;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, loading, checking, user, slowConnection } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { actualTheme, setTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSlideAnimating, setIsSlideAnimating] = useState(false);

  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) router.push('/dashboard');
  }, [user, loading, router]);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((prev) => (prev + 1) % SLIDE_KEYS.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = useCallback((indexOrUpdater: number | ((prev: number) => number)) => {
    setIsSlideAnimating(true);
    setTimeout(() => {
      setActiveSlide(typeof indexOrUpdater === 'function' ? indexOrUpdater : () => indexOrUpdater);
      setIsSlideAnimating(false);
    }, 250);
  }, []);

  // Button state helpers
  const getButtonClasses = () => {
    if (user) return 'bg-green-600 hover:bg-green-700 cursor-default';
    if (error) return 'bg-red-600 hover:bg-red-700';
    if (loading) return 'bg-[#1a237e] cursor-wait opacity-80';
    return 'bg-[#1a237e] hover:bg-blue-800';
  };

  const getButtonText = () => {
    if (loading && slowConnection) return t('auth.login.slowConnection');
    if (loading) return t('auth.login.loading');
    if (user) return t('auth.login.success');
    if (error) return t('auth.login.error');
    return t('auth.login.submit');
  };

  // ─── Top-level loading / success loader ────────────────────────────────────
  if (showSuccessLoader || (checking && user)) return <Loader />;

  const currentSlide = SLIDE_KEYS[activeSlide] ?? SLIDE_KEYS[0]!;

  return (
    <div dir="ltr" className="min-h-screen flex bg-white dark:bg-gray-900 relative">

      {/* ── Top-right controls: Theme + Language ──────────────────────────── */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">

        {/* Language switcher */}
        <div className="flex items-center gap-0.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-full px-1.5 py-1 shadow-sm">
          {(['en', 'fr', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={`px-2.5 py-1 rounded-full md:px-3 md:py-1.5 text-xs md:text-base font-semibold transition-all ${language === lang
                ? 'bg-[#1a237e] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-gray-600 dark:text-gray-300 hover:text-[#1a237e] dark:hover:text-blue-400 transition-all hover:scale-105"
        >
          {actualTheme === 'dark' ? (
            /* Sun icon */
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            /* Moon icon */
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── LEFT — Form panel ───────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[52%] py-12 px-4">
        <div className="w-full max-w-[600px] px-4 sm:px-8">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-[#1a237e] p-1.5 rounded-full shrink-0">
              <LogoDonut sizeClass="w-10" />
            </div>
            <span className="text-2xl font-bold text-[#1a237e] dark:text-white tracking-tight">
              MyPrescription
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">
              {t('auth.login.welcomeBack')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Slow connection alert */}
          {loading && slowConnection && (
            <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg flex items-center gap-2 animate-pulse">
              <svg className="w-4 h-4 text-amber-600 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z" />
              </svg>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t('auth.login.slowConnectionMessage')}
              </p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await login(email, password, router, setError);
                setTimeout(() => setShowSuccessLoader(true), 1000);
              } catch {
                setShowSuccessLoader(false);
              }
            }}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('auth.login.emailLabel')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center px-3.5 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder={t('auth.login.emailPlaceholder')}
                  className="w-full px-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('auth.login.passwordLabel')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center px-3.5 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/resset_password')}
                className="text-sm font-medium text-[#1a237e] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${getButtonClasses()}`}
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z" />
                </svg>
              )}
              {getButtonText()}
            </button>
          </form>

          {/* No account CTA */}
          <p className="mt-8 text-xs text-center text-gray-500 dark:text-gray-400">
            {t('auth.login.noAccount')}{' '}
            <a
              href={process.env.NEXT_PUBLIC_FRONTEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1a237e] dark:text-blue-400 hover:underline transition-colors"
            >
              {t('auth.login.contactAdvisor')}
            </a>
          </p>

          {/* Footer note */}
          <p className="mt-2 text-xs text-center text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} MyPrescription. {t('auth.login.allRightsReserved')}
          </p>
        </div>
      </div>

      {/* ── RIGHT — Visual carousel panel ───────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center lg:w-[48%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #3949ab 70%, #4a69ff 100%)' }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-blue-400 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-indigo-300 rounded-full opacity-10 blur-3xl pointer-events-none" />

        {/* Slide content */}
        <div
          className="relative z-10 flex w-full flex-col items-center text-center transition-all duration-300"
          style={{ opacity: isSlideAnimating ? 0 : 1, transform: isSlideAnimating ? 'translateY(10px)' : 'translateY(0)' }}
        >
          {/* Illustration */}
          <div className="mb-4 w-full flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSlide.svgSrc}
              alt=""
              className="w-full object-contain"
              style={{ maxHeight: '55vh' }}
            />
          </div>

          {/* Text */}
          <h2 className="text-lg xl:text-xl font-bold text-white mb-2 leading-tight">
            {t(currentSlide.titleKey)}
          </h2>
          <p className="text-blue-200 text-xs xl:text-sm leading-relaxed max-w-xs">
            {t(currentSlide.descKey)}
          </p>

          {/* Carousel dots */}
          <div className="flex items-center gap-2 mt-8">
            {SLIDE_KEYS.map((_, i) => (
              <button
                key={i}
                id={`carousel-dot-${i}`}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${i === activeSlide
                  ? 'w-6 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
