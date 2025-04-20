import { useContext } from "react";
import type { AuthContextType } from "../context/AuthProvider";
import { AuthContext } from "../context/AuthContext";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within the AuthProvider");
  }
  return context;
};
