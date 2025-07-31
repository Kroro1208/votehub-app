import { useEffect, useLayoutEffect } from "react";

// Hydration Mismatch問題を解決するためのIsomorphic Layout Effect
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
