"use client";

import { useAuth } from "../hooks/useAuth";
import Loading from "./Loading";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { loading } = useAuth();

  // Issue #73: loading状態を適切に管理してクリック必要問題を解決
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
};
