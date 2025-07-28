import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = false,
}) => {
  const { user } = useAuth();

  if (requiresAuth && !user) {
    // 未認証の場合はhomeにリダイレクト
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
