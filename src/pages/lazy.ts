import { lazyPage } from '../lib/lazyPage';

// Pages outside the daily path (Today, Jobs) load on first visit, so the
// first screen downloads less. Charts (recharts) ride with the System page.
export const IndustriesPage = lazyPage(() => import('./IndustriesPage'));
export const IndustryPage = lazyPage(() => import('./IndustryPage'));
export const TrackerPage = lazyPage(() => import('./TrackerPage'));
export const SponsorshipPage = lazyPage(() => import('./SponsorshipPage'));
export const InterviewPage = lazyPage(() => import('./InterviewPage'));
export const CommunityPage = lazyPage(() => import('./CommunityPage'));
export const NewPostPage = lazyPage(() => import('./NewPostPage'));
export const PostPage = lazyPage(() => import('./PostPage'));
export const SystemPage = lazyPage(() => import('./SystemPage'));
export const ExcludedPage = lazyPage(() => import('./ExcludedPage'));
export const ProfilePage = lazyPage(() => import('./ProfilePage'));
export const SettingsPage = lazyPage(() => import('./SettingsPage'));
export const WelcomePage = lazyPage(() => import('./WelcomePage'));
