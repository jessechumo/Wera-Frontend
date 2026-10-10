import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './layout/AppShell';
import { RequireAuth } from './auth/RequireAuth';
import { RequireProfile } from './auth/RequireProfile';
import { RequireAdmin } from './auth/RequireAdmin';
import WelcomePage from './pages/WelcomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import IndustriesPage from './pages/IndustriesPage';
import IndustryPage from './pages/IndustryPage';
import AuthPage from './auth/AuthPage';
import { Toasts } from './lib/toast';
import TodayPage from './pages/TodayPage';
import JobsPage from './pages/JobsPage';
import TrackerPage from './pages/TrackerPage';
import SystemPage from './pages/SystemPage';
import ExcludedPage from './pages/ExcludedPage';
import './index.css';

const queryClient = new QueryClient({
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="signup" element={<AuthPage mode="signup" />} />
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
                <Route element={<RequireAdmin />}>
                  <Route path="system" element={<SystemPage />} />
                </Route>
                <Route path="excluded" element={<ExcludedPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toasts />
    </QueryClientProvider>
  </StrictMode>,
);
