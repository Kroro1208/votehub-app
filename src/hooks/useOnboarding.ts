import { useCallback } from "react";
import { useAuth } from "./useAuth";

export const useOnboarding = () => {
  const { user } = useAuth();

  const markOnboardingComplete = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(`onboarding_completed_${user.id}`, "true");
      localStorage.setItem(
        `onboarding_completed_at_${user.id}`,
        new Date().toISOString(),
      );
    }
  }, [user?.id]);

  const resetOnboarding = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`onboarding_completed_${user.id}`);
      localStorage.removeItem(`onboarding_completed_at_${user.id}`);
    }
  }, [user?.id]);

  const getOnboardingCompletedAt = useCallback(() => {
    if (!user?.id) return null;
    const completedAt = localStorage.getItem(
      `onboarding_completed_at_${user.id}`,
    );
    return completedAt ? new Date(completedAt) : null;
  }, [user?.id]);

  return {
    markOnboardingComplete,
    resetOnboarding,
    getOnboardingCompletedAt,
  };
};
