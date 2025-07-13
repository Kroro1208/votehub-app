import { createContext } from "react";
import type { AuthContextType } from "./AuthProvider.tsx";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
