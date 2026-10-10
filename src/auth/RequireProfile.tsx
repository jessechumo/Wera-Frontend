import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../api/profile';
import { ErrorState, Skeleton } from '../components/States';

/** Sends users without a complete profile to the setup wizard. */
export function RequireProfile() {
  const profile = useProfile();
  if (profile.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }
  if (profile.error) {
    return (
      <div className="mx-auto max-w-md p-6 pt-24">
        <ErrorState message="Couldn't load your profile." onRetry={() => void profile.refetch()} />
      </div>
    );
  }
  if (!profile.data?.ready) return <Navigate to="/welcome" replace />;
  return <Outlet />;
}
