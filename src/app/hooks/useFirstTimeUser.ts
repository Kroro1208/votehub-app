import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { useUserPointsDetail } from "./useUserPoints";

interface FirstTimeUserStatus {
  isFirstTime: boolean;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  accountAge: number;
  isLoading: boolean;
}

export const useFirstTimeUser = (): FirstTimeUserStatus => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { user } = useAuth();
  const { pointsDetail } = useUserPointsDetail();

  const accountAge = useMemo(() => {
    if (!user) return 0;

    const accountCreated = new Date(user.created_at);
    const now = new Date();
    return Math.floor(
      (now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [user]);

  const isNewUser = useMemo(() => {
    if (!user) return false;
    return accountAge <= 7;
  }, [user, accountAge]);

  const hasCompletedOnboarding = useMemo(() => {
    if (!user?.id || !mounted || typeof window === "undefined") return false;
    try {
      const completed = localStorage.getItem(`onboarding_completed_${user.id}`);
      return completed === "true";
    } catch {
      return false;
    }
  }, [user?.id, mounted]);

  const isFirstTime = useMemo(() => {
    if (!user || !mounted) return false;

    return (
      isNewUser &&
      !hasCompletedOnboarding &&
      (!pointsDetail || pointsDetail.total_points === 0)
    );
  }, [isNewUser, hasCompletedOnboarding, pointsDetail, user, mounted]);

  return {
    isFirstTime,
    isNewUser,
    hasCompletedOnboarding,
    accountAge,
    isLoading: !mounted,
  };
};
