import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

const RoleRoute = ({ allowedRole, children }) => {
  const { user } = useAuth();

  if (user?.role !== allowedRole) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
};

export default RoleRoute;
