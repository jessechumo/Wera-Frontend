import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { signOutLocally, useMe } from '../api/auth';
import { UNAUTHORIZED_EVENT } from '../api/client';
import { ErrorState, Skeleton } from '../components/States';

/** Renders its routes only with a session; otherwise sends the user to /login. */
export function RequireAuth() {
  const me = useMe();
  const qc = useQueryClient();
  const location = useLocation();

  // Any 401 from the API means the session ended (expired or logged out
  // elsewhere): forget the user so this guard redirects.
  useEffect(() => {
    const onUnauthorized = () => signOutLocally(qc);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [qc]);

  if (me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }
  if (me.error) {
    return (
      <div className="mx-auto max-w-md p-6 pt-24">
        <ErrorState message="Can't reach the Wera API." onRetry={() => void me.refetch()} />
      </div>
    );
  }
  if (!me.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
