"use client";

import React, { createContext, useState, useCallback, ReactNode } from "react";

export interface PageTransitionContextType {
  isTransitioning: boolean;
  startTransition: () => void;
  endTransition: () => void;
}

export const PageTransitionContext = createContext<
  PageTransitionContextType | undefined
>(undefined);

interface PageTransitionProviderProps {
  children: ReactNode;
}

export function PageTransitionProvider({
  children,
}: PageTransitionProviderProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    // 最小限の遷移時間を確保してスムーズな体験を提供
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, []);

  return (
    <PageTransitionContext.Provider
      value={{
        isTransitioning,
        startTransition,
        endTransition,
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
}
