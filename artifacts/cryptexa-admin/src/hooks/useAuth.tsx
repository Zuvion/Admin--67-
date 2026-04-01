import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_jwt"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => token);
    
    // Setup fetch interceptor logic here if needed or let apiClient handle 401
    const handleUnauthorized = (e: Event) => {
      if (e instanceof CustomEvent && e.detail === 401) {
        logout();
      }
    };
    
    window.addEventListener('api-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('api-unauthorized', handleUnauthorized);
  }, [token]);

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
