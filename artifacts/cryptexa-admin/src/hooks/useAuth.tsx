import { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_jwt"));
  const [, setLocation] = useLocation();

  const login = (newToken: string) => {
    localStorage.setItem("admin_jwt", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admin_jwt");
    setToken(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
