import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../api/auth';

/** Admin-only routes; everyone else lands on Today. */
export function RequireAdmin() {
  const me = useMe();
  if (!me.data?.is_admin) return <Navigate to="/" replace />;
  return <Outlet />;
}
