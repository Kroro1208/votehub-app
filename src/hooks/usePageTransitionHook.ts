import { useContext } from "react";
import { PageTransitionContext } from "../context/PageTransitionContext";

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error(
      "usePageTransition must be used within a PageTransitionProvider",
    );
  }
  return context;
}
