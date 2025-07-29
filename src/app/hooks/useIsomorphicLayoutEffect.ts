import { useEffect, useLayoutEffect } from "react";

// SSRでは useLayoutEffect は警告を出すため、クライアントサイドでのみ使用
export const useIsomorphicLayoutEffect = 
  typeof window !== "undefined" ? useLayoutEffect : useEffect;