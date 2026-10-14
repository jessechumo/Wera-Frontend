import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './layout/AppShell';
import {
  CommunityPage, ExcludedPage, IndustriesPage, IndustryPage, InterviewPage, NewPostPage, PostPage, ProfilePage,
  SettingsPage, SponsorshipPage, TrackerPage, WelcomePage,
} from './pages/lazy';
import { RequireAuth } from './auth/RequireAuth';
import { RequireProfile } from './auth/RequireProfile';
import { ResumeRedirect } from './profile/ResumeRedirect';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './auth/EmailPages';
import AuthPage from './auth/AuthPage';
import { Toasts } from './lib/toast';
import { announceChange } from './lib/extension';
import { ExtensionBridge } from './components/ExtensionBridge';
import { ErrorBoundary } from './components/ErrorBoundary';
import TodayPage from './pages/TodayPage';
import JobsPage from './pages/JobsPage';
import './index.css';

const queryClient = new QueryClient({
  // Every change here tells the Chrome extension (if installed) to refresh.
  mutationCache: new MutationCache({ onSuccess: () => announceChange() }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fullPage>
      <QueryClientProvider client={queryClient}>
        <ExtensionBridge />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="signup" element={<AuthPage mode="signup" />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route element={<RequireAuth />}>
                <Route path="welcome" element={<WelcomePage />} />
                <Route element={<RequireProfile />}>
                  <Route element={<AppShell />}>
                    <Route index element={<TodayPage />} />
                    <Route path="jobs" element={<JobsPage />} />
                    <Route path="jobs/:id" element={<JobsPage />} />
                    <Route path="industries" element={<IndustriesPage />} />
                    <Route path="industries/:id" element={<IndustryPage />} />
                    <Route path="tracker" element={<TrackerPage />} />
                    <Route path="resume/:id?" element={<ResumeRedirect />} />
                    <Route path="sponsorship" element={<SponsorshipPage />} />
                    <Route path="interview" element={<InterviewPage />} />
                    <Route path="community" element={<CommunityPage />} />
                    <Route path="community/new" element={<NewPostPage />} />
                    <Route path="community/:id" element={<PostPage />} />
                    <Route path="excluded" element={<ExcludedPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="profile/resume/:id?" element={<ProfilePage tab="resume" />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toasts />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
