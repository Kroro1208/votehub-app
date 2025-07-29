import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "../app/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = false,
}) => {
  const { user } = useAuth();
  const router = useRouter();

  if (requiresAuth && !user) {
    // 未認証の場合はhomeにリダイレクト
    router.push("/");
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
