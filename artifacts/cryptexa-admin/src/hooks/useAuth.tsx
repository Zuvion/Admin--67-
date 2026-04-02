import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_jwt");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => {
        if (r.ok) {
          setToken(storedToken);
        } else {
          localStorage.removeItem("admin_jwt");
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("admin_jwt");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

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
    <AuthContext.Provider value={{ token, loading, login, logout }}>
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
