import { Navigate, useLocation } from 'react-router-dom';
import { getCookie } from '../utils/cookies';

export function RequireAuth({ children }) {
  const token = getCookie('dk24_username');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
