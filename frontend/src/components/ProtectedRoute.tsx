import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // If admin access is required and user is not admin, redirect to login
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // If user is not admin and trying to access root path, redirect to results
  if (!isAdmin && window.location.pathname === "/") {
    return <Navigate to="/results" replace />;
  }

  // If user is admin and trying to access login page, redirect to dashboard
  if (isAdmin && window.location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 