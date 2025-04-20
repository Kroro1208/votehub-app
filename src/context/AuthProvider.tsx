import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../supabase-client";
import { AuthContext } from "./AuthContext";
export interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => void;
  signOut: () => void;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const signInWithGoogle = () => {
    supabase.auth.signInWithOAuth({ provider: "google" });
  };
  const signOut = () => {};
  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
