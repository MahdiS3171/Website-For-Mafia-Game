import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // If user is admin, redirect to dashboard
  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute; 