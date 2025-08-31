import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from './ui/LoadingSpinner';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, userData } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && userData?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
