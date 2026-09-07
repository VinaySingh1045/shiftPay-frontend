import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import type { RootState } from '../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'employee';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Not logged in → redirect to login, remembering where they were
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged-in employee trying to access manager-only pages → redirect to their home
  if (requiredRole === 'manager' && user.role !== 'manager') {
    return <Navigate to="/employee" replace />;
  }

  // Logged-in manager trying to access employee-only pages → redirect to their home
  if (requiredRole === 'employee' && user.role !== 'employee') {
    return <Navigate to="/manager" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
