import { Navigate, useParams } from 'react-router-dom';

/** Old /resume links (and the extension's) open the profile's Resume tab. */
export function ResumeRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/profile/resume/${id}` : '/profile/resume'} replace />;
}
