import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useUserPointsDetail } from "./useUserPoints";

interface FirstTimeUserStatus {
  isFirstTime: boolean;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  accountAge: number;
}

export const useFirstTimeUser = (): FirstTimeUserStatus => {
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
    if (!user?.id) return false;
    const completed = localStorage.getItem(`onboarding_completed_${user.id}`);
    return completed === "true";
  }, [user?.id]);

  const isFirstTime = useMemo(() => {
    if (!user) return false;

    return (
      isNewUser &&
      !hasCompletedOnboarding &&
      (!pointsDetail || pointsDetail.total_points === 0)
    );
  }, [isNewUser, hasCompletedOnboarding, pointsDetail]);

  return {
    isFirstTime,
    isNewUser,
    hasCompletedOnboarding,
    accountAge,
  };
};
